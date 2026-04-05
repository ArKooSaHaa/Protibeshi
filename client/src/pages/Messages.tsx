import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getPosts } from '@/api/feedApi';
import {
  ChatConversation,
  ChatMessage,
  getConversations,
  getMessages,
  markAsRead,
  saveGeminiReply,
  sendMessage,
} from '@/api/chatApi';
import { GeminiConversationTurn, generateGeminiReply } from '@/api/geminiChatApi';
import { getReliefs } from '@/api/relief';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ROUTES } from '@/config/routes.config';
import { getComplaints } from '@/services/complaintService';
import { getListings } from '@/services/listingService';
import { getRentListings } from '@/services/rentService';
import { getServices } from '@/services/serviceService';
import { getEcho } from '@/lib/echo';
import styles from '@/features/messages/pages/MessagesPage.module.css';

const ADMIN_INBOX_FALLBACK_USERNAME = 'admin_inbox_system';
const GEMINI_INBOX_USERNAME = 'gemini_ai';
const TODAY_CONTEXT_TTL_MS = 2 * 60 * 1000;
const TODAY_ITEMS_LIMIT_PER_CATEGORY = 4;

type TodaySnapshotCache = {
  dayKey: string;
  expiresAt: number;
  context: string;
};

type TodaySnapshotSection = {
  label: string;
  count: number;
  lines: string[];
  loadError?: string;
};

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

const asString = (value: unknown): string => {
  return typeof value === 'string' ? value.trim() : '';
};

const asNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const truncateText = (value: string, limit = 120): string => {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, limit - 3)}...`;
};

const toDateValue = (value: unknown): Date | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === 'string' && value.trim()) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
};

const isSameLocalDay = (date: Date, reference: Date): boolean => {
  return (
    date.getFullYear() === reference.getFullYear()
    && date.getMonth() === reference.getMonth()
    && date.getDate() === reference.getDate()
  );
};

const isFromToday = (value: unknown, reference: Date): boolean => {
  const date = toDateValue(value);
  if (!date) {
    return false;
  }

  return isSameLocalDay(date, reference);
};

const toRecordArray = (value: unknown): Record<string, unknown>[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isObjectRecord);
};

const normalizeComplaintArray = (value: unknown): Record<string, unknown>[] => {
  if (Array.isArray(value)) {
    return value.filter(isObjectRecord);
  }

  if (isObjectRecord(value)) {
    const list = value.complaints;
    if (Array.isArray(list)) {
      return list.filter(isObjectRecord);
    }
  }

  return [];
};

const shouldInjectTodaySnapshot = (prompt: string): boolean => {
  const normalized = prompt.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  return /(today|today's|todays)/.test(normalized) || /(summary|summarize|recap|digest|overview)/.test(normalized);
};

const extractStoredUserId = (): number | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const directId = window.localStorage.getItem('user_id');
  if (directId) {
    const parsed = Number(directId);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  const keys = ['user', 'auth_user', 'authUser', 'currentUser', 'profile'];
  for (const key of keys) {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      continue;
    }

    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const fromRoot = Number(parsed?.id);
      if (Number.isFinite(fromRoot)) {
        return fromRoot;
      }

      const nestedUser = parsed?.user as Record<string, unknown> | undefined;
      const fromNested = Number(nestedUser?.id);
      if (Number.isFinite(fromNested)) {
        return fromNested;
      }
    } catch {
      continue;
    }
  }

  return null;
};

export const Messages = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const currentUserId = useMemo(() => extractStoredUserId(), []);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  const todaySnapshotCacheRef = useRef<TodaySnapshotCache | null>(null);

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const appendMessageWithoutDuplicates = (nextMessage: ChatMessage) => {
    setMessages((previous) => {
      const exists = previous.some((item) => String(item.id) === String(nextMessage.id));
      if (exists) {
        return previous;
      }

      return [...previous, nextMessage];
    });
  };

  const filteredConversations = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      const name = (conversation.user?.name || '').toLowerCase();
      const preview = (conversation.last_message || '').toLowerCase();
      return name.includes(term) || preview.includes(term);
    });
  }, [conversations, query]);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) || null,
    [conversations, activeConversationId],
  );

  const isGeminiConversation = useMemo(() => {
    if (!activeConversation) {
      return false;
    }

    return Boolean(
      activeConversation.is_gemini_inbox
      || activeConversation.user?.username === GEMINI_INBOX_USERNAME,
    );
  }, [activeConversation]);

  const displayedMessages = useMemo(() => messages, [messages]);

  const isAdminInboxConversation = useMemo(() => {
    if (!activeConversation || isGeminiConversation) {
      return false;
    }

    if (activeConversation.is_admin_inbox || activeConversation.is_read_only) {
      return true;
    }

    return activeConversation.user?.username === ADMIN_INBOX_FALLBACK_USERNAME;
  }, [activeConversation, isGeminiConversation]);

  const adminInboxReadOnlyMessage = useMemo(() => {
    if (!isAdminInboxConversation) {
      return null;
    }

    const contactEmail = activeConversation?.admin_contact_email || 'admin@gmail.com';
    return `This inbox is managed by admin and is read-only. Contact on ${contactEmail}.`;
  }, [activeConversation?.admin_contact_email, isAdminInboxConversation]);

  const loadConversationList = async () => {
    try {
      setError(null);
      const data = await getConversations();
      setConversations(data);

      setActiveConversationId((previousId) => {
        if (previousId && data.some((item) => item.id === previousId)) {
          return previousId;
        }

        const params = new URLSearchParams(location.search);
        const queryId = Number(params.get('conversation'));

        if (Number.isFinite(queryId) && data.some((item) => item.id === queryId)) {
          return queryId;
        }

        return data[0]?.id ?? null;
      });
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Failed to load conversations';
      setError(message);
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    void loadConversationList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = Number(new URLSearchParams(location.search).get('conversation'));
    if (Number.isFinite(id) && id > 0) {
      setActiveConversationId(id);
    }
  }, [location.search]);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    let alive = true;

    const loadConversationMessages = async () => {
      try {
        setLoadingMessages(true);
        const data = await getMessages(activeConversationId);

        if (!alive) {
          return;
        }

        setMessages(data);
        await markAsRead(activeConversationId);
        await loadConversationList();
      } catch (requestError) {
        if (!alive) {
          return;
        }

        const message = requestError instanceof Error ? requestError.message : 'Failed to load messages';
        setError(message);
      } finally {
        if (alive) {
          setLoadingMessages(false);
        }
      }
    };

    void loadConversationMessages();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId]);

  useEffect(() => {
    bottomAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayedMessages]);

  useEffect(() => {
    if (!activeConversationId || isGeminiConversation) {
      return;
    }

    const channelName = `chat.${activeConversationId}`;
    const echo = getEcho();

    if (!echo) {
      return;
    }

    echo
      .channel(channelName)
      .listen('.message.sent', (event: { message?: ChatMessage }) => {
        const incoming = event?.message;
        if (!incoming) {
          return;
        }

        if (currentUserId !== null && Number(incoming.sender_id) === Number(currentUserId)) {
          return;
        }

        appendMessageWithoutDuplicates(incoming);
        setConversations((previous) =>
          previous.map((conversation) =>
            conversation.id === activeConversationId
              ? {
                  ...conversation,
                  last_message: incoming.message,
                  updated_at: incoming.updated_at ?? new Date().toISOString(),
                }
              : conversation,
          ),
        );

        void markAsRead(activeConversationId);
      });

    return () => {
      echo.leave(channelName);
    };
  }, [activeConversationId, currentUserId, isGeminiConversation]);

  useEffect(() => {
    if (!activeConversationId || isGeminiConversation) {
      return;
    }

    let stopped = false;

    const syncMessages = async () => {
      try {
        const latest = await getMessages(activeConversationId);
        if (stopped) {
          return;
        }

        setMessages((previous) => {
          if (previous.length === latest.length) {
            return previous;
          }

          return latest;
        });
      } catch {
        // Keep realtime fallback silent to avoid noisy UI on transient network issues.
      }
    };

    const intervalId = window.setInterval(() => {
      void syncMessages();
    }, 3000);

    return () => {
      stopped = true;
      window.clearInterval(intervalId);
    };
  }, [activeConversationId, isGeminiConversation]);

  const handleSelectConversation = (conversationId: number) => {
    setActiveConversationId(conversationId);
    navigate(`${ROUTES.MESSAGES}?conversation=${conversationId}`, { replace: true });
  };

  const buildTodaySnapshotContext = useCallback(async (): Promise<string | null> => {
    const now = new Date();
    const dayKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    const cached = todaySnapshotCacheRef.current;

    if (cached && cached.dayKey === dayKey && cached.expiresAt > Date.now()) {
      return cached.context;
    }

    const [feedResult, marketplaceResult, rentResult, serviceResult, complaintResult, reliefResult] =
      await Promise.allSettled([
        getPosts(),
        getListings(),
        getRentListings(),
        getServices(),
        getComplaints(),
        getReliefs(),
      ]);

    const sections: TodaySnapshotSection[] = [];

    if (feedResult.status === 'fulfilled') {
      const todayItems = toRecordArray(feedResult.value).filter((item) => isFromToday(item.created_at, now));

      sections.push({
        label: 'Feed Posts',
        count: todayItems.length,
        lines: todayItems.slice(0, TODAY_ITEMS_LIMIT_PER_CATEGORY).map((item) => {
          const title = asString(item.title) || 'Untitled post';
          const description = asString(item.short_description) || asString(item.content);
          const locationText = asString(item.location);
          const compactDescription = truncateText(description || 'No description', 90);
          return `${title} | ${compactDescription}${locationText ? ` | ${locationText}` : ''}`;
        }),
      });
    } else {
      sections.push({
        label: 'Feed Posts',
        count: 0,
        lines: [],
        loadError: feedResult.reason instanceof Error ? feedResult.reason.message : 'Failed to load',
      });
    }

    if (marketplaceResult.status === 'fulfilled') {
      const todayItems = toRecordArray(marketplaceResult.value).filter((item) => isFromToday(item.created_at, now));

      sections.push({
        label: 'Marketplace Posts',
        count: todayItems.length,
        lines: todayItems.slice(0, TODAY_ITEMS_LIMIT_PER_CATEGORY).map((item) => {
          const title = asString(item.title) || 'Untitled listing';
          const category = asString(item.category) || 'Uncategorized';
          const price = asString(item.price) || (asNumber(item.price) !== null ? String(asNumber(item.price)) : 'N/A');
          const locationText = asString(item.location);
          return `${title} | ${category} | price: ${price}${locationText ? ` | ${locationText}` : ''}`;
        }),
      });
    } else {
      sections.push({
        label: 'Marketplace Posts',
        count: 0,
        lines: [],
        loadError: marketplaceResult.reason instanceof Error ? marketplaceResult.reason.message : 'Failed to load',
      });
    }

    if (rentResult.status === 'fulfilled') {
      const todayItems = toRecordArray(rentResult.value).filter((item) => isFromToday(item.created_at, now));

      sections.push({
        label: 'Rent Posts',
        count: todayItems.length,
        lines: todayItems.slice(0, TODAY_ITEMS_LIMIT_PER_CATEGORY).map((item) => {
          const title = asString(item.title) || 'Untitled rent listing';
          const price = asString(item.price) || (asNumber(item.price) !== null ? String(asNumber(item.price)) : 'N/A');
          const locationText = asString(item.location);
          const beds = asNumber(item.beds);
          return `${title} | price: ${price}${beds !== null ? ` | beds: ${beds}` : ''}${locationText ? ` | ${locationText}` : ''}`;
        }),
      });
    } else {
      sections.push({
        label: 'Rent Posts',
        count: 0,
        lines: [],
        loadError: rentResult.reason instanceof Error ? rentResult.reason.message : 'Failed to load',
      });
    }

    if (serviceResult.status === 'fulfilled') {
      const todayItems = toRecordArray(serviceResult.value).filter((item) => isFromToday(item.createdAt, now));

      sections.push({
        label: 'Service Posts',
        count: todayItems.length,
        lines: todayItems.slice(0, TODAY_ITEMS_LIMIT_PER_CATEGORY).map((item) => {
          const title = asString(item.title) || 'Untitled service';
          const category = asString(item.category) || 'Other';
          const shortDescription = asString(item.shortDescription) || asString(item.fullDescription);
          const price = asString(item.price) || (asNumber(item.price) !== null ? String(asNumber(item.price)) : 'N/A');
          const compactDescription = truncateText(shortDescription || 'No description', 90);
          return `${title} | ${category} | price: ${price} | ${compactDescription}`;
        }),
      });
    } else {
      sections.push({
        label: 'Service Posts',
        count: 0,
        lines: [],
        loadError: serviceResult.reason instanceof Error ? serviceResult.reason.message : 'Failed to load',
      });
    }

    if (complaintResult.status === 'fulfilled') {
      const complaintItems = normalizeComplaintArray(complaintResult.value);
      const todayItems = complaintItems.filter((item) => isFromToday(item.created_at, now));

      sections.push({
        label: 'Complaint Posts',
        count: todayItems.length,
        lines: todayItems.slice(0, TODAY_ITEMS_LIMIT_PER_CATEGORY).map((item) => {
          const title = asString(item.title) || 'Untitled complaint';
          const priority = asString(item.priority) || 'normal';
          const status = asString(item.status) || 'open';
          const locationText = asString(item.location);
          const description = truncateText(asString(item.description) || 'No description', 90);
          return `${title} | priority: ${priority} | status: ${status}${locationText ? ` | ${locationText}` : ''} | ${description}`;
        }),
      });
    } else {
      sections.push({
        label: 'Complaint Posts',
        count: 0,
        lines: [],
        loadError: complaintResult.reason instanceof Error ? complaintResult.reason.message : 'Failed to load',
      });
    }

    if (reliefResult.status === 'fulfilled') {
      const todayItems = toRecordArray(reliefResult.value).filter((item) => isFromToday(item.created_at, now));

      sections.push({
        label: 'Relief Posts',
        count: todayItems.length,
        lines: todayItems.slice(0, TODAY_ITEMS_LIMIT_PER_CATEGORY).map((item) => {
          const title = asString(item.title) || 'Untitled relief request';
          const type = asString(item.type) || 'unknown';
          const urgency = asString(item.urgency) || 'normal';
          const locationText = asString(item.location);
          const description = truncateText(asString(item.description) || 'No description', 90);
          return `${title} | ${type} | urgency: ${urgency}${locationText ? ` | ${locationText}` : ''} | ${description}`;
        }),
      });
    } else {
      sections.push({
        label: 'Relief Posts',
        count: 0,
        lines: [],
        loadError: reliefResult.reason instanceof Error ? reliefResult.reason.message : 'Failed to load',
      });
    }

    const hasAnyData = sections.some((section) => section.count > 0);
    const hasAnyErrors = sections.some((section) => Boolean(section.loadError));

    if (!hasAnyData && !hasAnyErrors) {
      return null;
    }

    const countsLine = sections
      .map((section) => `${section.label}: ${section.count}`)
      .join(' | ');

    const sectionLines = sections.map((section) => {
      if (section.loadError) {
        return `${section.label} (today count: 0)\n- Could not load: ${section.loadError}`;
      }

      if (section.lines.length === 0) {
        return `${section.label} (today count: 0)\n- No posts today.`;
      }

      const listed = section.lines.map((line, index) => `${index + 1}. ${line}`).join('\n');
      return `${section.label} (today count: ${section.count})\n${listed}`;
    }).join('\n\n');

    const context = [
      'TODAY COMMUNITY SNAPSHOT (Protibeshi backend data)',
      `Snapshot time: ${now.toLocaleString()}`,
      `Counts: ${countsLine}`,
      '',
      sectionLines,
    ].join('\n');

    todaySnapshotCacheRef.current = {
      dayKey,
      expiresAt: Date.now() + TODAY_CONTEXT_TTL_MS,
      context,
    };

    return context;
  }, []);

  const buildGeminiPromptWithTodaySnapshot = useCallback(async (rawPrompt: string): Promise<string> => {
    if (!shouldInjectTodaySnapshot(rawPrompt)) {
      return rawPrompt;
    }

    const snapshotContext = await buildTodaySnapshotContext();
    if (!snapshotContext) {
      return rawPrompt;
    }

    return [
      'Use the backend snapshot below as the source of truth for requests about today updates/summary.',
      'If a category has 0 posts today, explicitly mention it.',
      'If a category failed to load, state that it could not be loaded.',
      '',
      snapshotContext,
      '',
      `User request: ${rawPrompt}`,
    ].join('\n');
  }, [buildTodaySnapshotContext]);

  const handleSend = async () => {
    if (!activeConversationId) {
      return;
    }

    const text = draft.trim();
    if (!text) {
      return;
    }

    if (isGeminiConversation) {
      const geminiSenderId = Number(activeConversation?.user?.id || 0);
      if (!geminiSenderId) {
        setError('Gemini inbox is not available right now.');
        return;
      }

      const tempId = `gemini-user-${Date.now()}`;
      const now = new Date().toISOString();
      const optimisticUserMessage: ChatMessage = {
        id: tempId,
        conversation_id: activeConversationId,
        message: text,
        sender_id: currentUserId ?? 0,
        is_read: false,
        created_at: now,
        updated_at: now,
        sender: currentUserId
          ? {
              id: currentUserId,
              name: 'You',
            }
          : null,
      };

      const history: GeminiConversationTurn[] = messages.map((item) => ({
        role: Number(item.sender_id) === geminiSenderId ? 'model' : 'user',
        text: item.message,
      }));

      setMessages((previous) => [...previous, optimisticUserMessage]);
      setConversations((previous) =>
        previous.map((conversation) =>
          conversation.id === activeConversationId
            ? {
                ...conversation,
                last_message: text,
                updated_at: now,
              }
            : conversation,
        ),
      );

      setDraft('');
      setError(null);
      setIsSending(true);

      try {
        const userPersisted = await sendMessage(activeConversationId, text);
        setMessages((previous) =>
          previous.map((message) =>
            String(message.id) === tempId ? userPersisted.message : message,
          ),
        );

        const enrichedPrompt = await buildGeminiPromptWithTodaySnapshot(text);
        const reply = await generateGeminiReply(history, enrichedPrompt);
        const assistantPersisted = await saveGeminiReply(activeConversationId, reply);
        appendMessageWithoutDuplicates(assistantPersisted.message);

        await markAsRead(activeConversationId);
        await loadConversationList();
      } catch (requestError) {
        const message = requestError instanceof Error ? requestError.message : 'Gemini is unavailable right now.';
        setError(message);
        setMessages((previous) => previous.filter((item) => String(item.id) !== tempId));
        setDraft(text);
      } finally {
        setIsSending(false);
      }

      return;
    }

    if (isAdminInboxConversation) {
      setError(adminInboxReadOnlyMessage || 'This admin inbox is read-only.');
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      conversation_id: activeConversationId,
      message: text,
      sender_id: currentUserId ?? 0,
      is_read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender: currentUserId
        ? {
            id: currentUserId,
            name: 'You',
          }
        : null,
    };

    setMessages((previous) => [...previous, optimisticMessage]);
    setConversations((previous) =>
      previous.map((conversation) =>
        conversation.id === activeConversationId
          ? {
              ...conversation,
              last_message: text,
              updated_at: new Date().toISOString(),
            }
          : conversation,
      ),
    );

    setDraft('');
    setError(null);
    setIsSending(true);

    try {
      const response = await sendMessage(activeConversationId, text);
      setMessages((previous) =>
        previous.map((message) => (String(message.id) === tempId ? response.message : message)),
      );
      await loadConversationList();
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Failed to send message';
      setError(message);
      setMessages((previous) => previous.filter((item) => String(item.id) !== tempId));
      setDraft(text);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className={styles.page}>
      <div className={styles.messagingShell}>
        <ConversationList
          conversations={filteredConversations}
          activeConversationId={activeConversationId}
          query={query}
          onQueryChange={setQuery}
          onSelectConversation={handleSelectConversation}
        />

        <ChatWindow
          activeConversation={activeConversation}
          messages={displayedMessages}
          currentUserId={currentUserId}
          draft={draft}
          isSending={isSending}
          isReadOnly={!isGeminiConversation && isAdminInboxConversation}
          readOnlyMessage={!isGeminiConversation ? adminInboxReadOnlyMessage : null}
          onDraftChange={setDraft}
          onSend={handleSend}
          bottomAnchorRef={bottomAnchorRef}
          emptyLabel="Select a conversation to start chatting"
        />
      </div>

      {loadingConversations || loadingMessages ? (
        <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }} aria-hidden="true">
          Loading...
        </div>
      ) : null}

      {error ? (
        <div
          style={{
            position: 'fixed',
            right: 20,
            bottom: 20,
            background: '#b91c1c',
            color: '#fff',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: 13,
            zIndex: 250,
          }}
        >
          {error}
        </div>
      ) : null}
    </section>
  );
};
