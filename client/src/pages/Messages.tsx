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
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ROUTES } from '@/config/routes.config';
import styles from '@/features/messages/pages/MessagesPage.module.css';

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
    if (Number.isFinite(id)) {
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
  }, [messages]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadConversationList();
    }, 2500);

    return () => window.clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeConversationId) {
      return;
    }

    const intervalId = window.setInterval(async () => {
      try {
        const latest = await getMessages(activeConversationId);
        setMessages(latest);
      } catch {
        // Ignore transient polling errors.
      }
    }, 2000);

    return () => window.clearInterval(intervalId);
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
          messages={messages}
          currentUserId={currentUserId}
          draft={draft}
          isSending={isSending}
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
