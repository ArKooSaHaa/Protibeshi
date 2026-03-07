import { motion } from 'framer-motion';
import { MapPin, Bell, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes.config';
import styles from './Topbar.module.css';

export const Topbar = () => {
  const navigate = useNavigate();

  const goToAccount = () => {
    navigate(ROUTES.ACCOUNT);
  };

  return (
    <motion.header
      className={styles.topbar}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className={styles.left}>
        <div className={styles.brand}>
          <h2 className={styles.brandTitle}>My neighborhood</h2>
          <p className={styles.brandSubtitle}>Local feed & community updates</p>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.location}>
          <MapPin size={16} className={styles.locationIcon} />
          <span className={styles.locationText}>Motijheel</span>
          <span className={styles.locationDistance}>350m</span>
        </div>

        <div className={styles.actions}>
          <motion.button className={styles.actionButton} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Bell size={20} />
          </motion.button>
          <motion.button className={styles.actionButton} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Settings size={20} />
          </motion.button>
        </div>

        <motion.button
          type="button"
          className={`${styles.user} ${styles.userButton}`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={goToAccount}
        >
          <span className={styles.userName}>Test User</span>
          <div className={styles.userAvatar}>T</div>
        </motion.button>
      </div>
    </motion.header>
  );
};
