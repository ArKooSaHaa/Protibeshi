import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Flag } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface NotificationBellProps {
  reportedCount: number;
}

export const NotificationBell = ({ reportedCount }: NotificationBellProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const totalNotifications = reportedCount;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) {
        return;
      }

      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
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
    <div className="amp-notification-wrap" ref={dropdownRef}>
      <button
        type="button"
        className="amp-notification-btn"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((previous) => !previous)}
      >
        <Bell size={17} />
        {totalNotifications > 0 ? <span className="amp-notification-badge">{totalNotifications}</span> : null}
      </button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            className="amp-notification-menu"
            role="menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <p className="amp-notification-title">Moderation alerts</p>
            <ul>
              <li>
                <Flag size={13} />
                {reportedCount} new report{reportedCount === 1 ? '' : 's'} need attention
              </li>
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
