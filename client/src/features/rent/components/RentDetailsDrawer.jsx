import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
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

const RentDetailsDrawer = ({ listing, onClose, onContact, onReport }) => {
  const availabilityLabel = getAvailabilityLabel(listing);
  const [isReportPanelOpen, setIsReportPanelOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportFeedback, setReportFeedback] = useState(null);

  useEffect(() => {
    setIsReportPanelOpen(false);
    setReportReason('');
    setIsSubmittingReport(false);
    setReportFeedback(null);
  }, [listing?.id]);

  const handleSubmitReport = async (event) => {
    event.preventDefault();

    if (!listing || typeof onReport !== 'function') {
      return;
    }

    setIsSubmittingReport(true);
    setReportFeedback(null);

    try {
      const response = await onReport(listing, reportReason.trim());

      setReportReason('');
      setIsReportPanelOpen(false);
      setReportFeedback({
        variant: 'success',
        message: response?.message || 'Rent listing reported successfully.',
      });
    } catch (error) {
      setReportFeedback({
        variant: 'error',
        message: error instanceof Error ? error.message : 'Failed to report rent listing.',
      });
    } finally {
      setIsSubmittingReport(false);
    }
  };

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
                <img 
                  src={listing.user?.profile_picture || 'https://api.dicebear.com/9.x/avataaars/svg'} 
                  alt={listing.user?.first_name || 'User'} 
                  className={styles.providerAvatar}
                />
                <div className={styles.providerInfo}>
                  <div className={styles.providerNameRow}>
                    <strong>{listing.user ? `${listing.user.first_name} ${listing.user.last_name}`.trim() : 'Property owner'}</strong>
                    {listing.verified_landlord && (
                      <span className={styles.verifiedBadge}>✓ Verified</span>
                    )}
                  </div>
                  <p className={styles.providerLocation}>{listing.location}</p>
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
                  <li>{listing.verified_landlord ? 'Verified landlord' : 'Owner listed'}</li>
                  <li>{listing.views} views</li>
                  <li>{listing.listedDays === 0 ? 'Listed today' : `${listing.listedDays} days ago`}</li>
                </ul>
              </section>

              {reportFeedback ? (
                <p
                  className={`${styles.reportFeedback} ${reportFeedback.variant === 'success' ? styles.reportSuccess : styles.reportError}`}
                >
                  {reportFeedback.message}
                </p>
              ) : null}

              {isReportPanelOpen ? (
                <form className={styles.reportPanel} onSubmit={handleSubmitReport}>
                  <label htmlFor={`rent-report-reason-${listing.id}`} className={styles.reportLabel}>
                    Report reason (optional)
                  </label>
                  <textarea
                    id={`rent-report-reason-${listing.id}`}
                    className={styles.reportTextarea}
                    rows={4}
                    value={reportReason}
                    onChange={(event) => setReportReason(event.target.value)}
                    placeholder="Describe why this listing should be reviewed"
                    maxLength={500}
                  />
                  <p className={styles.reportHint}>Submitted reports are reviewed by the moderation team.</p>
                  <div className={styles.reportActions}>
                    <button
                      type="button"
                      className={styles.reportCancelButton}
                      onClick={() => {
                        setIsReportPanelOpen(false);
                        setReportReason('');
                      }}
                      disabled={isSubmittingReport}
                    >
                      Cancel
                    </button>
                    <button type="submit" className={styles.reportSubmitButton} disabled={isSubmittingReport}>
                      {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
                    </button>
                  </div>
                </form>
              ) : null}
            </div>

            <div className={styles.actionButtons}>
              <motion.button
                type="button"
                className={styles.contactButton}
                whileHover={{ y: -1, scale: 1.01 }}
                whileTap={{ y: 1, scale: 0.99 }}
                onClick={() => onContact(listing)}
              >
                Contact Provider
              </motion.button>

              {typeof onReport === 'function' ? (
                <motion.button
                  type="button"
                  className={styles.reportButton}
                  whileHover={{ y: -1, scale: 1.01 }}
                  whileTap={{ y: 1, scale: 0.99 }}
                  onClick={() => {
                    setIsReportPanelOpen((previous) => !previous);
                    setReportFeedback(null);
                  }}
                  disabled={isSubmittingReport}
                >
                  <AlertTriangle size={14} /> {isReportPanelOpen ? 'Hide Report Form' : 'Report Listing'}
                </motion.button>
              ) : null}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RentDetailsDrawer;
