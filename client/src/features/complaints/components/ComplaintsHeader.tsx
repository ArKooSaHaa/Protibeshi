import { motion } from 'framer-motion';
import { MapPin, ShieldCheck } from 'lucide-react';
import styles from './ComplaintsHeader.module.css';

interface ComplaintsHeaderProps {
  locationLabel: string;
  onSubmitClick: () => void;
}

export const ComplaintsHeader = ({ locationLabel, onSubmitClick }: ComplaintsHeaderProps) => {
  return (
    <motion.header
      className={styles.header}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className={styles.titleBlock}>
        <div className={styles.badgeRow}>
          <ShieldCheck size={16} />
          <span>Civic-grade reporting</span>
        </div>
        <h1>Community Complaints</h1>
        <p>Report and track neighborhood issues with accountability.</p>
      </div>
      <div className={styles.metaActions}>
        <div className={styles.locationChip}>
          <MapPin size={14} />
          {locationLabel}
        </div>
        <motion.button
          type="button"
          className={styles.submitButton}
          whileHover={{ y: -1 }}
          whileTap={{ y: 1 }}
          onClick={onSubmitClick}
        >
          Submit Complaint
        </motion.button>
      </div>
    </motion.header>
  );
};
