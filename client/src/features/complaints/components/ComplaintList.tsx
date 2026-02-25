import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { ComplaintItem } from '../types/complaint.types';
import { ComplaintCard } from './ComplaintCard';
import styles from './ComplaintList.module.css';

interface ComplaintListProps {
  complaints: ComplaintItem[];
  onViewDetails: (complaint: ComplaintItem) => void;
  onWhy: (complaint: ComplaintItem) => void;
  onReport: (complaint: ComplaintItem) => void;
}

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

const easeOut: [number, number, number, number] = [0.16, 1, 0.3, 1];

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: easeOut } },
};

export const ComplaintList = ({
  complaints,
  onViewDetails,
  onWhy,
  onReport,
}: ComplaintListProps) => {
  return (
    <div className={styles.listWrapper}>
      <div className={styles.listHeader}>
        <h2>Complaints Board</h2>
        <span>{complaints.length} active records</span>
      </div>

      <motion.div className={styles.list} variants={listVariants} initial="hidden" animate="visible">
        {complaints.map((complaint) => (
          <motion.div key={complaint.id} variants={itemVariants}>
            <ComplaintCard
              complaint={complaint}
              onViewDetails={onViewDetails}
              onWhy={onWhy}
              onReport={onReport}
            />
          </motion.div>
        ))}
      </motion.div>

      <AnimatePresence>
        {complaints.length === 0 && (
          <motion.div
            className={styles.emptyState}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            <AlertTriangle size={18} />
            <div>
              <h3>No complaints match your filters.</h3>
              <p>Try adjusting status, category, or distance to view more records.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
