// src/features/marketplace/pages/MarketplacePage.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import { ChevronDown, MapPin, Search, SlidersHorizontal, Sparkles, Loader, X } from 'lucide-react';
import CreateListingModal from '../components/CreateListingModal';
import ProductDetailsModal from '../components/ProductDetailsModal';
import { getListings } from '@/services/listingService';
import styles from './MarketplacePage.module.css';

const BACKEND_ORIGIN = 'http://127.0.0.1:8000';
const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=640&q=80';

const categories = [
  'Electronics',
  'Vehicles',
  'Fashion',
  'Furniture',
  'Real Estate',
  'Services',
];

const buildPhotoUrl = (listing) => {
  if (listing?.photo_url) {
    return listing.photo_url;
  }

  if (listing?.photo) {
    return `${BACKEND_ORIGIN}/storage/${listing.photo}`;
  }

  return FALLBACK_IMAGE;
};

const mapListingToCard = (listing) => {
  const numericPrice = Number(listing?.price ?? 0);
  const safePrice = Number.isFinite(numericPrice) ? numericPrice : 0;

  return {
    id: listing.id,
    title: listing.title || 'Untitled listing',
    price: `BDT ${safePrice.toLocaleString()}`,
    priceValue: safePrice,
    location: listing.location || 'Location not provided',
    badge: listing.is_active ? 'Active' : 'Inactive',
    category: listing.category || 'Other',
    details: listing.details || '',
    image: buildPhotoUrl(listing),
  };
};

