// src/features/marketplace/pages/MarketplacePage.jsx
import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { MapPin, Search, SlidersHorizontal, Sparkles, Tag, Loader } from 'lucide-react';
import CreateListingModal from '../components/CreateListingModal';
import ProductDetailsModal from '../components/ProductDetailsModal';
import styles from './MarketplacePage.module.css';

const listings = [
    {
        id: 1,
        title: 'M19 TWS Gaming Bluetooth Earbuds',
        price: 'BDT388',
        location: 'Dhaka, Bangladesh',
        badge: 'Top pick',
        category: 'Electronics',
        image:
            'https://images.unsplash.com/photo-1518441902110-5e56d6b76d19?auto=format&fit=crop&w=640&q=80',
    },
    {
        id: 2,
        title: 'iPad (9th Gen) 64GB WiFi',
        price: 'BDT2,835',
        location: 'Bara Kalampur, Dhaka',
        badge: 'Verified',
        category: 'Electronics',
        image:
            'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?auto=format&fit=crop&w=640&q=80',
    },
    {
        id: 3,
        title: 'High Quality Sneakers',
        price: 'BDT450',
        location: 'Dhaka, Bangladesh',
        badge: 'New',
        category: 'Fashion',
        image:
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=640&q=80',
    },
    {
        id: 4,
        title: 'Gixxer Monotone 150cc',
        price: 'BDT151,000',
        location: 'Dhaka, Bangladesh',
        badge: 'Hot',
        category: 'Vehicles',
        image:
            'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=640&q=80',
    },
    {
        id: 5,
        title: 'Racing Helmet',
        price: 'BDT1,200',
        location: 'Uttara, Dhaka',
        badge: 'Just listed',
        category: 'Vehicles',
        image:
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=640&q=80',
    },
    {
        id: 6,
        title: 'Studio PC Build',
        price: 'BDT38,000',
        location: 'Dhanmondi, Dhaka',
        badge: 'Ready',
        category: 'Electronics',
        image:
            'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=640&q=80',
    },
    {
        id: 7,
        title: 'Vintage Leather Sofa',
        price: 'BDT8,500',
        location: 'Gulshan, Dhaka',
        badge: 'Trending',
        category: 'Furniture',
        image:
            'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=640&q=80',
    },
    {
        id: 8,
        title: 'MacBook Air M1 2020',
        price: 'BDT85,000',
        location: 'Banani, Dhaka',
        badge: 'Hot',
        category: 'Electronics',
        image:
            'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=640&q=80',
    },
    {
        id: 9,
        title: 'Professional Camera DSLR',
        price: 'BDT42,000',
        location: 'Mohakhali, Dhaka',
        badge: 'Verified',
        category: 'Electronics',
        image:
            'https://images.unsplash.com/photo-1489749798305-4fea3ba63d60?auto=format&fit=crop&w=640&q=80',
    },
    {
        id: 10,
        title: 'Gaming Laptop RTX 4060',
        price: 'BDT95,000',
        location: 'Mirpur, Dhaka',
        badge: 'New',
        category: 'Electronics',
        image:
            'https://images.unsplash.com/photo-1588872657840-18ed94f19141?auto=format&fit=crop&w=640&q=80',
    },
    {
        id: 11,
        title: 'Mountain Bike Trek 3900',
        price: 'BDT18,500',
        location: 'Uttara, Dhaka',
        badge: 'Top pick',
        category: 'Vehicles',
        image:
            'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=640&q=80',
    },
    {
        id: 12,
        title: 'Wireless Smart Speaker',
        price: 'BDT3,200',
        location: 'Dhanmondi, Dhaka',
        badge: 'Just listed',
        category: 'Electronics',
        image:
            'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=640&q=80',
    },
    {
        id: 13,
        title: 'Vintage Ottoman Chair',
        price: 'BDT2,800',
        location: 'Gulshan, Dhaka',
        badge: 'Ready',
        category: 'Furniture',
        image:
            'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=640&q=80',
    },
    {
        id: 14,
        title: 'Professional Microphone Set',
        price: 'BDT5,600',
        location: 'Banani, Dhaka',
        badge: 'Trending',
        category: 'Electronics',
        image:
            'https://images.unsplash.com/photo-1516321318423-f06f70504504?auto=format&fit=crop&w=640&q=80',
    },
    {
        id: 15,
        title: 'Smart Watch Apple Watch 7',
        price: 'BDT28,000',
        location: 'Mohakhali, Dhaka',
        badge: 'Hot',
        category: 'Electronics',
        image:
            'https://images.unsplash.com/photo-1505941957517-cf71ee64871d?auto=format&fit=crop&w=640&q=80',
    },
    {
        id: 16,
        title: 'Designer Handbag Lv Style',
        price: 'BDT4,200',
        location: 'Mirpur, Dhaka',
        badge: 'Verified',
        category: 'Fashion',
        image:
            'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=640&q=80',
    },
];

