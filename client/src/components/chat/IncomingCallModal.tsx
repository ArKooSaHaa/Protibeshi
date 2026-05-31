import { Phone, PhoneCall, X } from 'lucide-react';
import { ConversationCallSession } from '@/api/chatApi';
import styles from '@/features/messages/pages/MessagesPage.module.css';

type IncomingCallModalProps = {
  open: boolean;
  callSession: ConversationCallSession | null;
  onAccept: (callSession: ConversationCallSession) => void;
  onDecline: (callSession: ConversationCallSession) => void;
};

export const IncomingCallModal = ({ open, callSession, onAccept, onDecline }: IncomingCallModalProps) => {
  if (!callSession) {
    return null;
  }

  const callerName = callSession.initiator?.name || 'Unknown';

  return (
    <div className={`${styles.incomingCallToast} ${open ? styles.incomingCallToastOpen : ''}`} role="alert" aria-live="assertive">
      <div className={styles.incomingCallToastHeader}>
        <div className={styles.incomingCallToastIcon}>
          <PhoneCall size={18} />
        </div>
        <div className={styles.incomingCallToastCopy}>
          <strong>Incoming audio call</strong>
          <p>{callerName} is calling you</p>
        </div>
      </div>

      <div className={styles.incomingCallToastActions}>
        <button type="button" className={styles.incomingCallDecline} onClick={() => onDecline(callSession)}>
          <X size={14} /> Decline
        </button>
        <button type="button" className={styles.incomingCallAccept} onClick={() => onAccept(callSession)}>
          Answer
        </button>
      </div>
    </div>
  );
};

export default IncomingCallModal;