export const MarketplacePage = () => {
  const containerRef = useRef(null);

  const [displayCount, setDisplayCount] = useState(12);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isFeedLoading, setIsFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState('');
  const [listings, setListings] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('for-you');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.6]);
  const toolbarOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0.8]);
  const toolbarY = useTransform(scrollYProgress, [0, 0.1], [0, -10]);

  const cardContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.2,
      },
    },
  };

  const cardItemVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  const loadMarketplaceListings = async () => {
    setFeedError('');
    setIsFeedLoading(true);

    try {
      const apiListings = await getListings();
      const mapped = apiListings.map(mapListingToCard);
      setListings(mapped);
      setDisplayCount(12);
    } catch (error) {
      setFeedError(error.message || 'Failed to load marketplace listings.');
    } finally {
      setIsFeedLoading(false);
    }
  };

  useEffect(() => {
    loadMarketplaceListings();
  }, []);

  const handleListingCreated = async (createdListing) => {
    if (createdListing?.id) {
      const optimisticCard = mapListingToCard(createdListing);

      setListings((previous) => {
        const exists = previous.some((item) => item.id === optimisticCard.id);
        if (exists) {
          return previous;
        }

        return [optimisticCard, ...previous];
      });
    }

    await loadMarketplaceListings();
  };

  const filteredListings = useMemo(() => {
    let filtered = listings;

    if (selectedCategory) {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    if (selectedFilter === 'verified') {
      filtered = filtered.filter((item) => item.badge === 'Verified');
    } else if (selectedFilter === 'top-deals') {
      filtered = filtered.filter((item) => item.priceValue > 0);
    }

    return filtered;
  }, [listings, selectedCategory, selectedFilter]);

  const hasMoreListings = displayCount < filteredListings.length;

  const handleLoadMore = () => {
    setIsLoadingMore(true);

    setTimeout(() => {
      setDisplayCount((prev) => Math.min(prev + 8, filteredListings.length));
      setIsLoadingMore(false);
    }, 600);
  };

  return (
    <div className={styles.marketplacePage} ref={containerRef}>
      <motion.div
        className={styles.hero}
        style={{ y: heroY, opacity: heroOpacity }}
      >
        <div className={styles.heroMedia} aria-hidden="true">
          <video
            className={styles.heroVideo}
            src="/marketplace.mp4"
            autoPlay
            muted
            loop
            playsInline
          />
          <div className={styles.heroOverlay} />
        </div>

        <div className={styles.heroContent}>
          <span className={styles.kicker}>Marketplace</span>
          <h1 className={styles.title}>Today&apos;s picks</h1>
          <p className={styles.subtitle}>
            Shop locally with trusted sellers, verified listings, and smart discovery.
          </p>
          <div className={styles.locationPill}>
            <MapPin size={14} />
            Dhaka • 65 km
          </div>
        </div>

        <div className={styles.heroCategoryWrap}>
          <motion.button
            type="button"
            className={`${styles.createPill} ${styles.heroCategoryButton}`}
            onClick={() => setIsCategoriesOpen(true)}
            aria-expanded={isCategoriesOpen}
            aria-controls="marketplace-category-modal"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <SlidersHorizontal size={14} />
            Categories
            <ChevronDown
              size={14}
              className={`${styles.panelToggleIcon} ${isCategoriesOpen ? styles.panelToggleIconOpen : ''}`}
              aria-hidden="true"
            />
          </motion.button>
        </div>

        <div className={styles.heroCreateWrap}>
          <motion.button
            type="button"
            className={`${styles.createPill} ${styles.heroCreateButton}`}
            onClick={() => setIsCreateModalOpen(true)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Sparkles size={14} />
            Create new listing
          </motion.button>
        </div>
      </motion.div>

      <motion.div
        className={styles.toolbar}
        style={{ opacity: toolbarOpacity, y: toolbarY }}
      >
        <div className={styles.searchBox}>
          <Search size={16} />
          <input placeholder="Search Marketplace" />
        </div>

        <div className={styles.filterPills}>
          <motion.button
            type="button"
            className={`${styles.filterPill} ${selectedFilter === 'for-you' ? styles.filterPillActive : ''}`}
            onClick={() => setSelectedFilter('for-you')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            For you
          </motion.button>

          <motion.button
            type="button"
            className={`${styles.filterPill} ${selectedFilter === 'nearby' ? styles.filterPillActive : ''}`}
            onClick={() => setSelectedFilter('nearby')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Nearby
          </motion.button>

          <motion.button
            type="button"
            className={`${styles.filterPill} ${selectedFilter === 'top-deals' ? styles.filterPillActive : ''}`}
            onClick={() => setSelectedFilter('top-deals')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Top deals
          </motion.button>

          <motion.button
            type="button"
            className={`${styles.filterPill} ${selectedFilter === 'verified' ? styles.filterPillActive : ''}`}
            onClick={() => setSelectedFilter('verified')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Verified
          </motion.button>
        </div>
      </motion.div>

      {feedError && <div className={styles.feedError}>{feedError}</div>}

      <div className={styles.contentGrid}>
        {isFeedLoading ? (
          <div className={styles.feedLoading}>
            <Loader size={18} className={styles.spinIcon} />
            Loading marketplace listings...
          </div>
        ) : (
          <motion.section
            className={styles.cardsGrid}
            variants={cardContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, margin: '0px 0px -100px 0px' }}
          >
            {filteredListings.length === 0 && (
              <div className={styles.emptyState}>No listings found.</div>
            )}

            {filteredListings
              .slice(0, displayCount)
              .map((item) => (
                <motion.article
                  key={item.id}
                  className={styles.card}
                  variants={cardItemVariants}
                  whileHover={{ y: -6, rotateX: 2, rotateY: -2 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setSelectedProduct(item)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={styles.cardImage}>
                    <img src={item.image} alt={item.title} />
                    <span className={styles.badge}>{item.badge}</span>
                  </div>

                  <div className={styles.cardBody}>
                    <span className={styles.price}>{item.price}</span>
                    <h3 className={styles.cardTitle}>{item.title}</h3>
                    <span className={styles.cardLocation}>{item.location}</span>
                  </div>
                </motion.article>
              ))}
          </motion.section>
        )}

        {!isFeedLoading && hasMoreListings && (
          <motion.div
            className={styles.loadMoreContainer}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.button
              type="button"
              className={styles.loadMoreButton}
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              whileHover={{ scale: isLoadingMore ? 1 : 1.04 }}
              whileTap={{ scale: isLoadingMore ? 1 : 0.98 }}
            >
              {isLoadingMore ? (
                <>
                  <Loader size={16} className={styles.spinIcon} />
                  Loading...
                </>
              ) : (
                <>
                  Load More Listings
                  <span className={styles.count}>
                    ({filteredListings.length - displayCount} more)
                  </span>
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </div>

      <CreateListingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleListingCreated}
      />

      <AnimatePresence>
        {isCategoriesOpen && (
          <motion.div
            id="marketplace-category-modal"
            className={styles.categoryOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsCategoriesOpen(false)}
          >
            <motion.div
              className={styles.categoryModal}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={styles.categoryModalHeader}>
                <h3>Choose Category</h3>
                <button
                  type="button"
                  className={styles.categoryModalClose}
                  onClick={() => setIsCategoriesOpen(false)}
                  aria-label="Close category options"
                >
                  <X size={18} />
                </button>
              </div>

              <div className={styles.categoryListWrapper}>
                <div className={styles.categoryList}>
                  {categories.map((category) => (
                    <motion.button
                      key={category}
                      type="button"
                      className={`${styles.categoryItem} ${selectedCategory === category ? styles.categoryItemActive : ''}`}
                      aria-pressed={selectedCategory === category}
                      onClick={() =>
                        setSelectedCategory(
                          selectedCategory === category ? null : category
                        )
                      }
                      whileHover={{ y: -1 }}
                      transition={{ duration: 0.18 }}
                    >
                      {category}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className={styles.panelHeader}>Price range</div>
              <div className={styles.priceGrid}>
                <input className={styles.priceInput} placeholder="Min" />
                <input className={styles.priceInput} placeholder="Max" />
                <button type="button" className={styles.priceApply}>
                  Apply
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ProductDetailsModal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct}
      />
    </div>
  );
};
