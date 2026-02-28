// src/features/services/components/ServiceChatDrawer.tsx 
import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, X } from 'lucide-react';
import { ServiceChatMessage, ServiceItem } from
  '../types/service.types';
import styles from './ServiceChatDrawer.module.css';

interface ServiceChatDrawerProps {
  service: ServiceItem | null;
  messages: ServiceChatMessage[];
  onSend: (serviceId: string, text: string) => void;
  onClose: () => void;
}

export const ServiceChatDrawer = ({ service, messages, onSend, onClose
}: ServiceChatDrawerProps) => {
  const [input, setInput] = useState('');

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => a.timestamp - b.timestamp),
    [messages]
  );

  const handleSend = () => {
    if (!service) {
      return;
    }
    onSend(service.id, input);
    setInput('');
  };

  return (
    <AnimatePresence>
      {service && (
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
                <h4>{service.providerName}</h4>
                <p>{service.title}</p>
              </div>
              <button type="button" onClick={onClose}
                className={styles.closeButton}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.messages}>
              {sortedMessages.length === 0 ? (
                <div className={styles.emptyState}>Start a conversation
                  with this provider.</div>
              ) : (
                sortedMessages.map((message) => (
                  <div
                    key={message.id}
                    className={
                      message.sender === 'user' ?
                        styles.userMessageBubble : styles.providerMessageBubble
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