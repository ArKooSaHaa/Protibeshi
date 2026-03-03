import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import styles from './RentDetailsDrawer.module.css';

const getAvailabilityLabel = (listing) => {
  if (!listing) {
    return '';
  }

  if (listing.availability === 'dated') {
    return `From ${listing.availabilityDate}`;
  }

  if (listing.availability === 'now') {
    return 'Available now';
  }

  return 'Flexible';
};

const RentDetailsDrawer = ({ listing, onClose, onContact }) => {
  const availabilityLabel = getAvailabilityLabel(listing);

  return (
    <AnimatePresence>
      {listing && (
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
              <h3>Property Details</h3>
              <button
                type="button"
                className={styles.closeButton}
                onClick={onClose}
              >
                <X size={16} />
              </button>
            </div>

            <div className={styles.scrollContent}>
              <div className={styles.providerRow}>
                <img src={listing.image} alt={listing.title} />
                <div>
                  <strong>{listing.verified ? 'Verified landlord' : 'Property owner'}</strong>
                  <p>{listing.location}</p>
                </div>
              </div>

              <h4 className={styles.title}>{listing.title}</h4>
              <p className={styles.body}>
                Spacious {listing.type} with {listing.furnishing} setup, ideal for residents looking near {listing.location}.
              </p>

              <div className={styles.metaGrid}>
                <div><span>Price</span><strong>₹{listing.price.toLocaleString()}</strong></div>
                <div><span>Deposit</span><strong>₹{listing.deposit.toLocaleString()}</strong></div>
                <div><span>Beds & Baths</span><strong>{listing.beds === 0 ? 'Studio' : `${listing.beds} Bed`} • {listing.baths} Bath</strong></div>
                <div><span>Service Radius</span><strong>{listing.distance}m</strong></div>
              </div>

              <section className={styles.section}>
                <h5>Property Info</h5>
                <ul>
                  <li>Size: {listing.sqft} sq ft</li>
                  <li>Type: {listing.type}</li>
                  <li>Furnishing: {listing.furnishing}</li>
                  <li>Availability: {availabilityLabel}</li>
                </ul>
              </section>

              <section className={styles.section}>
                <h5>Trust Signals</h5>
                <ul>
                  <li>{listing.verified ? 'Verified landlord' : 'Owner listed'}</li>
                  <li>{listing.views} views</li>
                  <li>{listing.listedDays === 0 ? 'Listed today' : `${listing.listedDays} days ago`}</li>
                </ul>
              </section>
            </div>

            <motion.button
              type="button"
              className={styles.contactButton}
              whileHover={{ y: -1, scale: 1.01 }}
              whileTap={{ y: 1, scale: 0.99 }}
              onClick={() => onContact(listing)}
            >
              Contact Provider
            </motion.button>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RentDetailsDrawer;
