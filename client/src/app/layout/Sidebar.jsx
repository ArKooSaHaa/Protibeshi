import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  ShoppingBag, 
  Building, 
  Wrench, 
  AlertCircle, 
  Heart, 
  MessageSquare,
  MapPin,
  UserRound
} from 'lucide-react';
import styles from './Sidebar.module.css';
import { ROUTES } from '@/config/routes.config';

const navigation = [
  { id: 'feed', label: 'Feed', icon: Home, path: ROUTES.HOME },
  { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag, path: ROUTES.MARKETPLACE },
  { id: 'rent', label: 'Rent', icon: Building, path: ROUTES.RENT },
  { id: 'services', label: 'Services', icon: Wrench, path: ROUTES.SERVICES },
  { id: 'complaints', label: 'Complaints', icon: AlertCircle, path: ROUTES.COMPLAINTS },
  { id: 'relief', label: 'Relief', icon: Heart, path: ROUTES.RELIEF },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'account', label: 'Account', icon: UserRound, path: '/account' },
];

const containerVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
      staggerChildren: 0.05,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

const navItemVariants = {
  initial: { rotateX: 0, rotateY: 0 },
  hover: {
    rotateX: -2,
    rotateY: 8,
    scale: 1.05,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  tap: {
    scale: 0.95,
    rotateX: 5,
  },
};

export const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
  return (
    <motion.aside
      className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className={styles.logoSection}>
        <motion.div 
          className={styles.logo}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className={styles.logoIcon}>
            <MapPin className={styles.logoIconSvg} />
          </div>
          <div className={styles.logoText}>
            <h1 className={styles.logoTitle}>Protibeshi</h1>
          </div>
        </motion.div>
      </div>

      <nav className={styles.navigation}>
        {navigation.map((item, index) => {
          const Icon = item.icon;
          const linkClass = ({ isActive }) =>
            `${styles.navItem} ${isActive ? styles.navItemActive : ''}`;
          return (
            <motion.div 
              key={item.id} 
              variants={itemVariants}
              className={styles.navWrapper}
            >
              {item.path ? (
                <motion.div
                  className={styles.navMotionWrapper}
                  variants={navItemVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                >
                  <NavLink
                    to={item.path}
                    className={linkClass}
                    onClick={onClose}
                  >
                    {({ isActive }) => (
                      <>
                        <div className={`${styles.navIcon} ${isActive ? styles.navIconActive : ''}`}>
                          <Icon size={20} />
                        </div>
                        <span className={styles.navLabel}>{item.label}</span>
                      </>
                    )}
                  </NavLink>
                </motion.div>
              ) : (
                <motion.div
                  className={styles.navMotionWrapper}
                  variants={navItemVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                >
                  <a
                    href={`#${item.id}`}
                    className={styles.navItem}
                  >
                    <div className={styles.navIcon}>
                      <Icon size={20} />
                    </div>
                    <span className={styles.navLabel}>{item.label}</span>
                  </a>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </nav>
    </motion.aside>
  );
};
