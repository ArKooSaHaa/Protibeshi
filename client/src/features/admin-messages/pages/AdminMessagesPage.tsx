import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Inbox, Search } from 'lucide-react';
import type { ChatConversation, ChatMessage } from '@/api/chatApi';
import { ChatWindow } from '@/components/chat/ChatWindow';
import styles from '@/features/messages/pages/MessagesPage.module.css';
import adminStyles from '../styles/AdminMessagesPage.module.css';
import type { AdminInboxUser } from '../types/adminInbox.types';
import {
  fetchAdminInboxConversations,
  fetchAdminInboxMessages,
  markAdminInboxRead,
  searchAdminInboxUsers,
  sendAdminInboxMessage,
  startAdminInboxConversation,
} from '../services/adminInboxService';

const getInitials = (name: string | null | undefined) => {
  if (!name) {
    return 'U';
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return 'U';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const upsertConversation = (
  items: ChatConversation[],
  conversation: ChatConversation,
): ChatConversation[] => {
  const filtered = items.filter((item) => item.id !== conversation.id);
  return [conversation, ...filtered];
};

export const AdminMessagesPage = () => {
  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  const chatListRef = useRef<HTMLDivElement | null>(null);

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isStartingConversation, setIsStartingConversation] = useState(false);
  const [searchResults, setSearchResults] = useState<AdminInboxUser[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
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

  const loadConversations = useCallback(async () => {
    setLoadingConversations(true);
    setError(null);

    try {
      const data = await fetchAdminInboxConversations();
      setConversations(data);

      setActiveConversationId((previousId) => {
        if (previousId && data.some((item) => item.id === previousId)) {
          return previousId;
        }

        return data[0]?.id ?? null;
      });
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Failed to load conversations.';
      setError(message);
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    let alive = true;

    const loadConversationMessages = async () => {
      try {
        setLoadingMessages(true);
        const data = await fetchAdminInboxMessages(activeConversationId);

        if (!alive) {
          return;
        }

        setMessages(data);
        await markAdminInboxRead(activeConversationId);
        setConversations((previous) =>
          previous.map((conversation) =>
            conversation.id === activeConversationId
              ? { ...conversation, unread_count: 0 }
              : conversation,
          ),
        );
      } catch (requestError) {
        if (!alive) {
          return;
        }

        const message = requestError instanceof Error ? requestError.message : 'Failed to load messages.';
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
  }, [activeConversationId]);

  useEffect(() => {
    bottomAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const term = query.trim();

    if (term.length < 2) {
      setSearchResults([]);
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    let active = true;
    setIsSearching(true);
    setSearchError(null);

    const timeout = window.setTimeout(async () => {
      try {
        const results = await searchAdminInboxUsers(term);
        if (!active) {
          return;
        }

        setSearchResults(results);
      } catch (requestError) {
        if (!active) {
          return;
        }

        const message = requestError instanceof Error ? requestError.message : 'User search failed.';
        setSearchResults([]);
        setSearchError(message);
      } finally {
        if (active) {
          setIsSearching(false);
        }
      }
    }, 320);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [query]);

  const handleSelectConversation = (conversationId: number) => {
    setActiveConversationId(conversationId);
  };

  useEffect(() => {
    if (!activeConversationId || !chatListRef.current) {
      return;
    }

    const selector = `[data-conversation-id="${activeConversationId}"]`;
    const el = chatListRef.current.querySelector(selector) as HTMLElement | null;
    if (!el) {
      return;
    }

    const container = chatListRef.current;
    const containerRect = container.getBoundingClientRect();
    const itemRect = el.getBoundingClientRect();
    const nextScrollTop =
      container.scrollTop + (itemRect.top - containerRect.top) - container.clientHeight / 2 + itemRect.height / 2;

    container.scrollTo({
      top: Math.max(0, nextScrollTop),
      behavior: 'smooth',
    });

    // Add a brief highlight animation to make the selected user stand out
    el.classList.add(styles.chatItemPulse);
    const timer = window.setTimeout(() => {
      el.classList.remove(styles.chatItemPulse);
    }, 1200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [activeConversationId, filteredConversations]);

  const handleSelectUser = useCallback(async (user: AdminInboxUser) => {
    setIsStartingConversation(true);
    setError(null);

    try {
      const conversation = await startAdminInboxConversation(user.id);
      setConversations((previous) => upsertConversation(previous, conversation));
      setActiveConversationId(conversation.id);
      setQuery('');
      setSearchResults([]);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Failed to start conversation.';
      setError(message);
    } finally {
      setIsStartingConversation(false);
    }
  }, []);

  const appendMessageWithoutDuplicates = (nextMessage: ChatMessage) => {
    setMessages((previous) => {
      const exists = previous.some((item) => String(item.id) === String(nextMessage.id));
      if (exists) {
        return previous;
      }

      return [...previous, nextMessage];
    });
  };

  const handleSendMessage = useCallback(async () => {
    const trimmed = draft.trim();
    if (!activeConversationId || !trimmed || isSending) {
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const sent = await sendAdminInboxMessage(activeConversationId, trimmed);
      appendMessageWithoutDuplicates(sent);
      setDraft('');

      const updatedAt = sent.updated_at ?? new Date().toISOString();

      setConversations((previous) => {
        const updated = previous.map((conversation) =>
          conversation.id === activeConversationId
            ? {
                ...conversation,
                last_message: sent.message,
                updated_at: updatedAt,
              }
            : conversation,
        );

        const active = updated.find((conversation) => conversation.id === activeConversationId);
        if (!active) {
          return updated;
        }

        return [active, ...updated.filter((conversation) => conversation.id !== activeConversationId)];
      });
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Failed to send message.';
      setError(message);
    } finally {
      setIsSending(false);
    }
  }, [activeConversationId, draft, isSending]);

  const searchActive = query.trim().length >= 2;

  return (
    <section className={styles.page} aria-label="Admin messages">
      {error ? <div className={adminStyles.errorBanner}>{error}</div> : null}
      <div className={styles.messagingShell}>
        <aside className={styles.chatListPane}>
          <div className={adminStyles.adminHeader}>
            <span className={adminStyles.adminBadge}>
              <Inbox size={14} />
              Admin Inbox
            </span>
            <h2 className={adminStyles.adminTitle}>Resident messaging</h2>
            <p className={adminStyles.adminSubtitle}>
              Search a username and start a direct message thread.
            </p>
          </div>

          <div className={styles.searchWrap}>
            <Search size={16} />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by username or name"
              aria-label="Search by username"
            />
          </div>

          {searchActive ? (
            <div className={adminStyles.searchResults}>
              <div className={adminStyles.searchResultsHeader}>
                <span>Search results</span>
                {isSearching || isStartingConversation ? (
                  <span className={adminStyles.loadingBadge}>
                    {isStartingConversation ? 'Opening...' : 'Searching...'}
                  </span>
                ) : null}
              </div>

              {searchError ? (
                <p className={adminStyles.searchEmpty}>{searchError}</p>
              ) : searchResults.length === 0 && !isSearching ? (
                <p className={adminStyles.searchEmpty}>No matching users found.</p>
              ) : (
                searchResults.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    className={adminStyles.searchResultItem}
                    onClick={() => void handleSelectUser(user)}
                    disabled={isStartingConversation}
                  >
                    {user.profile_picture ? (
                      <img
                        src={user.profile_picture}
                        alt={user.name}
                        className={styles.profileAvatar}
                      />
                    ) : (
                      <div className={styles.avatar}>{getInitials(user.name)}</div>
                    )}
                    <div className={adminStyles.searchResultMeta}>
                      <strong>{user.name}</strong>
                      <span>{user.username ? `@${user.username}` : 'No username'}</span>
                    </div>
                    <span className={adminStyles.searchResultAction}>Message</span>
                  </button>
                ))
              )}
            </div>
          ) : (
            <p className={adminStyles.helperText}>Type at least 2 characters to search residents.</p>
          )}

          <p className={adminStyles.sectionLabel}>Inbox conversations</p>

          <div className={styles.chatList} ref={chatListRef}>
            {loadingConversations ? (
              <p className={adminStyles.helperText}>Loading inbox threads...</p>
            ) : null}

            {!loadingConversations && filteredConversations.length === 0 ? (
              <p className={adminStyles.helperText}>No admin inbox conversations yet.</p>
            ) : null}

            {!loadingConversations && filteredConversations.length > 0 && (
              filteredConversations.map((conversation) => {
                const isActive = conversation.id === activeConversationId;
                const conversationName = conversation.user?.name || 'Unknown user';

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    id={`conversation-${conversation.id}`}
                    data-conversation-id={conversation.id}
                    className={`${styles.chatItem} ${isActive ? styles.chatItemActive : ''}`}
                    onClick={() => handleSelectConversation(conversation.id)}
                  >
                    {conversation.user?.profile_picture ? (
                      <img
                        src={conversation.user.profile_picture}
                        alt={conversationName}
                        className={styles.profileAvatar}
                      />
                    ) : (
                      <div className={styles.avatar}>{getInitials(conversationName)}</div>
                    )}
                    <div className={styles.chatMeta}>
                      <div className={styles.chatMetaHead}>
                        <h3>{conversationName}</h3>
                        <span>
                          {conversation.updated_at
                            ? new Date(conversation.updated_at).toLocaleTimeString([], {
                                hour: 'numeric',
                                minute: '2-digit',
                              })
                            : ''}
                        </span>
                      </div>
                      <div className={styles.chatMetaBody}>
                        <p>{conversation.last_message || 'No messages yet'}</p>
                        {conversation.unread_count > 0 ? <small>{conversation.unread_count}</small> : null}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <ChatWindow
          activeConversation={activeConversation}
          messages={messages}
          currentUserId={null}
          draft={draft}
          isSending={isSending}
          isStartingCall={false}
          showCallActions={false}
          onDraftChange={setDraft}
          onSend={handleSendMessage}
          onStartAudioCall={() => undefined}
          bottomAnchorRef={bottomAnchorRef}
          emptyLabel={loadingMessages ? 'Loading messages...' : 'Select a conversation to start messaging.'}
        />
      </div>
    </section>
  );
};
