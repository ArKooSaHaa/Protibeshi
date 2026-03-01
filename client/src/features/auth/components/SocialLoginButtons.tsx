// src/features/auth/components/SocialLoginButtons.tsx
import styles from './SocialLoginButtons.module.css';

type Provider = 'google' | 'github' | 'x';

type SocialLoginButtonsProps = {
  disabled: boolean;
  onProviderClick?: (provider: Provider) => void;
};

const PROVIDERS: Array<{ key: Provider; label: string; short: string }> = [
  { key: 'google', label: 'Continue with Google', short: 'G' },
  { key: 'github', label: 'Continue with GitHub', short: 'GH' },
  { key: 'x', label: 'Continue with X', short: 'X' },
];

export const SocialLoginButtons = ({ disabled, onProviderClick }: SocialLoginButtonsProps) => {
  return (
    <div className={styles.row} role="group" aria-label="Social sign in options">
      {PROVIDERS.map((provider) => (
        <button
          key={provider.key}
          type="button"
          className={styles.button}
          onClick={() => onProviderClick?.(provider.key)}
          disabled={disabled}
          aria-label={provider.label}
        >
          <span className={styles.badge} aria-hidden="true">
            {provider.short}
          </span>
          <span>{provider.label.replace('Continue with ', '')}</span>
        </button>
      ))}
    </div>
  );
};
