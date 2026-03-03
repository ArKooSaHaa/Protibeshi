import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, X } from 'lucide-react';
import styles from './RentChatDrawer.module.css';

const RentChatDrawer = ({ listing, messages, onSend, onClose }) => {
  const [input, setInput] = useState('');

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => a.timestamp - b.timestamp),
    [messages]
  );

  const handleSend = () => {
    const text = input.trim();

    if (!listing || !text) {
      return;
    }

    onSend(listing.id, text);
    setInput('');
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
              <button
                type="button"
                className={styles.closeButton}
                onClick={onClose}
              >
                <X size={16} />
              </button>
            </div>

            <div className={styles.messages}>
              {sortedMessages.length === 0 ? (
                <div className={styles.emptyState}>
                  Start a conversation about this property.
                </div>
              ) : (
                sortedMessages.map((message) => (
                  <div
                    key={message.id}
                    className={
                      message.sender === 'user' ?
                        styles.userBubble : styles.providerBubble
                    }
                  >
                    {message.text}
                  </div>
                ))
              )}
            </div>

            <div className={styles.composer}>
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Type a message..."
              />
              <motion.button
                type="button"
                className={styles.sendButton}
                whileHover={{ y: -1 }}
                whileTap={{ y: 1 }}
                onClick={handleSend}
              >
                <Send size={14} />
              </motion.button>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RentChatDrawer;
