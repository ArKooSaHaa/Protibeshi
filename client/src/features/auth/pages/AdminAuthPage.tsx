import { useEffect } from 'react';
import { Shield, KeyRound, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes.config';
import { useAdminAuth } from '../hooks/useAdminAuth';
import styles from './AdminAuthPage.module.css';

export const AdminAuthPage = () => {
  const adminAuth = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (adminAuth.status === 'redirect') {
      navigate(ROUTES.ADMIN_FEED, { replace: true });
    }
  }, [adminAuth.status, navigate]);

  return (
    <main className={styles.page}>
      <div className={styles.backgroundGlow} aria-hidden="true" />
      <section className={styles.card} aria-live="polite">
        <header className={styles.header}>
          <p className={styles.badge}>
            <Shield size={14} />
            Admin Vibe
          </p>
          <h1 className={styles.title}>Command Center Access</h1>
          <p className={styles.subtitle}>Sign in with administrator credentials to continue to moderation controls.</p>
        </header>

        <form className={styles.form} onSubmit={adminAuth.onSubmit} noValidate>
          <label className={styles.label} htmlFor="admin-auth-email">
            Admin Email
          </label>
          <input
            id="admin-auth-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            className={styles.input}
            value={adminAuth.values.email}
            onChange={adminAuth.onEmailChange}
            placeholder="admin@domain.com"
            aria-invalid={Boolean(adminAuth.errors.email)}
            required
          />
          {adminAuth.errors.email ? <p className={styles.errorText}>{adminAuth.errors.email}</p> : null}

          <label className={styles.label} htmlFor="admin-auth-password">
            Password
          </label>
          <div className={styles.passwordWrap}>
            <input
              id="admin-auth-password"
              type={adminAuth.isPasswordVisible ? 'text' : 'password'}
              autoComplete="current-password"
              className={styles.input}
              value={adminAuth.values.password}
              onChange={adminAuth.onPasswordChange}
              placeholder="********"
              minLength={8}
              aria-invalid={Boolean(adminAuth.errors.password)}
              required
            />
            <button
              type="button"
              className={styles.toggleButton}
              onClick={adminAuth.togglePasswordVisibility}
            >
              {adminAuth.isPasswordVisible ? 'Hide' : 'Show'}
            </button>
          </div>
          {adminAuth.errors.password ? <p className={styles.errorText}>{adminAuth.errors.password}</p> : null}

          {adminAuth.globalError ? <p className={styles.errorBanner}>{adminAuth.globalError}</p> : null}
          {adminAuth.status === 'success' && adminAuth.submittedEmail ? (
            <p className={styles.successBanner}>Access granted to {adminAuth.submittedEmail}. Redirecting...</p>
          ) : null}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={!adminAuth.isValid || adminAuth.isSubmitting}
          >
            <KeyRound size={16} />
            {adminAuth.isSubmitting ? 'Authenticating...' : 'Enter Admin Feed'}
          </button>
        </form>

        <footer className={styles.footer}>
          <Sparkles size={15} />
          <span>Protected admin gateway for content moderation tools.</span>
        </footer>
      </section>
    </main>
  );
};
