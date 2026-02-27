//src/features/feed/components/AiAssistantPanel.jsx
import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Send, Sparkles, X } from "lucide-react";
import styles from "./AiAssistantPanel.module.css";
export const AiAssistantPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      type: "ai",
      content:
        "Hi! I am your Protibeshi AI. Ask me anything about your neighborhood — routes, safety, services, or events.",
    },
  ]);
  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      setMessages([...messages, { type: "user", content: input }]);
      setInput("");
      // Simulate AI response
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            type: "ai",
            content:
              "I'd be happy to help! However, this is a demo interface. In the full version, I would provide helpful information about your neighborhood.",
          },
        ]);
      }, 1000);
    }
  };
  return (
    <>
      <motion.button
        type="button"
        className={styles.bubble}
        initial={{ opacity: 0, scale: 0.86, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.6 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        aria-label="Open Protibeshi AI chat"
      >
        <MessageCircle size={18} />
      </motion.button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.container}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className={styles.header}>
              <div className={styles.titleRow}>
                <h3 className={styles.title}>Protibeshi AI (mock)</h3>
                <span className={styles.status}>
                  <span className={styles.statusDot} />
                  Ready
                </span>
              </div>
              <motion.button
                type="button"
                className={styles.closeButton}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => setIsOpen(false)}
                aria-label="Close Protibeshi AI chat"
              >
                <X size={16} />
              </motion.button>
            </div>
            <p className={styles.subtitle}>
              Front-end only • no data is sent anywhere
            </p>
            <div className={styles.chat}>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`${styles.message} ${
                    message.type === "user"
                      ? styles.messageUser
                      : styles.messageAi
                  }`}
                >
                  {message.type === "ai" && (
                    <div className={styles.aiIcon}>
                      <Sparkles size={14} />
                    </div>
                  )}
                  <div className={styles.messageContent}>
                    <p className={styles.messageText}>{message.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <form className={styles.inputArea} onSubmit={handleSubmit}>
              <input
                type="text"
                className={styles.input}
                placeholder="Ask anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <motion.button
                type="submit"
                className={styles.sendButton}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={!input.trim()}
              >
                <Send size={16} />
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
