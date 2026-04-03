import { motion } from 'framer-motion';
import { AlertTriangle, Ban, MoreVertical } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface AdminActionDropdownProps {
  onWarn: () => void;
  onBan: () => void;
  disabled?: boolean;
}

export const AdminActionDropdown = ({ onWarn, onBan, disabled = false }: AdminActionDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) {
        return;
      }

      if (wrapRef.current && !wrapRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div className="amp-action-dropdown" ref={wrapRef}>
      <button
        type="button"
        className="amp-icon-btn"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((previous) => !previous)}
        disabled={disabled}
      >
        <MoreVertical size={15} />
      </button>

      {isOpen ? (
        <motion.div
          className="amp-dropdown-menu"
          role="menu"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.16 }}
        >
          <button
            type="button"
            role="menuitem"
            className="amp-dropdown-item"
            onClick={() => {
              onWarn();
              setIsOpen(false);
            }}
          >
            <AlertTriangle size={14} />
            Warn User
          </button>

          <button
            type="button"
            role="menuitem"
            className="amp-dropdown-item amp-dropdown-item-danger"
            onClick={() => {
              onBan();
              setIsOpen(false);
            }}
          >
            <Ban size={14} />
            Ban User
          </button>
        </motion.div>
      ) : null}
    </div>
  );
};
