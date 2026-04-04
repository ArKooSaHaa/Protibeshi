import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ConfirmActionType } from '../types/adminMarketplace.types';

interface ConfirmActionModalProps {
  isOpen: boolean;
  actionType: ConfirmActionType | null;
  affectedCount: number;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
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
  ban: {
    title: 'Ban user?',
    description: 'The user will be banned from posting listings for 7 days and all of their current listings will be removed.',
    confirmLabel: 'Ban user',
    confirmClass: 'amp-btn-danger-outline',
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
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
    }
  }, [isOpen, actionType]);

  if (!actionType) {
    return null;
  }

  if (typeof document === 'undefined') {
    return null;
  }

  const meta = actionMeta[actionType];
  const trimmedReason = reason.trim();
  const isReasonValid = trimmedReason.length > 0;

  const modal = (
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

            <label htmlFor="amp-moderation-reason" className="amp-confirm-label">
              Moderation Message (Required)
            </label>
            <textarea
              id="amp-moderation-reason"
              className="amp-confirm-textarea"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Explain why this moderation action is being taken"
              rows={4}
              maxLength={500}
            />
            <p className="amp-confirm-hint">This message will be sent to the user as the official moderation reason.</p>

            <footer className="amp-confirm-actions">
              <button type="button" className="amp-btn amp-btn-ghost" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </button>
              <button
                type="button"
                className={`amp-btn ${meta.confirmClass}`}
                onClick={() => onConfirm(trimmedReason)}
                disabled={isSubmitting || !isReasonValid}
              >
                {isSubmitting ? 'Processing...' : meta.confirmLabel}
              </button>
            </footer>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
};
