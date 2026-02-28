// src/features/services/components/ServiceCard.tsx 
import { motion } from 'framer-motion';
import {
  Bookmark, BookmarkCheck, CircleAlert, MessageSquareText,
  ShieldCheck, Star
} from 'lucide-react';
import { ServiceItem } from '../types/service.types';
import styles from './ServiceCard.module.css';

interface ServiceCardProps {
  service: ServiceItem;
  isBookmarked: boolean;
  priceLabel: string;
  onToggleBookmark: (serviceId: string) => void;
  onMessage: (service: ServiceItem) => void;
  onViewDetails: (service: ServiceItem) => void;
  onReport: (service: ServiceItem) => void;
}

export const ServiceCard = ({
  service,
  isBookmarked,
  priceLabel,
  onToggleBookmark,
  onMessage,
  onViewDetails,
  onReport,
}: ServiceCardProps) => {
  return (
    <motion.article
      className={styles.card}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.22 }}
    >
      <div className={styles.topRow}>
        <div className={styles.profileWrap}>
          <img className={styles.avatar} src={service.avatar}
            alt={service.providerName} />
          <div>
            <div
              className={styles.providerName}>{service.providerName}</div>
            <div className={styles.metaLine}>
              {service.verified && (
                <span className={styles.verifiedBadge}>
                  <ShieldCheck size={13} /> Verified
                </span>
              )}
              <span>{service.distance}m away</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className={styles.iconButton}
          onClick={() => onToggleBookmark(service.id)}
          aria-label="Save service"
        >
          {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark
            size={16} />}
        </button>
      </div>

      <div className={styles.ratingRow}>
        <span className={styles.rating}>
          <Star size={14} /> {service.rating.toFixed(1)}
        </span>
        <span>{service.reviews} reviews</span>
      </div>

      <h3 className={styles.title}>{service.title}</h3>
      <p className={styles.description}>{service.shortDescription}</p>

      <div className={styles.tagRow}>
        <span className={styles.categoryTag}>{service.category}</span>
        <span
          className={styles.availabilityTag}>{service.availability}</span>
      </div>

      <div className={styles.priceRow}>
        <strong>{priceLabel}</strong>
        <span>{service.experience} years exp.</span>
      </div>

      <div className={styles.responseTime}>{service.responseTime}</div>

      <div className={styles.actionRow}>
        <motion.button
          type="button"
          className={styles.secondaryButton}
          whileHover={{ y: -1 }}
          whileTap={{ y: 1 }}
          onClick={() => onMessage(service)}
        >
          <MessageSquareText size={14} /> Message
        </motion.button>
        <motion.button
          type="button"
          className={styles.primaryButton}
          whileHover={{ y: -1 }}
          whileTap={{ y: 1 }}
          onClick={() => onViewDetails(service)}
        >
          View Details
        </motion.button>
      </div>

      <div className={styles.trustRow}>
        <button type="button" className={styles.textButton} onClick={() => onReport(service)}>
          <CircleAlert size={13} /> Report Service
        </button>
        <span
          className={styles.tooltipText}
          title={`This service appears because it's ${service.distance}m from your location and within your active filters.`}
        >
          Why am I seeing this?
        </span>
      </div>
    </motion.article>
  );
}; 