import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users } from 'lucide-react';
import { useFeedStore } from '../store/feedStore';
import styles from './UpcomingEventsPanel.module.css';

const categoryColors = {
  Social: { bg: 'var(--slate-100)', text: 'var(--slate-700)' },
  Civic: { bg: 'var(--emerald-100)', text: 'var(--emerald-700)' },
  Indoor: { bg: 'var(--orange-100)', text: 'var(--orange-600)' },
};

export const UpcomingEventsPanel = () => {
  const { events } = useFeedStore();

  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0, x: 20, y: 6 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      whileHover={{ y: -2 }}
    >
      <div className={styles.header}>
        <h3 className={styles.title}>Upcoming in your neighborhood</h3>
      </div>

      <div className={styles.events}>
        {events.map((event, index) => (
          <motion.div
            key={event.id}
            className={styles.event}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
            whileHover={{ y: -1 }}
          >
            <div className={styles.eventHeader}>
              <h4 className={styles.eventTitle}>{event.title}</h4>
              <span
                className={styles.category}
                style={{
                  background: categoryColors[event.category]?.bg || 'var(--slate-100)',
                  color: categoryColors[event.category]?.text || 'var(--slate-600)',
                }}
              >
                {event.category}
              </span>
            </div>

            <div className={styles.eventMeta}>
              <span className={styles.metaItem}>
                <Calendar size={14} />
                {event.date} • {event.time}
              </span>
              <span className={styles.metaItem}>
                {event.distance}
              </span>
            </div>

            <div className={styles.interested}>
              <Users size={14} />
              <span>{event.interested} neighbors interested</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
