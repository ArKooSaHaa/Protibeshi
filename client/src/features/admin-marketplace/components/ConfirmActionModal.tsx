import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import type { ConfirmActionType } from '../types/adminMarketplace.types';

interface ConfirmActionModalProps {
  isOpen: boolean;
  actionType: ConfirmActionType | null;
  affectedCount: number;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const actionMeta: Record<
  ConfirmActionType,
  { title: string; description: string; confirmLabel: string; confirmClass: string }
> = {
  delete: {
    title: 'Delete listing?',
    description: 'This listing will be removed from active moderation view.',
    confirmLabel: 'Delete',
    confirmClass: 'amp-btn-danger',
  },
  'bulk-delete': {
    title: 'Delete selected listings?',
    description: 'All selected listings will be removed from active moderation queues.',
    confirmLabel: 'Delete selected',
    confirmClass: 'amp-btn-danger',
  },
};

export const ConfirmActionModal = ({
  isOpen,
  actionType,
  affectedCount,
  isSubmitting,
  onCancel,
  onConfirm,
}: ConfirmActionModalProps) => {
  if (!actionType) {
    return null;
  }

  const meta = actionMeta[actionType];

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="amp-confirm-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.section
            className="amp-confirm-card"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Confirm moderation action"
          >
            <header className="amp-confirm-head">
              <p>
                <AlertTriangle size={14} />
                Confirm action
              </p>
              <button type="button" className="amp-icon-btn" onClick={onCancel}>
                <X size={16} />
              </button>
            </header>

            <h3>{meta.title}</h3>
            <p className="amp-confirm-copy">{meta.description}</p>
            {affectedCount > 1 ? (
              <p className="amp-confirm-count">{affectedCount} listings are affected by this action.</p>
            ) : null}

            <footer className="amp-confirm-actions">
              <button type="button" className="amp-btn amp-btn-ghost" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </button>
              <button
                type="button"
                className={`amp-btn ${meta.confirmClass}`}
                onClick={onConfirm}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : meta.confirmLabel}
              </button>
            </footer>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
