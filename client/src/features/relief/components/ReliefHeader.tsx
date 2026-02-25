import { motion } from 'framer-motion';
import { HandHeart, HeartHandshake, MapPin } from 'lucide-react';
import styles from './ReliefHeader.module.css';

interface ReliefHeaderProps {
  locationLabel: string;
  onRequestHelp: () => void;
  onOfferHelp: () => void;
}

export const ReliefHeader = ({
  locationLabel,
  onRequestHelp,
  onOfferHelp,
}: ReliefHeaderProps) => {
  return (
    <motion.div
      className={styles.header}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className={styles.top}>
        <div className={styles.locationRow}>
          <span className={styles.locationChip}>
            <MapPin size={11} />
            {locationLabel}
          </span>
        </div>
        <h1 className={styles.title}>Community Relief &amp; Support</h1>
        <p className={styles.subtitle}>
          Request or offer help within your neighborhood. Every act of support matters.
        </p>
      </div>

      <div className={styles.actions}>
        <motion.button
          className={styles.btnRequest}
          onClick={onRequestHelp}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          type="button"
        >
          <HandHeart size={15} />
          Request Help
        </motion.button>
        <motion.button
          className={styles.btnOffer}
          onClick={onOfferHelp}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          type="button"
        >
          <HeartHandshake size={15} />
          Offer Help
        </motion.button>
      </div>
    </motion.div>
  );
};
