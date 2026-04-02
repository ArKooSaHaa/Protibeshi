import { motion } from 'framer-motion';
import { CheckCheck, ShieldX, Trash2, X } from 'lucide-react';

interface BulkActionBarProps {
  selectedCount: number;
  onApproveSelected: () => void;
  onRejectSelected: () => void;
  onDeleteSelected: () => void;
  onClear: () => void;
}

export const BulkActionBar = ({
  selectedCount,
  onApproveSelected,
  onRejectSelected,
  onDeleteSelected,
  onClear,
}: BulkActionBarProps) => {
  return (
    <motion.section
      className="amp-bulk-bar"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
    >
      <p>{selectedCount} listings selected</p>
      <div className="amp-bulk-actions">
        <button type="button" className="amp-btn amp-btn-primary" onClick={onApproveSelected}>
          <CheckCheck size={14} />
          Approve selected
        </button>

        <button type="button" className="amp-btn amp-btn-warning" onClick={onRejectSelected}>
          <ShieldX size={14} />
          Reject selected
        </button>

        <button type="button" className="amp-btn amp-btn-danger" onClick={onDeleteSelected}>
          <Trash2 size={14} />
          Delete selected
        </button>

        <button type="button" className="amp-btn amp-btn-ghost" onClick={onClear}>
          <X size={14} />
          Clear
        </button>
      </div>
    </motion.section>
  );
};
