import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { MapPin, Bell, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes.config';
import { fetchAccountProfile } from '@/features/account/services/accountService';
import styles from './Topbar.module.css';

type TopbarUser = {
  firstName: string;
  fullName: string;
  profilePictureUrl: string | null;
};

const initialUser: TopbarUser = {
  firstName: 'User',
  fullName: 'User',
  profilePictureUrl: null,
};

export const Topbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<TopbarUser>(initialUser);

  const initials = useMemo(() => {
    const source = user.firstName || user.fullName || 'U';
    return source.slice(0, 1).toUpperCase();
  }, [user.firstName, user.fullName]);

  useEffect(() => {
    let active = true;

    const loadTopbarProfile = async () => {
      try {
        const profile = await fetchAccountProfile();
        if (!active) {
          return;
        }

        const firstName =
          (profile.first_name && profile.first_name.trim())
            || (profile.full_name && profile.full_name.trim().split(/\s+/)[0])
            || 'User';

        setUser({
          firstName,
          fullName: profile.full_name || firstName,
          profilePictureUrl: profile.profile_picture_url || null,
        });
      } catch {
        if (!active) {
          return;
        }

        setUser(initialUser);
      }
    };

    void loadTopbarProfile();

    return () => {
      active = false;
    };
  }, []);

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
          aria-label="Open account"
        >
          <span className={styles.userName}>{user.firstName}</span>
          {user.profilePictureUrl ? (
            <img src={user.profilePictureUrl} alt={user.fullName} className={styles.userAvatarImage} />
          ) : (
            <div className={styles.userAvatar}>{initials}</div>
          )}
        </motion.button>
      </div>
    </motion.header>
  );
};
