import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import styles from './PostComposerModal.module.css';

export const PostComposerModal = ({ onClose, onSubmit }) => {
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [details, setDetails] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ headline, description, details });
  };

  return (
    <AnimatePresence>
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className={styles.modal}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          role="dialog"
          aria-modal="true"
          aria-label="Create post"
        >
          <div className={styles.header}>
            <h3 className={styles.title}>Create post</h3>
            <button type="button" className={styles.closeButton} onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.field}>
              <span className={styles.label}>Post headline</span>
              <input
                className={styles.input}
                type="text"
                placeholder="Give your post a clear headline"
                value={headline}
                onChange={(event) => setHeadline(event.target.value)}
                required
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Short description</span>
              <textarea
                className={styles.textarea}
                placeholder="Add a short summary for quick context"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>All the information</span>
              <textarea
                className={styles.textarea}
                placeholder="Share full details, updates, and extra info"
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                rows={5}
              />
            </label>

            <div className={styles.actions}>
              <button type="button" className={styles.cancelButton} onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className={styles.submitButton} disabled={!headline.trim()}>
                Post
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
