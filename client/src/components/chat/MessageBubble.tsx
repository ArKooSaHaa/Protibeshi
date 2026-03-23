import { CheckCheck } from 'lucide-react';
import { ChatMessage } from '@/api/chatApi';
import styles from '@/features/messages/pages/MessagesPage.module.css';

type MessageBubbleProps = {
  message: ChatMessage;
  isOwn: boolean;
};

const formatMessageTime = (raw: string | undefined) => {
  if (!raw) {
    return 'Now';
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return 'Now';
  }

  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

export const MessageBubble = ({ message, isOwn }: MessageBubbleProps) => {
  const senderName = message.sender?.name || 'User';

  return (
    <div className={`${styles.messageRow} ${isOwn ? styles.messageRowMine : ''}`}>
      <div className={`${styles.messageBubble} ${isOwn ? styles.messageBubbleMine : ''}`}>
        <strong>{isOwn ? 'You' : senderName}</strong>
        <p>{message.message}</p>
        <div className={styles.messageMeta}>
          <span>{formatMessageTime(message.created_at)}</span>
          {isOwn ? (
            <span className={styles.statusWrap}>
              <CheckCheck size={12} />
              {message.is_read ? 'read' : 'sent'}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};
