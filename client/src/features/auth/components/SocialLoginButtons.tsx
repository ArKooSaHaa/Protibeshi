import { Chrome, Facebook } from 'lucide-react';
import styles from './SocialLoginButtons.module.css';

type Provider = 'google' | 'facebook';

type SocialLoginButtonsProps = {
  disabled: boolean;
  mode?: 'signin' | 'signup';
  onProviderClick?: (provider: Provider) => void;
};

const PROVIDERS: Array<{ key: Provider; label: string; Icon: typeof Chrome }> = [
  { key: 'google', label: 'Google', Icon: Chrome },
  { key: 'facebook', label: 'Facebook', Icon: Facebook },
];

export const SocialLoginButtons = ({
  disabled,
  mode = 'signin',
  onProviderClick,
}: SocialLoginButtonsProps) => {
  const actionVerb = mode === 'signup' ? 'Continue with' : 'Sign in with';
  const rowClassName = mode === 'signup' ? `${styles.row} ${styles.rowSignup}` : styles.row;
  const buttonClassName = mode === 'signup' ? `${styles.button} ${styles.buttonSignup}` : styles.button;

  return (
    <div className={rowClassName} role="group" aria-label="Social auth options">
      {PROVIDERS.map((provider) => (
        <button
          key={provider.key}
          type="button"
          className={buttonClassName}
          onClick={() => onProviderClick?.(provider.key)}
          disabled={disabled}
          aria-label={`${actionVerb} ${provider.label}`}
        >
          <span className={styles.badge} aria-hidden="true">
            <provider.Icon size={16} strokeWidth={2} />
          </span>
          <span>{`${actionVerb} ${provider.label}`}</span>
        </button>
      ))}
    </div>
  );
};
