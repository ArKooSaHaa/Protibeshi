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
              className={`${styles.scrollContent} ${
                atBottom ? styles.atBottom : ''
              }`}
            >
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
              <p className={styles.body}>
                {service.fullDescription}
              </p>

              <div className={styles.metaGrid}>
                <div>
                  <span>Price</span>
                  <strong>{priceLabel}</strong>
                </div>
                <div>
                  <span>Experience</span>
                  <strong>
                    {service.experience} years
                  </strong>
                </div>
                <div>
                  <span>Rating</span>
                  <strong>
                    {service.rating.toFixed(1)} (
                    {service.reviews} reviews)
                  </strong>
                </div>
                <div>
                  <span>Service Radius</span>
                  <strong>{service.radius}m</strong>
                </div>
              </div>

              <section className={styles.section}>
                <h5>Skills</h5>
                <ul>
                  {service.skills.map((skill) => (
                    <li key={skill}>{skill}</li>
                  ))}
                </ul>
              </section>

              <section className={styles.section}>
                <h5>Certifications</h5>
                {service.certifications.length ? (
                  <ul>
                    {service.certifications.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.muted}>
                    No certifications listed yet.
                  </p>
                )}
              </section>

              <section className={styles.section}>
                <h5>Availability Schedule</h5>
                <ul>
                  {service.schedule.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
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