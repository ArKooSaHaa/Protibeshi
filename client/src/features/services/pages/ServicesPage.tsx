//  src/features/services/pages/ServicesPage.tsx 
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useScroll, useTransform } from
  'framer-motion';
import { TriangleAlert, X } from 'lucide-react';
import { startConversation, getMessages, sendMessage } from '@/api/chatApi';
import { ROUTES } from '@/config/routes.config';
import { reportService } from '@/services/serviceService';
import { OfferServiceModal } from '../components/OfferServiceModal';
import { ServiceCard } from '../components/ServiceCard';
import { ServiceChatDrawer } from '../components/ServiceChatDrawer';
import { ServiceDetailsDrawer } from
  '../components/ServiceDetailsDrawer';
import { ServicesFilters } from '../components/ServicesFilters';
import { ServicesHero } from '../components/ServicesHero';
import { ServiceItem } from '../types/service.types';
import { useServicesMarketplace } from
  '../hooks/useServicesMarketplace';
import styles from './ServicesPage.module.css';

const cardContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
};

const cardItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

export const ServicesPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [reportTarget, setReportTarget] = useState<ServiceItem | null>(null);
  const [reportDetails, setReportDetails] = useState('');
  const [isReportSubmitting, setIsReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);

  const {
    filters,
    filteredServices,
    bookmarkedIds,
    isOfferModalOpen,
    isFilterDrawerOpen,
    activeDetails,
    activeChat,
    chatMessages,
    isLoading,
    isSubmitting,
    errorMessage,
    successMessage,
    setFilters,
    setIsOfferModalOpen,
    setIsFilterDrawerOpen,
    setActiveDetails,
    setActiveChat,
    onToggleBookmark,
    loadServices,
    onAddService,
    onSendMessage,
    clearFeedback,
    getPriceLabel,
  } = useServicesMarketplace();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.22], [1,
    0.82]);

  const openServiceConversation = useCallback(async (service: ServiceItem) => {
    if (!service?.ownerId) {
      console.error('Service owner information is not available');
      return;
    }

    try {
      const conversationResponse = await startConversation(Number(service.ownerId), null);
      const conversationId = Number(conversationResponse?.conversation?.id);

      if (!Number.isFinite(conversationId)) {
        throw new Error('Unable to open this conversation right now.');
      }

      await getMessages(conversationId);

      const details = [
        `Service: ${service.title || 'N/A'}`,
        `Category: ${service.category || 'N/A'}`,
        `Price: BDT ${(Number(service.price) || 0).toLocaleString()}`,
        `Price per: ${service.priceUnit || 'N/A'}`,
        `Experience: ${service.experience || 'N/A'} years`,
        `Location: ${service.location || 'N/A'}`,
        `Description: ${service.shortDescription || 'N/A'}`,
      ].join('\n');

      const suggestedMessage = `Hello, I would like to have the service.\n\n${details}\n\nPlease let me know more details.`;
      await sendMessage(conversationId, suggestedMessage.slice(0, 4900));

      navigate(`${ROUTES.MESSAGES}?conversation=${conversationId}`);
    } catch (error) {
      console.error('Failed to open conversation:', error);
    }
  }, [navigate]);

  const handleOpenReportModal = useCallback((service: ServiceItem) => {
    setReportTarget(service);
    setReportDetails('');
    setReportError(null);
  }, []);

  const handleCloseReportModal = useCallback(() => {
    if (isReportSubmitting) {
      return;
    }

    setReportTarget(null);
    setReportDetails('');
    setReportError(null);
  }, [isReportSubmitting]);

  const handleReportSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!reportTarget) {
      return;
    }

    const trimmedDetails = reportDetails.trim();

    if (trimmedDetails.length < 8) {
      setReportError('Please write at least 8 characters so the admin can review your report details.');
      return;
    }

    setIsReportSubmitting(true);
    setReportError(null);

    try {
      const response = await reportService(reportTarget.id, trimmedDetails);
      setReportSuccess(response.message || 'Service reported successfully.');
      setReportTarget(null);
      setReportDetails('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit service report.';
      setReportError(message);
    } finally {
      setIsReportSubmitting(false);
    }
  };

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      clearFeedback();
    }, 2600);

    return () => window.clearTimeout(timeoutId);
  }, [successMessage, clearFeedback]);

  useEffect(() => {
    if (!reportSuccess) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setReportSuccess(null);
    }, 2600);

    return () => window.clearTimeout(timeoutId);
  }, [reportSuccess]);

  useEffect(() => {
    if (!isFilterDrawerOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFilterDrawerOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isFilterDrawerOpen, setIsFilterDrawerOpen]);

  useEffect(() => {
    if (!reportTarget || isReportSubmitting) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCloseReportModal();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [handleCloseReportModal, isReportSubmitting, reportTarget]);

  return (
    <div className={styles.page} ref={containerRef}>
      <ServicesHero
        onOfferClick={() => setIsOfferModalOpen(true)}
        onFilterClick={() => setIsFilterDrawerOpen(true)}
        y={heroY}
        opacity={heroOpacity}
      />

      <section className={styles.servicesColumn}>
        {isLoading && <p className={styles.stateInfo}>Loading services...</p>}
        {errorMessage && <p className={styles.errorBanner}>{errorMessage}</p>}
        {successMessage && <p className={styles.successBanner}>{successMessage}</p>}
        {reportError && <p className={styles.errorBanner}>{reportError}</p>}
        {reportSuccess && <p className={styles.successBanner}>{reportSuccess}</p>}

        <motion.div
          className={styles.servicesGrid}
          variants={cardContainerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredServices.map((service) => (
            <motion.div key={service.id} variants={cardItemVariants}>
              <ServiceCard
                service={service}
                isBookmarked={bookmarkedIds.includes(service.id)}
                priceLabel={getPriceLabel(service)}
                onToggleBookmark={onToggleBookmark}
                onMessage={openServiceConversation}
                onViewDetails={setActiveDetails}
                onReport={handleOpenReportModal}
              />
            </motion.div>
          ))}
        </motion.div>

        <AnimatePresence>
          {filteredServices.length === 0 && (
            <motion.div
              className={styles.emptyState}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
            >
              <TriangleAlert size={20} />
              <h3>{isLoading ? 'Fetching services...' : 'No services match these filters'}</h3>
              <p>
                {isLoading
                  ? 'Please wait while we load neighborhood services.'
                  : 'Try increasing distance or removing one filter.'}
              </p>
              {!isLoading && (
                <button
                  type="button"
                  className={styles.retryButton}
                  onClick={() => void loadServices()}
                >
                  Reload Services
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <AnimatePresence>
        {isFilterDrawerOpen && (
          <motion.div
            className={styles.filterOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsFilterDrawerOpen(false)}
          >
            <motion.div
              className={styles.filterModal}
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={styles.filterModalHeader}>
                <h4>Filters</h4>
                <button
                  type="button"
                  className={styles.filterCloseButton}
                  onClick={() => setIsFilterDrawerOpen(false)}
                  aria-label="Close filters"
                >
                  <X size={18} />
                </button>
              </div>
              <div className={styles.filterModalBody}>
                <ServicesFilters filters={filters} onFilterChange={setFilters} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <OfferServiceModal
        isOpen={isOfferModalOpen}
        onClose={() => setIsOfferModalOpen(false)}
        onSubmit={onAddService}
        isSubmitting={isSubmitting}
      />

      <AnimatePresence>
        {reportTarget && (
          <motion.div
            className={styles.reportOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseReportModal}
          >
            <motion.div
              className={styles.reportModal}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={styles.reportHeader}>
                <h4>Report Service</h4>
                <button
                  type="button"
                  className={styles.reportCloseButton}
                  onClick={handleCloseReportModal}
                  aria-label="Close report modal"
                  disabled={isReportSubmitting}
                >
                  <X size={18} />
                </button>
              </div>

              <p className={styles.reportHint}>
                Share clear details so the admin team can review this service faster.
              </p>

              <p className={styles.reportTarget}>
                <strong>{reportTarget.title}</strong>
                <span> by {reportTarget.providerName}</span>
              </p>

              <form className={styles.reportForm} onSubmit={handleReportSubmit}>
                <label className={styles.reportLabel} htmlFor="service-report-details">
                  Report details
                </label>
                <textarea
                  id="service-report-details"
                  className={styles.reportTextarea}
                  value={reportDetails}
                  onChange={(event) => setReportDetails(event.target.value)}
                  placeholder="Example: The description says certified electrician, but provider requested advance payment and gave inconsistent details..."
                  rows={6}
                  maxLength={500}
                  required
                  disabled={isReportSubmitting}
                />
                <div className={styles.reportMetaRow}>
                  <span>Minimum 8 characters</span>
                  <span>{reportDetails.trim().length}/500</span>
                </div>

                <div className={styles.reportActions}>
                  <button
                    type="button"
                    className={styles.reportCancelButton}
                    onClick={handleCloseReportModal}
                    disabled={isReportSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={styles.reportSubmitButton}
                    disabled={isReportSubmitting}
                  >
                    {isReportSubmitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ServiceDetailsDrawer
        service={activeDetails}
        priceLabel={activeDetails ? getPriceLabel(activeDetails) : ''}
        onClose={() => setActiveDetails(null)}
        onContact={(service) => {
          setActiveDetails(null);
          setActiveChat(service);
        }}
      />

      <ServiceChatDrawer
        service={activeChat}
        messages={activeChat ? chatMessages[activeChat.id] || [] : []}
        onSend={onSendMessage}
        onClose={() => setActiveChat(null)}
      />
    </div>
  );
};
