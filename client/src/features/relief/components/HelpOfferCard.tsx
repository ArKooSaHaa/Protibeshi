import { motion } from 'framer-motion';
import { CheckCircle2, Clock, MapPin, RefreshCw } from 'lucide-react';
import type { HelpOffer } from '../types/relief.types';
import { formatDistance, formatRelativeTime } from '../utils/relief.utils';
import styles from './HelpOfferCard.module.css';

interface HelpOfferCardProps {
  offer: HelpOffer;
  onViewDetails: (o: HelpOffer) => void;
  onRequestSupport: (o: HelpOffer) => void;
}

export const HelpOfferCard = ({
  offer,
  onViewDetails,
  onRequestSupport,
}: HelpOfferCardProps) => {
  return (
    <motion.div
      className={styles.card}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Header */}
      <div className={styles.cardHeader}>
        <div className={styles.titleRow}>
          <div className={styles.badges}>
            <span className={styles.helpTypeBadge}>{offer.helpType}</span>
            {offer.isRecurring && (
              <span className={styles.recurringBadge}>
                <RefreshCw size={10} />
                Recurring
              </span>
            )}
          </div>
          <h3 className={styles.title}>{offer.title}</h3>
        </div>
        {offer.verified && (
          <span className={styles.verifiedBadge}>
            <CheckCircle2 size={11} />
            Verified
          </span>
        )}
      </div>

      {/* Meta */}
      <div className={styles.meta}>
        <span className={styles.metaItem}>
          <MapPin size={11} />
          {formatDistance(offer.distance)}
        </span>
        <span className={styles.metaItem}>
          <Clock size={11} />
          {formatRelativeTime(offer.createdAt)}
        </span>
        <span className={styles.metaItem}>
          ⏱ {offer.availability}
        </span>
        {offer.serviceRadius > 0 && (
          <span className={styles.metaItem}>
            📍 {offer.serviceRadius}km radius
          </span>
        )}
      </div>

      {/* Description preview */}
      <p className={styles.description}>{offer.description}</p>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.poster}>
          <div className={styles.avatar}>{offer.avatarInitials}</div>
          <span>{offer.postedBy}</span>
        </div>

        <div className={styles.actions}>
          <motion.button
            className={styles.btnRequest}
            onClick={() => onRequestSupport(offer)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="button"
          >
            Request Support
          </motion.button>
          <motion.button
            className={styles.btnDetails}
            onClick={() => onViewDetails(offer)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            type="button"
          >
            View Details
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
