import { motion } from 'framer-motion';
import { Eye, Flag } from 'lucide-react';
import { ComplaintItem } from '../types/complaint.types';
import styles from './ComplaintCard.module.css';

interface ComplaintCardProps {
  complaint: ComplaintItem;
  onViewDetails: (complaint: ComplaintItem) => void;
  onWhy: (complaint: ComplaintItem) => void;
  onReport: (complaint: ComplaintItem) => void;
}

export const ComplaintCard = ({
  complaint,
  onViewDetails,
  onWhy,
  onReport,
}: ComplaintCardProps) => {
  return (
    <motion.article
      className={`${styles.card} ${complaint.priority === 'Urgent' ? styles.urgent : ''}`}
      whileHover={{ y: -3, scale: 1.005 }}
      whileTap={{ y: 0, scale: 0.998 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
    >
      <div className={styles.headerRow}>
        <div>
          <div className={styles.metaRow}>
            <span className={styles.complaintId}>{complaint.id}</span>
            <span className={styles.category}>{complaint.category}</span>
          </div>
          <h4>{complaint.title}</h4>
        </div>
        <div className={styles.badgeStack}>
          <span className={`${styles.status} ${styles[`status${complaint.status.replace(/\s/g, '')}`]}`}>
            {complaint.status}
          </span>
          <span className={`${styles.priority} ${styles[`priority${complaint.priority}`]}`}>
            {complaint.priority}
          </span>
        </div>
      </div>

      <p className={styles.description}>{complaint.description}</p>

      <div className={styles.infoRow}>
        <span>{complaint.location}</span>
        <span>{complaint.distance}m away</span>
        <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
      </div>

      <div className={styles.extraRow}>
        <span className={styles.reportedBy}>
          Reported by {complaint.reportedBy === 'Anonymous' ? 'Anonymous' : complaint.reportedBy}
        </span>
        {complaint.verified && <span className={styles.verified}>Verified resident</span>}
        {complaint.visibility === 'Only admins' && <span className={styles.visibility}>Admins only</span>}
        {complaint.resolutionSummary && <span className={styles.resolved}>Resolution recorded</span>}
      </div>

      <div className={styles.footerRow}>
        <div className={styles.actions}>
          <motion.button
            type="button"
            onClick={() => onViewDetails(complaint)}
            whileHover={{ y: -1 }}
            whileTap={{ y: 1 }}
          >
            <Eye size={14} /> Details
          </motion.button>
        </div>
      </div>

      <div className={styles.footerLinks}>
        <button type="button" className={styles.linkButton} onClick={() => onWhy(complaint)}>
          Why am I seeing this?
        </button>
        <span className={styles.divider} />
        <button type="button" className={`${styles.linkButton} ${styles.linkMuted}`} onClick={() => onReport(complaint)}>
          <Flag size={12} /> Report issue
        </button>
      </div>
    </motion.article>
  );
};
