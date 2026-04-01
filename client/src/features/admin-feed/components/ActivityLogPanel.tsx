import { motion } from 'framer-motion';
import { ClipboardList, Clock3 } from 'lucide-react';
import type { AdminActivityItem, ActivityTone } from '../types/adminFeed.types';

interface ActivityLogPanelProps {
  items: AdminActivityItem[];
}

const toneClassMap: Record<ActivityTone, string> = {
  info: 'afd-log-dot-info',
  success: 'afd-log-dot-success',
  warning: 'afd-log-dot-warning',
  danger: 'afd-log-dot-danger',
};

const formatLogTime = (isoDate: string): string => {
  return new Date(isoDate).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const ActivityLogPanel = ({ items }: ActivityLogPanelProps) => {
  return (
    <aside className="afd-activity-panel" aria-label="Moderation activity log">
      <div className="afd-activity-head">
        <h3>
          <ClipboardList size={16} /> Activity Log
        </h3>
        <p>Latest moderation events</p>
      </div>

      <div className="afd-activity-list-wrap">
        {items.length === 0 ? (
          <p className="afd-activity-empty">No actions yet. Start moderating to populate this log.</p>
        ) : (
          <ul className="afd-activity-list">
            {items.map((item, index) => (
              <motion.li
                key={item.id}
                className="afd-activity-item"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
              >
                <span className={`afd-log-dot ${toneClassMap[item.tone]}`} aria-hidden="true" />
                <div>
                  <p>{item.message}</p>
                  <span>
                    <Clock3 size={12} /> {formatLogTime(item.created_at)}
                  </span>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
};
