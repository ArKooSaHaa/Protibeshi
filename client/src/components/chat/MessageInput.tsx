import { FormEvent } from 'react';
import { Mic, Paperclip, SendHorizonal, Smile } from 'lucide-react';
import styles from '@/features/messages/pages/MessagesPage.module.css';

type MessageInputProps = {
  value: string;
  disabled?: boolean;
  isSending?: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
};

export const MessageInput = ({
  value,
  disabled = false,
  isSending = false,
  onChange,
  onSend,
}: MessageInputProps) => {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled || isSending || !value.trim()) {
      return;
    }

    onSend();
  };

  return (
    <form className={styles.composer} onSubmit={handleSubmit}>
      <button type="button" className={styles.composerAction} aria-label="Attach file" disabled={disabled}>
        <Paperclip size={17} />
      </button>
      <button type="button" className={styles.composerAction} aria-label="Open emoji picker" disabled={disabled}>
        <Smile size={17} />
      </button>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Type a message"
        aria-label="Type message"
        disabled={disabled}
      />
      <button type="button" className={styles.composerAction} aria-label="Record voice message" disabled={disabled}>
        <Mic size={17} />
      </button>
      <button
        type="submit"
        className={styles.sendButton}
        aria-label="Send message"
        disabled={disabled || isSending || !value.trim()}
      >
        <SendHorizonal size={17} />
      </button>
    </form>
  );
};
