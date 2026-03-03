import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Bell, Settings, Menu } from 'lucide-react';
import styles from './Topbar.module.css';

export const Topbar = ({ onMenuClick }) => {
  return (
    <motion.header
      className={styles.topbar}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className={styles.left}>
        <motion.button
          className={styles.menuButton}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onMenuClick}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </motion.button>

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
          <motion.button
            className={styles.actionButton}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bell size={20} />
          </motion.button>
          <motion.button
            className={styles.actionButton}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Settings size={20} />
          </motion.button>
        </div>

        <motion.div
          className={styles.user}
          whileHover={{ scale: 1.02 }}
        >
          <span className={styles.userName}>Test User</span>
          <div className={styles.userAvatar}>T</div>
        </motion.div>
      </div>
    </motion.header>
  );
};
