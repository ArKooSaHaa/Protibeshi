//  src/features/services/pages/ServicesPage.tsx 
import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useScroll, useTransform } from
  'framer-motion';
import { TriangleAlert, X } from 'lucide-react';
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

  const {
    filters,
    filteredServices,
    bookmarkedIds,
    isOfferModalOpen,
    isFilterDrawerOpen,
    activeDetails,
    activeChat,
    chatMessages,
    setFilters,
    setIsOfferModalOpen,
    setIsFilterDrawerOpen,
    setActiveDetails,
    setActiveChat,
    onToggleBookmark,
    onAddService,
    onSendMessage,
    getPriceLabel,
  } = useServicesMarketplace();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.22], [1,
    0.82]);

  const handleReport = (service: ServiceItem) => {
    window.alert(`Service report submitted for ${service.providerName}. 
Our team will review this.`);
  };

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

  return (
    <div className={styles.page} ref={containerRef}>
      <ServicesHero
        onOfferClick={() => setIsOfferModalOpen(true)}
        onFilterClick={() => setIsFilterDrawerOpen(true)}
        y={heroY}
        opacity={heroOpacity}
      />

      <section className={styles.servicesColumn}>
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
                onMessage={setActiveChat}
                onViewDetails={setActiveDetails}
                onReport={handleReport}
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
              <h3>No services match these filters</h3>
              <p>Try increasing distance or removing one filter.</p>
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
      />

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
