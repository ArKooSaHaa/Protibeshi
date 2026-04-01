import { motion } from 'framer-motion';
import { CheckCheck, ShieldCheck, Trash2, X } from 'lucide-react';

interface AdminBulkActionsBarProps {
  selectedCount: number;
  onVerifySelected: () => void;
  onMarkSafeSelected: () => void;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
}

export const AdminBulkActionsBar = ({
  selectedCount,
  onVerifySelected,
  onMarkSafeSelected,
  onDeleteSelected,
  onClearSelection,
}: AdminBulkActionsBarProps) => {
  return (
    <motion.section
      className="afd-bulk-bar"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      aria-live="polite"
    >
      <p className="afd-bulk-label">{selectedCount} selected for moderation</p>
      <div className="afd-bulk-actions">
        <motion.button
          type="button"
          className="afd-btn afd-btn-primary afd-ripple-btn"
          whileTap={{ scale: 0.97 }}
          onClick={onVerifySelected}
        >
          <CheckCheck size={15} /> Verify Selected
        </motion.button>

        <motion.button
          type="button"
          className="afd-btn afd-btn-warning afd-ripple-btn"
          whileTap={{ scale: 0.97 }}
          onClick={onMarkSafeSelected}
        >
          <ShieldCheck size={15} /> Mark Safe
        </motion.button>

        <motion.button
          type="button"
          className="afd-btn afd-btn-danger afd-ripple-btn"
          whileTap={{ scale: 0.97 }}
          onClick={onDeleteSelected}
        >
          <Trash2 size={15} /> Delete
        </motion.button>

        <motion.button
          type="button"
          className="afd-btn afd-btn-ghost"
          whileTap={{ scale: 0.97 }}
          onClick={onClearSelection}
        >
          <X size={15} /> Clear
        </motion.button>
      </div>
    </motion.section>
  );
};
