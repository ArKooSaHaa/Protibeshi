// src/features/auth/components/SignInForm.tsx
import { Link } from 'react-router-dom';
import { ROUTES } from '@/config/routes.config';
import { NeonButton } from './NeonButton';
import { SocialLoginButtons } from './SocialLoginButtons';
import type { UseSignInResult } from '../hooks/useSignIn';
import styles from './SignInForm.module.css';

type SignInFormProps = {
  signIn: UseSignInResult;
};

export const SignInForm = ({ signIn }: SignInFormProps) => {
  const emailErrorId = signIn.errors.email ? 'signin-email-error' : undefined;
  const passwordErrorId = signIn.errors.password ? 'signin-password-error' : undefined;

  return (
    <section className={styles.container} aria-live="polite">
      <header className={styles.header}>
        <p className={styles.kicker}>Secure Access</p>
        <h1 className={styles.title}>Welcome Back</h1>
        <p className={styles.subtitle}>Sign in to continue to your Protibeshi workspace.</p>
      </header>

      <form className={styles.form} onSubmit={signIn.onSubmit} noValidate>
        <div className={styles.fieldWrap}>
          <label className={styles.label} htmlFor="signin-email">
            Email
          </label>
          <input
            id="signin-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={signIn.values.email}
            onChange={signIn.onEmailChange}
            className={styles.input}
            placeholder="you@company.com"
            aria-invalid={Boolean(signIn.errors.email)}
            aria-describedby={emailErrorId}
            required
          />
          {signIn.errors.email ? (
            <p id="signin-email-error" className={styles.errorText} role="alert">
              {signIn.errors.email}
            </p>
          ) : null}
        </div>

        <div className={styles.fieldWrap}>
          <label className={styles.label} htmlFor="signin-password">
            Password
          </label>
          <div className={styles.passwordWrap}>
            <input
              id="signin-password"
              type={signIn.isPasswordVisible ? 'text' : 'password'}
              autoComplete="current-password"
              value={signIn.values.password}
              onChange={signIn.onPasswordChange}
              className={styles.input}
              placeholder="••••••••"
              aria-invalid={Boolean(signIn.errors.password)}
              aria-describedby={passwordErrorId}
              minLength={8}
              required
            />
            <button
              type="button"
              className={styles.toggleButton}
              onClick={signIn.togglePasswordVisibility}
              aria-label={signIn.isPasswordVisible ? 'Hide password' : 'Show password'}
            >
              {signIn.isPasswordVisible ? 'Hide' : 'Show'}
            </button>
          </div>
          {signIn.errors.password ? (
            <p id="signin-password-error" className={styles.errorText} role="alert">
              {signIn.errors.password}
            </p>
          ) : null}
        </div>

        <div className={styles.metaRow}>
          <label className={styles.rememberMe} htmlFor="remember-me">
            <input
              id="remember-me"
              type="checkbox"
              checked={signIn.values.rememberMe}
              onChange={signIn.onRememberMeChange}
              className={styles.checkbox}
            />
            Remember me
          </label>
          <Link className={styles.link} to={ROUTES.AUTH}>
            Forgot password?
          </Link>
        </div>

        {signIn.globalError ? (
          <p className={styles.errorBanner} role="alert">
            {signIn.globalError}
          </p>
        ) : null}

        {signIn.status === 'success' && signIn.submittedEmail ? (
          <p className={styles.successBanner} role="status">
            Signed in as {signIn.submittedEmail}. Redirecting…
          </p>
        ) : null}

        <NeonButton type="submit" isLoading={signIn.isSubmitting} disabled={!signIn.isValid}>
          Sign In
        </NeonButton>
      </form>

      <div className={styles.divider} role="separator" aria-label="Or continue with social login">
        <span>Or continue with</span>
      </div>

      <SocialLoginButtons disabled={signIn.isSubmitting} />

      <p className={styles.signupPrompt}>
        Don&apos;t have an account?{' '}
        <Link className={styles.signupLink} to={ROUTES.SIGNUP}>
          Create one
        </Link>
      </p>
    </section>
  );
};
