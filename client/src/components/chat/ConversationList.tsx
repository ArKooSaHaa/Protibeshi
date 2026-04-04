import { Search } from 'lucide-react';
import { ChatConversation } from '@/api/chatApi';
import styles from '@/features/messages/pages/MessagesPage.module.css';

type ConversationListProps = {
  conversations: ChatConversation[];
  activeConversationId: number | null;
  query: string;
  onQueryChange: (query: string) => void;
  onSelectConversation: (conversationId: number) => void;
};

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

export const ConversationList = ({
  conversations,
  activeConversationId,
  query,
  onQueryChange,
  onSelectConversation,
}: ConversationListProps) => {
  return (
    <aside className={styles.chatListPane}>
      <div className={styles.searchWrap}>
        <Search size={16} />
        <input
          type="text"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search chats"
          aria-label="Search chats"
        />
      </div>

      <div className={styles.chatList}>
        {conversations.map((conversation) => {
          const isActive = conversation.id === activeConversationId;
          const isGeminiInbox =
            Boolean(conversation.is_gemini_inbox) || conversation.user?.username === 'gemini_ai';
          const conversationName = isGeminiInbox
            ? 'Gemini Inbox'
            : (conversation.user?.name || 'Unknown user');

          return (
            <button
              key={conversation.id}
              type="button"
              className={`${styles.chatItem} ${isActive ? styles.chatItemActive : ''}`}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <div className={styles.avatar}>{getInitials(conversationName)}</div>
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
        })}
      </div>
    </aside>
  );
};
