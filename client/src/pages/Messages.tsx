import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ROUTES } from '@/config/routes.config';
import { getEcho } from '@/lib/echo';
import styles from '@/features/messages/pages/MessagesPage.module.css';

const ADMIN_INBOX_FALLBACK_USERNAME = 'admin_inbox_system';
const GEMINI_INBOX_USERNAME = 'gemini_ai';

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

        const reply = await generateGeminiReply(history, text);
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
