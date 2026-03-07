// src/features/services/components/ServicesHero.tsx 
import { motion, MotionValue } from 'framer-motion';
import { Filter, Sparkles } from 'lucide-react';
import styles from './ServicesHero.module.css';

interface ServicesHeroProps {
  onOfferClick: () => void;
  onFilterClick: () => void;
  y: MotionValue<number>;
  opacity: MotionValue<number>;
}

export const ServicesHero = ({ onOfferClick, onFilterClick, y, opacity }: ServicesHeroProps) => {
  return (
    <motion.section
      className={styles.hero}
      style={{ y, opacity }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <video
        className={styles.heroVideo}
        src="/service.mp4"
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
      />
      <div className={styles.heroOverlay} aria-hidden="true" />
      <span className={styles.kicker}>
        <Sparkles size={14} /> Hyper-local marketplace
      </span>
      <div className={styles.content}>
        <h1 className={styles.title}>Find Trusted Services Near You</h1>
        <p className={styles.subtitle}>
          Verified neighbors offering services within walking distance
        </p>
      </div>
      <div className={styles.heroControls}>
        <motion.button
          type="button"
          className={styles.filterButton}
          whileHover={{ y: -2 }}
          whileTap={{ y: 1 }}
          onClick={onFilterClick}
        >
          <Filter size={15} /> Filters
        </motion.button>
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
    </motion.section>
  );
};