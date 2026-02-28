// src/features/auth/components/NeonButton.tsx
import type { ButtonHTMLAttributes } from 'react';
import styles from './NeonButton.module.css';

type NeonButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
};

export const NeonButton = ({
  children,
  isLoading = false,
  disabled,
  className,
  ...props
}: NeonButtonProps) => {
  const buttonClassName = className ? `${styles.button} ${className}` : styles.button;

  return (
    <button {...props} className={buttonClassName} disabled={disabled || isLoading}>
      <span className={styles.glow} aria-hidden="true" />
      <span className={styles.label}>{isLoading ? 'Signing In…' : children}</span>
    </button>
  );
};
