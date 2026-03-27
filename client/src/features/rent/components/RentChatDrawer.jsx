import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, X } from 'lucide-react';
import styles from './RentChatDrawer.module.css';

const RentChatDrawer = ({
  listing,
  messages,
  isLoading,
  isSending,
  error,
  currentUserId,
  onSend,
  onOpenInMessages,
  onClose,
}) => {
  const [input, setInput] = useState('');

  const sortedMessages = useMemo(() => {
    const toTimestamp = (value) => {
      if (!value) {
        return 0;
      }

      const parsed = Date.parse(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    };

    return [...messages].sort((a, b) => toTimestamp(a.created_at) - toTimestamp(b.created_at));
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();

    if (!listing || !text || isSending) {
      return;
    }

    const sent = await onSend(text);
    if (sent) {
      setInput('');
    }
  };

  return (
    <AnimatePresence>
      {listing && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.aside
            className={styles.drawer}
            initial={{ x: 440 }}
            animate={{ x: 0 }}
            exit={{ x: 440 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.header}>
              <div>
                <h4>{listing.verified ? 'Verified landlord' : 'Property owner'}</h4>
                <p>{listing.title}</p>
              </div>
              <div className={styles.headerActions}>
                <button
                  type="button"
                  className={styles.messagesButton}
                  onClick={onOpenInMessages}
                  disabled={isLoading}
                >
                  Messages
                </button>
                <button
                  type="button"
                  className={styles.closeButton}
                  onClick={onClose}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className={styles.messages}>
              {isLoading ? (
                <div className={styles.emptyState}>Loading conversation...</div>
              ) : null}

              {!isLoading && error ? (
                <div className={styles.errorState}>{error}</div>
              ) : null}

              {!isLoading && sortedMessages.length === 0 ? (
                <div className={styles.emptyState}>
                  Start a conversation about this property.
                </div>
              ) : (
                sortedMessages.map((message) => (
                  <div
                    key={String(message.id)}
                    className={
                      currentUserId !== null && Number(message.sender_id) === Number(currentUserId) ?
                        styles.userBubble : styles.providerBubble
                    }
                  >
                    {message.message}
                  </div>
                ))
              )}
            </div>

            <div className={styles.composer}>
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Type a message..."
                disabled={isLoading || isSending}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
              />
              <motion.button
                type="button"
                className={styles.sendButton}
                whileHover={{ y: -1 }}
                whileTap={{ y: 1 }}
                onClick={() => void handleSend()}
                disabled={isLoading || isSending || !input.trim()}
              >
                {isSending ? '...' : <Send size={14} />}
              </motion.button>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RentChatDrawer;
