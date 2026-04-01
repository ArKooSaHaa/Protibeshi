import { Hammer, Wrench, ArrowRightCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/config/routes.config';
import styles from './AdminUnderConstructionPage.module.css';

export const AdminUnderConstructionPage = () => {
  return (
    <section className={styles.page} aria-label="Admin page under construction">
      <div className={styles.panel}>
        <p className={styles.kicker}>
          <Wrench size={15} />
          Admin Workspace
        </p>
        <h1 className={styles.title}>This Section Is Under Construction</h1>
        <p className={styles.subtitle}>
          For now, only the Admin Feed is enabled. Additional admin modules are being prepared.
        </p>

        <div className={styles.statusCard}>
          <p className={styles.statusTitle}>Current Availability</p>
          <p className={styles.statusLine}>Admin Feed: Active</p>
          <p className={styles.statusLine}>Other Admin Pages: Under Construction</p>
        </div>

        <Link to={ROUTES.ADMIN_FEED} className={styles.cta}>
          <ArrowRightCircle size={16} />
          Go To Admin Feed
        </Link>

        <p className={styles.footerNote}>
          <Hammer size={14} />
          More sections will be connected soon.
        </p>
      </div>
    </section>
  );
};
