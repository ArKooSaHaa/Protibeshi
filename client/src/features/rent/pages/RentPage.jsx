//  src/features/rent/pages/RentPage.jsx 
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useScroll, useTransform } from
  'framer-motion';
import { useNavigate } from 'react-router-dom';
import RentFilters from '../components/RentFilters';
import RentListingCard from '../components/RentListingCard';
import AddPropertyModal from '../components/AddPropertyModal';
import RentDetailsDrawer from '../components/RentDetailsDrawer';
import { getMessages, sendMessage, startConversation } from '@/api/chatApi';
import { ROUTES } from '@/config/routes.config';
import { getRentListings } from '@/services/rentService';
import styles from './RentPage.module.css';

export const RentPage = () => {
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const [allListings, setAllListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [activeDetails, setActiveDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedError, setFeedError] = useState(null);
  const [filters, setFilters] = useState({
    radius: null,
    minPrice: 0,
    maxPrice: null,
    propertyTypes: [],
    bedrooms: [],
    furnishing: [],
    availability: [],
    verifiedOnly: false,
    sort: 'nearest',
  });

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const headerOpacity = useTransform(scrollYProgress, [0, 0.15], [1,
    0.8]);
  const headerY = useTransform(scrollYProgress, [0, 1], [0, 120]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const fetchRentListings = useCallback(async () => {
    setIsLoading(true);
    setFeedError(null);
    try {
      const data = await getRentListings();
      setAllListings(data);
    } catch (error) {
      setFeedError(error.message || 'Failed to load rent listings.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRentListings();
  }, [fetchRentListings]);

  const applyFilters = (currentFilters, sourceListings = allListings) => {
    let results = [...sourceListings];

    // Filter by minimum price.
    const minPrice = Number(currentFilters.minPrice) || 0;
    results = results.filter((item) => Number(item.price) >= minPrice);

    // Apply max price only when user has explicitly set one.
    if (currentFilters.maxPrice !== null && currentFilters.maxPrice !== undefined) {
      const maxPrice = Number(currentFilters.maxPrice);
      if (!Number.isNaN(maxPrice)) {
        results = results.filter((item) => Number(item.price) <= maxPrice);
      }
    }

    // Apply radius only when user has explicitly set one.
    if (currentFilters.radius !== null && currentFilters.radius !== undefined) {
      const radius = Number(currentFilters.radius);
      if (!Number.isNaN(radius)) {
        results = results.filter((item) => Number(item.distance ?? 0) <= radius);
      }
    }

    // Filter by property type 
    if (currentFilters.propertyTypes.length > 0) {
      results = results.filter((item) =>
        currentFilters.propertyTypes.includes(item.type));
    }

    // Filter by bedrooms 
    if (currentFilters.bedrooms.length > 0) {
      results = results.filter((item) => {
        const beds = item.beds === 0 ? 'studio' : `${item.beds}bhk`;
        return currentFilters.bedrooms.includes(beds);
      });
    }

    // Filter by furnishing 
    if (currentFilters.furnishing.length > 0) {
      results = results.filter((item) =>
        currentFilters.furnishing.includes(item.furnishing));
    }

    // Filter by availability 
    if (currentFilters.availability.length > 0) {
      results = results.filter((item) =>
        currentFilters.availability.includes(item.availability));
    }

    // Filter by verified only 
    if (currentFilters.verifiedOnly) {
      results = results.filter((item) => item.verified);
    }

    // Apply sorting 
    results = results.sort((a, b) => {
      switch (currentFilters.sort) {
        case 'nearest':
          return a.distance - b.distance;
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'recent':
          return a.listedDays - b.listedDays;
        case 'popular':
          return b.views - a.views;
        default:
          return a.distance - b.distance;
      }
    });

    setFilteredListings(results);
  };

  useEffect(() => {
    applyFilters(filters, allListings);
  }, [filters, allListings]);

  const handlePropertyAdded = (newListing) => {
    // Optimistically prepend the new listing if the API returned it,
    // then refresh from server to stay in sync.
    if (newListing) {
      setAllListings((prev) => [newListing, ...prev]);
    }
    fetchRentListings();
    setIsAddPropertyOpen(false);
  };

  const openRentConversation = useCallback(async (listing) => {
    if (!listing?.user?.id) {
      setFeedError('Owner details are not available for this listing.');
      return;
    }

    setFeedError(null);

    try {
      const conversationResponse = await startConversation(Number(listing.user.id), null);
      const conversationId = Number(conversationResponse?.conversation?.id);

      if (!Number.isFinite(conversationId)) {
        throw new Error('Unable to open this conversation right now.');
      }

      await getMessages(conversationId);

      const details = [
        `Property: ${listing.title || 'N/A'}`,
        `Price: BDT ${(Number(listing.price) || 0).toLocaleString()}`,
        `Location: ${listing.location || 'N/A'}`,
        `Beds: ${listing.beds ?? 'N/A'}`,
        `Baths: ${listing.baths ?? 'N/A'}`,
        `Size: ${listing.sqft ? `${listing.sqft} sq ft` : 'N/A'}`,
        `Type: ${listing.type || 'N/A'}`,
        `Furnishing: ${listing.furnishing || 'N/A'}`,
        `Availability: ${listing.availability || 'N/A'}`,
      ].join('\n');

      const suggestedMessage = `Hello, I am interested in this rent listing.\n\n${details}\n\nIs this property still available?`;
      await sendMessage(conversationId, suggestedMessage.slice(0, 4900));

      navigate(`${ROUTES.MESSAGES}?conversation=${conversationId}`);
    } catch (error) {
      setFeedError(error instanceof Error ? error.message : 'Failed to open conversation.');
    }
  }, [navigate]);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
  };

  return (
    <div className={styles.rentPage} ref={containerRef}>
      {/* Header */}
      <motion.div className={styles.header} style={{
        opacity:
          headerOpacity, y: headerY
      }}>
        <div className={styles.headerMedia} aria-hidden="true">
          <video
            className={styles.headerVideo}
            src="/homeRent.mp4"
            autoPlay
            muted
            loop
            playsInline
          />
          <div className={styles.headerOverlay} />
        </div>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Rent Home</h1>
          <p className={styles.subtitle}>Verified rentals within walking
            distance</p>
        </div>

        <motion.button
          type="button"
          className={styles.openFiltersButton}
          whileHover={{ y: -2, scale: 1.01 }}
          whileTap={{ y: 1, scale: 0.99 }}
          onClick={() => setIsFiltersOpen(true)}
        >
          Open Filters
        </motion.button>

        <motion.button
          type="button"
          className={styles.addPropertyButton}
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ y: 1, scale: 0.98 }}
          onClick={() => setIsAddPropertyOpen(true)}
        >
          + Add Property
        </motion.button>
      </motion.div>

      {/* Main Content Grid */}
      <div className={styles.contentGrid}>
        {/* Center - Listings Grid */}
        <motion.section
          className={styles.listingsGrid}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {isLoading ? (
            <div className={styles.feedStatus}>
              <p>Loading listings…</p>
            </div>
          ) : feedError ? (
            <div className={styles.feedStatus}>
              <p className={styles.feedError}>{feedError}</p>
            </div>
          ) : filteredListings.length > 0 ? (
            filteredListings.map((listing) => (
              <motion.div key={listing.id} variants={cardVariants}>
                <RentListingCard
                  listing={listing}
                  onViewDetails={setActiveDetails}
                  onMessage={openRentConversation}
                />
              </motion.div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <h3>No listings found</h3>
              <p>Try adjusting your filters or widening your search
                radius</p>
            </div>
          )}
        </motion.section>
      </div>

      <AnimatePresence>
        {isFiltersOpen && (
          <motion.div
            className={styles.filtersModalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsFiltersOpen(false)}
          >
            <motion.div
              className={styles.filtersModal}
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={styles.filtersModalHeader}>
                <h2 className={styles.filtersModalTitle}>Filters</h2>
                <button
                  type="button"
                  className={styles.filtersModalClose}
                  onClick={() => setIsFiltersOpen(false)}
                >
                  Close
                </button>
              </div>
              <RentFilters filters={filters} onFilterChange={handleFilterChange} />
            </motion.div>
          </motion.div>
        )}
        {isAddPropertyOpen && (
          <AddPropertyModal
            onClose={() => setIsAddPropertyOpen(false)}
            onSuccess={handlePropertyAdded}
          />
        )}
      </AnimatePresence>

      <RentDetailsDrawer
        listing={activeDetails}
        onClose={() => setActiveDetails(null)}
        onContact={(listing) => {
          setActiveDetails(null);
          void openRentConversation(listing);
        }}
      />
    </div>
  );
};

export default RentPage; 