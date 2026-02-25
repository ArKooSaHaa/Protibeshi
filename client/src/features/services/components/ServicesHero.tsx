import { motion, MotionValue } from 'framer-motion';
import { MapPin, Sparkles } from 'lucide-react';
import styles from './ServicesHero.module.css';

interface ServicesHeroProps {
  locationLabel: string;
  onOfferClick: () => void;
  y: MotionValue<number>;
  opacity: MotionValue<number>;
}

export const ServicesHero = ({ locationLabel, onOfferClick, y, opacity }: ServicesHeroProps) => {
  return (
    <motion.section
      className={styles.hero}
      style={{ y, opacity }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <div className={styles.heroOverlay} aria-hidden="true" />
      <div className={styles.content}>
        <span className={styles.kicker}>
          <Sparkles size={14} /> Hyper-local marketplace
        </span>
        <h1 className={styles.title}>Find Trusted Services Near You</h1>
        <p className={styles.subtitle}>
          Verified neighbors offering services within walking distance
        </p>
        <div className={styles.actions}>
          <span className={styles.locationChip}>
            <MapPin size={14} /> {locationLabel}
          </span>
          <motion.button
            type="button"
            className={styles.offerButton}
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ y: 1, scale: 0.98 }}
            onClick={onOfferClick}
          >
            Offer a Service
          </motion.button>
        </div>
      </div>
    </motion.section>
  );
};
