import { RefObject } from 'react';
import { CircleDot, Phone, Video } from 'lucide-react';
import { ChatConversation, ChatMessage } from '@/api/chatApi';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import styles from '@/features/messages/pages/MessagesPage.module.css';

type ChatWindowProps = {
  activeConversation: ChatConversation | null;
  messages: ChatMessage[];
  currentUserId: number | null;
  draft: string;
  isSending: boolean;
  emptyLabel?: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  bottomAnchorRef: RefObject<HTMLDivElement>;
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

export const ChatWindow = ({
  activeConversation,
  messages,
  currentUserId,
  draft,
  isSending,
  emptyLabel = 'Select a conversation to start chatting',
  onDraftChange,
  onSend,
  bottomAnchorRef,
}: ChatWindowProps) => {
  if (!activeConversation) {
    return (
      <article className={styles.chatPane}>
        <div className={styles.emptyState}>{emptyLabel}</div>
      </article>
    );
  }

  return (
    <article className={styles.chatPane}>
      <div className={styles.chatHeader}>
        <div className={styles.chatIdentity}>
          <div className={styles.avatar}>{getInitials(activeConversation.user?.name)}</div>
          <div>
            <h2>{activeConversation.user?.name || 'Unknown user'}</h2>
            <p>
              <CircleDot size={12} /> Active now
            </p>
          </div>
        </div>
        <div className={styles.chatActions}>
          <button type="button" aria-label="Voice call">
            <Phone size={16} />
          </button>
          <button type="button" aria-label="Video call">
            <Video size={16} />
          </button>
        </div>
      </div>

      <div className={styles.messageStream}>
        {messages.map((message) => {
          const otherUserId = activeConversation.user?.id ?? null;
          const isOwn = otherUserId !== null
            ? Number(message.sender_id) !== Number(otherUserId)
            : (currentUserId !== null && Number(message.sender_id) === currentUserId);

          return (
            <MessageBubble
              key={String(message.id)}
              message={message}
              isOwn={isOwn}
            />
          );
        })}
        <div ref={bottomAnchorRef} />
      </div>

      <MessageInput
        value={draft}
        onChange={onDraftChange}
        onSend={onSend}
        isSending={isSending}
        disabled={!activeConversation}
      />
    </article>
  );
};
