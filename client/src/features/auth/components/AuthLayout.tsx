import { useMemo, useRef } from 'react';
import type { ReactNode, MouseEvent } from 'react';
import styles from './AuthLayout.module.css';

type AuthLayoutProps = {
  children: ReactNode;
  hasError?: boolean;
  variant?: 'signin' | 'signup';
};

const FLOATING_SHAPES = [
  { className: styles.shapeOne, delay: '0s' },
  { className: styles.shapeTwo, delay: '1.5s' },
  { className: styles.shapeThree, delay: '3.25s' },
  { className: styles.shapeFour, delay: '4.5s' },
];

export const AuthLayout = ({ children, hasError = false, variant = 'signin' }: AuthLayoutProps) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const isSignup = variant === 'signup';

  const cardClassName = useMemo(() => {
    const classes = [styles.card, isSignup ? styles.cardSignup : styles.cardSignin];
    if (hasError) {
      classes.push(styles.cardError);
    }

    return classes.join(' ');
  }, [hasError, isSignup]);

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
    <section className={`${styles.wrapper} ${isSignup ? styles.signupWrapper : ''}`} aria-label="Authentication section">
      <div className={styles.backdrop} aria-hidden="true">
        <div className={styles.gradientBase} />
        <div className={styles.blobA} />
        <div className={styles.blobB} />
        <div className={styles.blobC} />
        <div className={styles.grid} />
        <div className={styles.scanLine} />
      </div>

      {isSignup ? (
        <aside className={styles.visualPanel} aria-hidden="true">
          <div className={styles.visualInner}>
            <p className={styles.visualEyebrow}>Protibeshi</p>
            <h2 className={styles.visualHeading}>Build trust with your neighborhood</h2>
            <p className={styles.visualBody}>
              Join local conversations, find verified services, and coordinate help faster with people nearby.
            </p>

            <div className={styles.particlesLayer}>
              {FLOATING_SHAPES.map((shape) => (
                <span
                  key={shape.className}
                  className={`${styles.shape} ${shape.className}`}
                  style={{ animationDelay: shape.delay }}
                />
              ))}
            </div>
          </div>
        </aside>
      ) : null}

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
