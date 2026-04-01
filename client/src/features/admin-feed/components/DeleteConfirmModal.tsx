import { AnimatePresence, motion } from 'framer-motion';
import { TriangleAlert, X } from 'lucide-react';
import type { AdminFeedPost } from '../types/adminFeed.types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  previewPosts: AdminFeedPost[];
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal = ({
  isOpen,
  previewPosts,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) => {
  const isBulk = previewPosts.length > 1;

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="afd-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.section
            className="afd-modal-card afd-modal-compact"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Delete confirmation"
          >
            <header className="afd-modal-header">
              <div>
                <p className="afd-modal-kicker">Destructive Action</p>
                <h3 className="afd-modal-title">Delete {isBulk ? `${previewPosts.length} posts` : 'this post'}?</h3>
                <p className="afd-modal-meta">This action keeps the post in deleted archive count.</p>
              </div>
              <button type="button" className="afd-modal-close" onClick={onClose} aria-label="Close delete dialog">
                <X size={18} />
              </button>
            </header>

            <div className="afd-delete-warning">
              <TriangleAlert size={16} />
              <p>
                {isBulk
                  ? 'You are about to remove multiple posts from the active feed queue.'
                  : 'You are about to remove this post from the active feed queue.'}
              </p>
            </div>

            {previewPosts.length > 0 ? (
              <ul className="afd-delete-preview">
                {previewPosts.slice(0, 4).map((post) => (
                  <li key={post.id}>
                    <span>{post.user.name}</span>
                    <span>{post.id}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            <footer className="afd-modal-actions">
              <motion.button
                type="button"
                className="afd-btn afd-btn-ghost"
                whileTap={{ scale: 0.97 }}
                onClick={onClose}
              >
                Cancel
              </motion.button>
              <motion.button
                type="button"
                className="afd-btn afd-btn-danger afd-ripple-btn"
                whileTap={{ scale: 0.97 }}
                onClick={onConfirm}
              >
                Confirm Delete
              </motion.button>
            </footer>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
