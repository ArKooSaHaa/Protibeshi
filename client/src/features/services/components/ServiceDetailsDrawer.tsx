// src/features/services/components/ServiceDetailsDrawer.tsx
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useRef, useState } from 'react';
import { ServiceItem } from '../types/service.types';
import styles from './ServiceDetailsDrawer.module.css';

interface ServiceDetailsDrawerProps {
  service: ServiceItem | null;
  priceLabel: string;
  onClose: () => void;
  onContact: (service: ServiceItem) => void;
}

export const ServiceDetailsDrawer = ({
  service,
  priceLabel,
  onClose,
  onContact,
}: ServiceDetailsDrawerProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(false);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;

    const isBottom =
      el.scrollHeight - el.scrollTop <= el.clientHeight + 4;

    setAtBottom(isBottom);
  };

  return (
    <AnimatePresence>
      {service && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.aside
            className={styles.drawer}
            initial={{ x: 420 }}
            animate={{ x: 0 }}
            exit={{ x: 420 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.header}>
              <h3>Service Details</h3>
              <button
                type="button"
                className={styles.closeButton}
                onClick={onClose}
              >
                <X size={18} />
              </button>
            </div>

            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className={`${styles.scrollContent} ${atBottom ? styles.atBottom : ''
                }`}
            >
              {service.coverPhotoUrl && (
                <img
                  src={service.coverPhotoUrl}
                  alt={service.title}
                  className={styles.coverPhoto}
                />
              )}

              <div className={styles.providerRow}>
                <img
                  src={service.avatar}
                  alt={service.providerName}
                />
                <div>
                  <strong>{service.providerName}</strong>
                  <p>{service.location}</p>
                </div>
              </div>

              <h4 className={styles.title}>{service.title}</h4>
              <p className={styles.leadText}>{service.shortDescription}</p>
              <p className={styles.body}>
                {service.fullDescription}
              </p>

              <div className={styles.metaGrid}>
                <div>
                  <span>Category</span>
                  <strong>{service.category}</strong>
                </div>
                <div>
                  <span>Price</span>
                  <strong>{priceLabel}</strong>
                </div>
                <div>
                  <span>Availability</span>
                  <strong>{service.availability}</strong>
                </div>
                <div>
                  <span>Experience</span>
                  <strong>
                    {service.experience} years
                  </strong>
                </div>
                <div>
                  <span>Service Radius</span>
                  <strong>{service.radius}m</strong>
                </div>
                <div>
                  <span>Location</span>
                  <strong>{service.location}</strong>
                </div>
                <div>
                  <span>Verified Provider</span>
                  <strong>{service.verified ? 'Yes' : 'No'}</strong>
                </div>
                <div>
                  <span>Published</span>
                  <strong>{new Date(service.createdAt).toLocaleDateString()}</strong>
                </div>
              </div>

              <section className={styles.section}>
                <h5>Working Hours</h5>
                {service.schedule.length ? (
                  <ul>
                    {service.schedule.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.muted}>
                    No working hours provided.
                  </p>
                )}
              </section>

              <section className={styles.section}>
                <h5>Provider Snapshot</h5>
                <div className={styles.detailList}>
                  <div className={styles.detailItem}>
                    <span>Provider name</span>
                    <strong>{service.providerName}</strong>
                  </div>
                  <div className={styles.detailItem}>
                    <span>Response time</span>
                    <strong>{service.responseTime}</strong>
                  </div>
                  <div className={styles.detailItem}>
                    <span>Price type</span>
                    <strong>{service.priceUnit}</strong>
                  </div>
                </div>
              </section>
            </div>

            <motion.button
              type="button"
              className={styles.contactButton}
              whileHover={{ y: -1, scale: 1.01 }}
              whileTap={{ y: 1, scale: 0.99 }}
              onClick={() => onContact(service)}
            >
              Contact Provider
            </motion.button>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
};