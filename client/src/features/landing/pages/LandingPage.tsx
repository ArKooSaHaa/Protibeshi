import { LazyMotion, domAnimation, m } from 'framer-motion';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/config/routes.config';
import { Scene3D } from '@/features/landing/components/Scene3D';
import styles from './LandingPage.module.css';

const sectionTransition = {
  duration: 0.72,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

export const LandingPage = () => {
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const previousBodyBackground = document.body.style.backgroundColor;
    const previousHtmlBackground = document.documentElement.style.backgroundColor;

    document.body.style.backgroundColor = '#03121b';
    document.documentElement.style.backgroundColor = '#03121b';

    return () => {
      document.body.style.backgroundColor = previousBodyBackground;
      document.documentElement.style.backgroundColor = previousHtmlBackground;
    };
  }, []);

  return (
    <LazyMotion features={domAnimation}>
      <div className={styles.page}>
        <div className={styles.glowOne} aria-hidden="true" />
        <div className={styles.glowTwo} aria-hidden="true" />

        <header className={styles.navbar}>
          <div className={styles.brandGroup}>
            <span className={styles.brandDot} aria-hidden="true" />
            <span className={styles.brandText}>Protibeshi</span>
          </div>

          <div className={styles.navActions}>
            <Link to={ROUTES.LOGIN} className={styles.navSignin}>
              Sign In
            </Link>
            <Link to={ROUTES.SIGNUP} className={styles.navSignup}>
              Sign Up
            </Link>
          </div>
        </header>

        <main className={styles.main}>
          <Scene3D />

          <m.section
            className={styles.bottomCta}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={sectionTransition}
          >
            <h2>Choose your path and enter the community</h2>
            <p>Sign in to continue, or create a new account and start engaging with your neighborhood.</p>
            <div className={styles.bottomActions}>
              <Link to={ROUTES.LOGIN} className={styles.primaryCta}>
                Sign In
              </Link>
              <Link to={ROUTES.SIGNUP} className={styles.secondaryCta}>
                Sign Up
              </Link>
            </div>
          </m.section>
        </main>

        <footer className={styles.footer}>
          <div className={styles.footerTop}>
            <section className={styles.footerBrandBlock}>
              <div className={styles.footerBrandRow}>
                <span className={styles.footerBrandDot} aria-hidden="true" />
                <p className={styles.footerBrand}>Protibeshi</p>
              </div>

              <p className={styles.footerTagline}>
                Neighborhood-first social platform for trusted local updates, verified services, and faster community
                response.
              </p>

              <div className={styles.footerTrustBar} aria-label="Protibeshi platform focus">
                <span>
                  <span className={styles.footerPulse} aria-hidden="true" />
                  Local-first platform
                </span>
                <span>Built for neighborhood response</span>
              </div>
            </section>

            <div className={styles.footerColumns}>
              <section className={styles.footerColumn}>
                <h3 className={styles.footerHeading}>Access</h3>
                <Link to={ROUTES.LOGIN} className={styles.footerItem}>
                  Sign In
                </Link>
                <Link to={ROUTES.SIGNUP} className={styles.footerItem}>
                  Sign Up
                </Link>
                <Link to={ROUTES.ADMIN_AUTH} className={styles.footerItem}>
                  Admin Access
                </Link>
              </section>

              <section className={styles.footerColumn}>
                <h3 className={styles.footerHeading}>Explore</h3>
                <Link to={ROUTES.FEED} className={styles.footerItem}>
                  Community Feed
                </Link>
                <Link to={ROUTES.MARKETPLACE} className={styles.footerItem}>
                  Marketplace
                </Link>
                <Link to={ROUTES.SERVICES} className={styles.footerItem}>
                  Local Services
                </Link>
              </section>

              <section className={styles.footerColumn}>
                <h3 className={styles.footerHeading}>Support</h3>
                <a href="mailto:support@protibeshi.com" className={styles.footerItem}>
                  support@protibeshi.com
                </a>
                <a href="tel:+8801700000000" className={styles.footerItem}>
                  +880 1700 000000
                </a>
                <Link to={ROUTES.COMPLAINTS} className={styles.footerItem}>
                  Report an Issue
                </Link>
              </section>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <p className={styles.footerLegal}>© {currentYear} Protibeshi. All rights reserved.</p>

            <div className={styles.footerBottomLinks}>
              <Link to={ROUTES.RELIEF} className={styles.footerMeta}>
                Relief
              </Link>
              <Link to={ROUTES.COMPLAINTS} className={styles.footerMeta}>
                Complaints
              </Link>
              <Link to={ROUTES.SERVICES} className={styles.footerMeta}>
                Services
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </LazyMotion>
  );
};