const categories = [
    'Electronics',
    'Vehicles',
    'Fashion',
    'Furniture',
    'Real Estate',
    'Services',
];

export const MarketplacePage = () => {
    const containerRef = useRef(null);
    const heroRef = useRef(null);

    const [displayCount, setDisplayCount] = useState(12);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedFilter, setSelectedFilter] = useState('for-you');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end start'],
    });

    // Parallax effect for hero background
    const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.6]);

    // Toolbar fade effect
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

    const handleLoadMore = () => {
        setIsLoading(true);
        setTimeout(() => {
            setDisplayCount((prev) => Math.min(prev + 8, listings.length));
            setIsLoading(false);
        }, 600);
    };

    const getFilteredListings = () => {
        let filtered = listings;

        if (selectedCategory) {
            filtered = filtered.filter(
                (item) => item.category === selectedCategory
            );
        }

        if (selectedFilter === 'verified') {
            filtered = filtered.filter((item) => item.badge === 'Verified');
        } else if (selectedFilter === 'top-deals') {
            filtered = filtered.filter(
                (item) =>
                    item.badge === 'Hot' || item.price.includes('BDT')
            );
        }

        return filtered;
    };

    return (
        <div className={styles.marketplacePage} ref={containerRef}>
            <motion.div
                className={styles.hero}
                ref={heroRef}
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
            </motion.div>

            {/* Toolbar */}
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
                        className={`${styles.filterPill} ${selectedFilter === 'for-you'
                                ? styles.filterPillActive
                                : ''
                            }`}
                        onClick={() => setSelectedFilter('for-you')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        For you
                    </motion.button>

                    <motion.button
                        type="button"
                        className={`${styles.filterPill} ${selectedFilter === 'nearby'
                                ? styles.filterPillActive
                                : ''
                            }`}
                        onClick={() => setSelectedFilter('nearby')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Nearby
                    </motion.button>

                    <motion.button
                        type="button"
                        className={`${styles.filterPill} ${selectedFilter === 'top-deals'
                                ? styles.filterPillActive
                                : ''
                            }`}
                        onClick={() => setSelectedFilter('top-deals')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Top deals
                    </motion.button>

                    <motion.button
                        type="button"
                        className={`${styles.filterPill} ${selectedFilter === 'verified'
                                ? styles.filterPillActive
                                : ''
                            }`}
                        onClick={() => setSelectedFilter('verified')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Verified
                    </motion.button>

                    <motion.button
                        type="button"
                        className={styles.createPill}
                        onClick={() => setIsCreateModalOpen(true)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Sparkles size={14} />
                        Create new listing
                    </motion.button>
                </div>
            </motion.div>

            {/* Content Grid */}
            <div className={styles.contentGrid}>
                <aside className={styles.filtersPanel}>
                    <div className={styles.panelHeader}>Categories</div>
                    <div className={styles.categoryList}>
                        {categories.map((category) => (
                            <motion.button
                                key={category}
                                type="button"
                                className={`${styles.categoryItem} ${selectedCategory === category
                                        ? styles.categoryItemActive
                                        : ''
                                    }`}
                                onClick={() =>
                                    setSelectedCategory(
                                        selectedCategory === category ? null : category
                                    )
                                }
                                whileHover={{ x: 4 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Tag size={14} />
                                {category}
                            </motion.button>
                        ))}
                    </div>

                    <div className={styles.panelHeader}>Price range</div>
                    <div className={styles.priceGrid}>
                        <input className={styles.priceInput} placeholder="Min" />
                        <input className={styles.priceInput} placeholder="Max" />
                        <button type="button" className={styles.priceApply}>
                            Apply
                        </button>
                    </div>
                </aside>

                <motion.section
                    className={styles.cardsGrid}
                    variants={cardContainerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: false, margin: '0px 0px -100px 0px' }}
                >
                    {getFilteredListings()
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
                                    <span className={styles.cardLocation}>
                                        {item.location}
                                    </span>
                                </div>
                            </motion.article>
                        ))}
                </motion.section>

                {displayCount < listings.length && (
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
                            disabled={isLoading}
                            whileHover={{ scale: isLoading ? 1 : 1.04 }}
                            whileTap={{ scale: isLoading ? 1 : 0.98 }}
                        >
                            {isLoading ? (
                                <>
                                    <Loader size={16} className={styles.spinIcon} />
                                    Loading...
                                </>
                            ) : (
                                <>
                                    Load More Listings
                                    <span className={styles.count}>
                                        ({listings.length - displayCount} more)
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
            />

            <ProductDetailsModal
                isOpen={!!selectedProduct}
                onClose={() => setSelectedProduct(null)}
                product={selectedProduct}
            />
        </div>
    );
};