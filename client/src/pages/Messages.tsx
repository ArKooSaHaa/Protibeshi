import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ChatConversation,
  ChatMessage,
  getConversations,
  getMessages,
  markAsRead,
  sendMessage,
} from '@/api/chatApi';
import { GeminiConversationTurn, generateGeminiReply } from '@/api/geminiChatApi';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ROUTES } from '@/config/routes.config';
import { getEcho } from '@/lib/echo';
import styles from '@/features/messages/pages/MessagesPage.module.css';

const ADMIN_INBOX_FALLBACK_USERNAME = 'admin_inbox_system';
const GEMINI_CONVERSATION_ID = -900001;
const GEMINI_ASSISTANT_ID = -900002;
const GEMINI_ASSISTANT_NAME = 'Gemini Inbox';

const createGeminiWelcomeMessage = (): ChatMessage => {
  const now = new Date().toISOString();

  return {
    id: 'gemini-welcome',
    conversation_id: GEMINI_CONVERSATION_ID,
    message: 'Hi! I am Gemini. Ask me anything about your neighborhood, writing posts, or local help.',
    sender_id: GEMINI_ASSISTANT_ID,
    is_read: true,
    created_at: now,
    updated_at: now,
    sender: {
      id: GEMINI_ASSISTANT_ID,
      name: GEMINI_ASSISTANT_NAME,
      username: 'gemini_ai',
    },
  };
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

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [geminiMessages, setGeminiMessages] = useState<ChatMessage[]>(() => [createGeminiWelcomeMessage()]);
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

  const geminiConversation = useMemo<ChatConversation>(() => {
    const fallbackMessage = createGeminiWelcomeMessage();
    const firstMessage = geminiMessages[0] || fallbackMessage;
    const lastMessage = geminiMessages[geminiMessages.length - 1] || fallbackMessage;

    return {
      id: GEMINI_CONVERSATION_ID,
      listing_id: null,
      last_message: lastMessage.message,
      unread_count: 0,
      created_at: firstMessage.created_at,
      updated_at: lastMessage.updated_at || lastMessage.created_at,
      user: {
        id: GEMINI_ASSISTANT_ID,
        name: GEMINI_ASSISTANT_NAME,
        username: 'gemini_ai',
        profile_picture: null,
      },
    };
  }, [geminiMessages]);

  const conversationsWithGemini = useMemo(
    () => [geminiConversation, ...conversations],
    [conversations, geminiConversation],
  );

  const filteredConversations = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return conversationsWithGemini;
    }

    return conversationsWithGemini.filter((conversation) => {
      const name = (conversation.user?.name || '').toLowerCase();
      const preview = (conversation.last_message || '').toLowerCase();
      return name.includes(term) || preview.includes(term);
    });
  }, [conversationsWithGemini, query]);

  const activeConversation = useMemo(
    () => conversationsWithGemini.find((conversation) => conversation.id === activeConversationId) || null,
    [conversationsWithGemini, activeConversationId],
  );

  const isGeminiConversation = activeConversationId === GEMINI_CONVERSATION_ID;

  const displayedMessages = useMemo(
    () => (isGeminiConversation ? geminiMessages : messages),
    [isGeminiConversation, geminiMessages, messages],
  );

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
        if (previousId === GEMINI_CONVERSATION_ID) {
          return previousId;
        }

        if (previousId && data.some((item) => item.id === previousId)) {
          return previousId;
        }

        const params = new URLSearchParams(location.search);
        const queryId = Number(params.get('conversation'));
        if (queryId === GEMINI_CONVERSATION_ID) {
          return GEMINI_CONVERSATION_ID;
        }

        if (Number.isFinite(queryId) && data.some((item) => item.id === queryId)) {
          return queryId;
        }

        return data[0]?.id ?? GEMINI_CONVERSATION_ID;
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
    if (Number.isFinite(id)) {
      setActiveConversationId(id);
    }
  }, [location.search]);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    if (activeConversationId === GEMINI_CONVERSATION_ID) {
      setLoadingMessages(false);
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
    if (!activeConversationId || activeConversationId === GEMINI_CONVERSATION_ID) {
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
  }, [activeConversationId, currentUserId]);

  useEffect(() => {
    if (!activeConversationId || activeConversationId === GEMINI_CONVERSATION_ID) {
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
  }, [activeConversationId]);

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
      const tempId = `gemini-user-${Date.now()}`;
      const now = new Date().toISOString();
      const userMessage: ChatMessage = {
        id: tempId,
        conversation_id: GEMINI_CONVERSATION_ID,
        message: text,
        sender_id: currentUserId ?? 1,
        is_read: true,
        created_at: now,
        updated_at: now,
        sender: {
          id: currentUserId ?? 1,
          name: 'You',
        },
      };

      const history: GeminiConversationTurn[] = [...geminiMessages, userMessage].map((item) => ({
        role: Number(item.sender_id) === GEMINI_ASSISTANT_ID ? 'model' : 'user',
        text: item.message,
      }));

      setGeminiMessages((previous) => [...previous, userMessage]);
      setDraft('');
      setError(null);
      setIsSending(true);

      try {
        const reply = await generateGeminiReply(history, text);
        const replyTime = new Date().toISOString();
        const assistantMessage: ChatMessage = {
          id: `gemini-model-${Date.now()}`,
          conversation_id: GEMINI_CONVERSATION_ID,
          message: reply,
          sender_id: GEMINI_ASSISTANT_ID,
          is_read: true,
          created_at: replyTime,
          updated_at: replyTime,
          sender: {
            id: GEMINI_ASSISTANT_ID,
            name: GEMINI_ASSISTANT_NAME,
            username: 'gemini_ai',
          },
        };

        setGeminiMessages((previous) => [...previous, assistantMessage]);
      } catch (requestError) {
        const message = requestError instanceof Error ? requestError.message : 'Gemini is unavailable right now.';
        setError(message);
        setGeminiMessages((previous) => previous.filter((item) => String(item.id) !== tempId));
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
