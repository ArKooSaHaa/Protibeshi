import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Bell, Settings, Menu } from 'lucide-react';
import { fetchAccountProfile } from '@/features/account/services/accountService';
import styles from './Topbar.module.css';

export const Topbar = ({ onMenuClick }) => {
  const [user, setUser] = React.useState({
    firstName: 'User',
    fullName: 'User',
    profilePictureUrl: null,
  });

  const initials = React.useMemo(() => {
    const source = user.firstName || user.fullName || 'U';
    return source.slice(0, 1).toUpperCase();
  }, [user.firstName, user.fullName]);

  React.useEffect(() => {
    let active = true;

    const extractStoredUser = () => {
      const keys = ['user', 'auth_user', 'authUser', 'currentUser', 'profile'];

      for (const key of keys) {
        const raw = window.localStorage.getItem(key);
        if (!raw) {
          continue;
        }

        try {
          const parsed = JSON.parse(raw);
          const nestedUser = parsed?.user ?? parsed;
          const firstName = nestedUser?.first_name || nestedUser?.firstName || (nestedUser?.name ? String(nestedUser.name).split(/\s+/)[0] : null);
          const fullName = nestedUser?.full_name || nestedUser?.name || firstName;
          const profilePictureUrl = nestedUser?.profile_picture_url || nestedUser?.profile_picture || null;

          if (firstName || profilePictureUrl) {
            return {
              firstName: firstName || 'User',
              fullName: fullName || firstName || 'User',
              profilePictureUrl,
            };
          }
        } catch {
          continue;
        }
      }

      return null;
    };

    const hydrateUser = async () => {
      const fromStorage = extractStoredUser();
      if (fromStorage && active) {
        setUser(fromStorage);
      }

      try {
        const profile = await fetchAccountProfile();
        if (!active) {
          return;
        }

        const firstName =
          (profile.first_name && profile.first_name.trim())
          || (profile.full_name && profile.full_name.trim().split(/\s+/)[0])
          || (profile.username && profile.username.trim())
          || 'User';

        setUser({
          firstName,
          fullName: profile.full_name || firstName,
          profilePictureUrl: profile.profile_picture_url || null,
        });
      } catch {
        // Keep storage fallback if profile request fails.
      }
    };

    void hydrateUser();

    return () => {
      active = false;
    };
  }, []);

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
          <span className={styles.userName}>{user.firstName}</span>
          {user.profilePictureUrl ? (
            <img src={user.profilePictureUrl} alt={user.fullName} className={styles.userAvatarImage} />
          ) : (
            <div className={styles.userAvatar}>{initials}</div>
          )}
        </motion.div>
      </div>
    </motion.header>
  );
};
