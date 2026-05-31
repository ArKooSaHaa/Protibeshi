import { RefObject, useMemo } from 'react';
import { CircleDot, Clock3, Phone } from 'lucide-react';
import { ChatConversation, ChatMessage, ConversationCallSession } from '@/api/chatApi';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import styles from '@/features/messages/pages/MessagesPage.module.css';

type ChatWindowProps = {
  activeConversation: ChatConversation | null;
  messages: ChatMessage[];
  currentUserId: number | null;
  draft: string;
  isSending: boolean;
  isStartingCall?: boolean;
  showCallActions?: boolean;
  isReadOnly?: boolean;
  readOnlyMessage?: string | null;
  emptyLabel?: string;
  callSessions?: ConversationCallSession[];
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onStartAudioCall: () => void;
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

const formatDuration = (seconds: number) => {
  const total = Math.max(0, Math.floor(seconds || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  return `${minutes}:${String(secs).padStart(2, '0')}`;
};

const formatCallTime = (value: string | null | undefined) => {
  if (!value) {
    return 'Just now';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Just now';
  }

  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const isMissedCall = (session: ConversationCallSession) => {
  return session.status === 'ended' && !session.accepted_at;
};

const getCallDirectionLabel = (
  session: ConversationCallSession,
  currentUserId: number | null,
  activeConversation: ChatConversation | null,
) => {
  const otherName = activeConversation?.user?.name || 'the other user';
  const isOutgoing = currentUserId !== null && Number(session.initiator_id) === Number(currentUserId);

  if (isOutgoing) {
    return `You called ${otherName}`;
  }

  return `${otherName} called you`;
};

export const ChatWindow = ({
  activeConversation,
  messages,
  currentUserId,
  draft,
  isSending,
  isStartingCall = false,
  showCallActions = true,
  isReadOnly = false,
  readOnlyMessage = null,
  emptyLabel = 'Select a conversation to start chatting',
  callSessions = [],
  onDraftChange,
  onSend,
  onStartAudioCall,
  bottomAnchorRef,
}: ChatWindowProps) => {
  if (!activeConversation) {
    return (
      <article className={styles.chatPane}>
        <div className={styles.emptyState}>{emptyLabel}</div>
      </article>
    );
  }

  const timelineItems = useMemo(() => {
    const items: Array<
      | { kind: 'message'; key: string; timestamp: number; message: ChatMessage }
      | { kind: 'call'; key: string; timestamp: number; session: ConversationCallSession }
    > = [];

    messages.forEach((message) => {
      const timestamp = new Date(message.created_at).getTime();
      items.push({
        kind: 'message',
        key: `message-${String(message.id)}`,
        timestamp: Number.isFinite(timestamp) ? timestamp : 0,
        message,
      });
    });

    callSessions.forEach((session) => {
      const timestamp = new Date(session.started_at).getTime();
      items.push({
        kind: 'call',
        key: `call-${String(session.id)}`,
        timestamp: Number.isFinite(timestamp) ? timestamp : 0,
        session,
      });
    });

    items.sort((a, b) => a.timestamp - b.timestamp);
    return items;
  }, [callSessions, messages]);

  return (
    <article className={styles.chatPane}>
      <div className={styles.chatHeader}>
        <div className={styles.chatIdentity}>
          {activeConversation.user?.profile_picture ? (
            <img 
              src={activeConversation.user.profile_picture} 
              alt={activeConversation.user.name || 'User'}
              className={styles.profileAvatar}
            />
          ) : (
            <div className={styles.avatar}>{getInitials(activeConversation.user?.name)}</div>
          )}
          <div>
            <h2>{activeConversation.user?.name || 'Unknown user'}</h2>
            <p>
              <CircleDot size={12} /> Active now
            </p>
          </div>
        </div>
        {showCallActions ? (
          <div className={styles.chatActions}>
            <button
              type="button"
              aria-label="Start audio call"
              onClick={onStartAudioCall}
              disabled={isStartingCall || isReadOnly}
              title="Start audio call"
            >
              <Phone size={16} />
            </button>
          </div>
        ) : null}
      </div>

      <div className={styles.messageStream}>
        {timelineItems.map((item) => {
          if (item.kind === 'call') {
            const label = getCallDirectionLabel(item.session, currentUserId, activeConversation);
            const durationText = isMissedCall(item.session)
              ? 'Missed call'
              : `Duration ${formatDuration(item.session.duration_seconds)}`;

            return (
              <div key={item.key} className={styles.callLogRow}>
                <div className={styles.callLogBubble}>
                  <div className={styles.callLogIcon}>
                    <Phone size={16} />
                  </div>
                  <div className={styles.callLogBody}>
                    <div className={styles.callLogTitle}>Audio call</div>
                    <div className={styles.callLogSubtitle}>{label}</div>
                    <div className={styles.callLogMeta}>
                      <span>
                        <Clock3 size={12} />
                        {formatCallTime(item.session.started_at)}
                      </span>
                      <span>{durationText}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.callLogAction}
                    onClick={onStartAudioCall}
                    disabled={isReadOnly || isStartingCall}
                  >
                    Call back
                  </button>
                </div>
              </div>
            );
          }

          const otherUserId = activeConversation.user?.id ?? null;
          const isOwn = otherUserId !== null
            ? Number(item.message.sender_id) !== Number(otherUserId)
            : (currentUserId !== null && Number(item.message.sender_id) === currentUserId);

          return (
            <MessageBubble
              key={item.key}
              message={item.message}
              isOwn={isOwn}
            />
          );
        })}
        <div ref={bottomAnchorRef} />
      </div>

      {isReadOnly ? (
        <div className={styles.readOnlyNotice}>
          {readOnlyMessage || 'This conversation is read-only.'}
        </div>
      ) : null}

      {!isReadOnly ? (
        <MessageInput
          value={draft}
          onChange={onDraftChange}
          onSend={onSend}
          isSending={isSending}
          disabled={!activeConversation}
        />
      ) : null}
    </article>
  );
};
