// src/features/auth/components/AuthLayout.tsx
import { useMemo, useRef } from 'react';
import type { ReactNode, MouseEvent } from 'react';
import styles from './AuthLayout.module.css';

type AuthLayoutProps = {
  children: ReactNode;
  hasError: boolean;
};

export const AuthLayout = ({ children, hasError }: AuthLayoutProps) => {
  const cardRef = useRef<HTMLDivElement | null>(null);

  const cardClassName = useMemo(() => {
    return hasError ? `${styles.card} ${styles.cardError}` : styles.card;
  }, [hasError]);

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!window.matchMedia('(pointer:fine)').matches || !cardRef.current) {
      return;
    }

    const bounds = cardRef.current.getBoundingClientRect();
    const offsetX = (event.clientX - bounds.left) / bounds.width;
    const offsetY = (event.clientY - bounds.top) / bounds.height;

    const rotateY = (offsetX - 0.5) * 6;
    const rotateX = (0.5 - offsetY) * 6;

    cardRef.current.style.setProperty('--card-rotate-x', `${rotateX.toFixed(2)}deg`);
    cardRef.current.style.setProperty('--card-rotate-y', `${rotateY.toFixed(2)}deg`);
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) {
      return;
    }

    cardRef.current.style.setProperty('--card-rotate-x', '0deg');
    cardRef.current.style.setProperty('--card-rotate-y', '0deg');
  };

  return (
    <section className={styles.wrapper} aria-label="Sign in section">
      <div className={styles.backdrop} aria-hidden="true">
        <div className={styles.gradientBase} />
        <div className={styles.blobA} />
        <div className={styles.blobB} />
        <div className={styles.blobC} />
        <div className={styles.grid} />
        <div className={styles.scanLine} />
      </div>

      <div
        ref={cardRef}
        className={cardClassName}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
    </section>
  );
};
