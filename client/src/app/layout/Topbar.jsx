import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Bell, Settings, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes.config';
import { fetchAccountProfile } from '@/features/account/services/accountService';
import { useAuthStore } from '@/features/auth/store/authStore';
import styles from './Topbar.module.css';

export const Topbar = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const role = useAuthStore((state) => state.role);
  const topbarTemperature = '23°';
  const [user, setUser] = React.useState({
    firstName: 'User',
    fullName: 'User',
    neighborhood: 'Neighborhood',
    profilePictureUrl: null,
  });

  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const settingsRef = React.useRef(null);

  const initials = React.useMemo(() => {
    const source = role === 'admin' ? 'Admin' : (user.firstName || user.fullName || 'U');
    return source.slice(0, 1).toUpperCase();
  }, [role, user.firstName, user.fullName]);

  const displayName = role === 'admin' ? 'Admin' : user.firstName;

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
          const neighborhood = nestedUser?.neighborhood || nestedUser?.city || null;
          const profilePictureUrl = nestedUser?.profile_picture_url || nestedUser?.profile_picture || null;

          if (firstName || profilePictureUrl || neighborhood) {
            return {
              firstName: firstName || 'User',
              fullName: fullName || firstName || 'User',
              neighborhood: neighborhood || 'Neighborhood',
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

        const neighborhood =
          (profile.neighborhood && profile.neighborhood.trim())
          || (profile.city && profile.city.trim())
          || 'Neighborhood';

        setUser({
          firstName,
          fullName: profile.full_name || firstName,
          neighborhood,
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

  React.useEffect(() => {
    if (!isSettingsOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      const target = event.target;

      if (settingsRef.current && target && !settingsRef.current.contains(target)) {
        setIsSettingsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsSettingsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSettingsOpen]);

  const toggleSettingsMenu = () => {
    setIsSettingsOpen((prev) => !prev);
  };

  const handleSignOut = () => {
    setIsSettingsOpen(false);
    logout();
    navigate(ROUTES.LOGIN, { replace: true });
  };

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
        <div className={styles.locationGroup}>
          <span className={styles.tempBadge} aria-label="Current temperature">
            {topbarTemperature}
          </span>
          <div className={styles.location}>
            <MapPin size={16} className={styles.locationIcon} />
            <span className={styles.locationText}>{user.neighborhood}</span>
          </div>
        </div>

        <div className={styles.actions}>
          <motion.button
            className={styles.actionButton}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bell size={20} />
          </motion.button>
          <div className={styles.settingsMenuWrap} ref={settingsRef}>
            <motion.button
              type="button"
              className={styles.actionButton}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleSettingsMenu}
              aria-label="Settings"
              aria-haspopup="menu"
              aria-expanded={isSettingsOpen}
            >
              <Settings size={20} />
            </motion.button>

            {isSettingsOpen ? (
              <motion.div
                className={styles.settingsMenu}
                role="menu"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                <button
                  type="button"
                  className={styles.settingsMenuItem}
                  role="menuitem"
                  onClick={handleSignOut}
                >
                  Sign out
                </button>
              </motion.div>
            ) : null}
          </div>
        </div>

        <motion.div
          className={styles.user}
          whileHover={{ scale: 1.02 }}
        >
          <span className={styles.userName}>{displayName}</span>
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
