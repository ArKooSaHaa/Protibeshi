/// src/features/marketplace/components/ProductDetailsModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    MapPin,
    MessageCircle,
    Bookmark,
    Flag,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import styles from './ProductDetailsModal.module.css';

const ProductDetailsModal = ({ isOpen, onClose, product }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [message, setMessage] = useState('');
    const [isSaved, setIsSaved] = useState(false);
    const [showReportConfirm, setShowReportConfirm] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const messageInputRef = useRef(null);

    /* ================= Scroll Lock ================= */
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => (document.body.style.overflow = '');
    }, [isOpen]);

    /* ================= ESC Close ================= */
    useEffect(() => {
        const handleEsc = (e) => e.key === 'Escape' && onClose();
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!product) return null;

    const images = [product.image, product.image, product.image];

    const nextImage = () =>
        setCurrentImageIndex((prev) => (prev + 1) % images.length);

    const prevImage = () =>
        setCurrentImageIndex(
            (prev) => (prev - 1 + images.length) % images.length
        );

    /* ================= Actions ================= */
    const handleMessageClick = () => {
        messageInputRef.current?.focus();
    };

    const handleSaveToggle = () => {
        setIsSaved((prev) => !prev);
        console.log(isSaved ? 'Unsaved item' : 'Saved item');
    };

    const handleReport = () => {
        setShowReportConfirm(true);
    };

    const confirmReport = () => {
        console.log('Reported listing:', product.id);
        setShowReportConfirm(false);
    };

    const handleMoreMenu = () => {
        setShowMenu((prev) => !prev);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!message.trim()) return;
        console.log('Sending message:', message);
        setMessage('');
    };

    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <motion.div
                    className={styles.overlay}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                >
                    <motion.div
                        className={styles.modal}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.2 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close */}
                        <motion.button
                            className={styles.closeButton}
                            onClick={onClose}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                        >
                            <X size={24} />
                        </motion.button>

                        <div className={styles.content}>
                            {/* ================= IMAGE SECTION ================= */}
                            <div className={styles.imageSection}>
                                <div className={styles.mainImageContainer}>
                                    <AnimatePresence mode="wait">
                                        <motion.img
                                            key={currentImageIndex}
                                            src={images[currentImageIndex]}
                                            alt={product.title}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                        />
                                    </AnimatePresence>

                                    {images.length > 1 && (
                                        <>
                                            <button
                                                className={`${styles.navButton} ${styles.navLeft}`}
                                                onClick={prevImage}
                                            >
                                                <ChevronLeft size={22} />
                                            </button>

                                            <button
                                                className={`${styles.navButton} ${styles.navRight}`}
                                                onClick={nextImage}
                                            >
                                                <ChevronRight size={22} />
                                            </button>
                                        </>
                                    )}
                                </div>

                                <div className={styles.thumbnails}>
                                    {images.map((img, index) => (
                                        <button
                                            key={index}
                                            className={`${styles.thumbnail} ${index === currentImageIndex
                                                    ? styles.thumbnailActive
                                                    : ''
                                                }`}
                                            onClick={() => setCurrentImageIndex(index)}
                                        >
                                            <img src={img} alt={`thumb-${index}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ================= DETAILS SECTION ================= */}
                            <div className={styles.detailsSection}>
                                <div className={styles.header}>
                                    <h1 className={styles.title}>{product.title}</h1>

                                    <div className={styles.priceContainer}>
                                        <span className={styles.price}>
                                            {product.price}
                                        </span>
                                        <span className={styles.status}>• In stock</span>
                                    </div>

                                    <div className={styles.location}>
                                        <MapPin size={14} />
                                        Listed in {product.location}
                                    </div>
                                </div>

                                {/* ================= ACTIONS ================= */}
                                <div className={styles.actions}>
                                    <button
                                        className={styles.messageButton}
                                        onClick={handleMessageClick}
                                    >
                                        <MessageCircle size={18} />
                                        Message
                                    </button>

                                    <button
                                        className={styles.iconButton}
                                        onClick={handleSaveToggle}
                                    >
                                        <Bookmark
                                            size={18}
                                            fill={isSaved ? '#1877f2' : 'none'}
                                        />
                                    </button>

                                    <button
                                        className={styles.iconButton}
                                        onClick={handleReport}
                                    >
                                        <Flag size={18} />
                                    </button>
                                </div>

                                {/* ================= CONTENT ================= */}
                                <div className={styles.detailsContent}>
                                    <h2 className={styles.sectionTitle}>Details</h2>

                                    <div className={styles.detailRow}>
                                        <span>Condition</span>
                                        <span>New</span>
                                    </div>

                                    <div className={styles.description}>
                                        <p>
                                            High-quality product in excellent condition.
                                        </p>
                                    </div>

                                    <div className={styles.mapPlaceholder}>
                                        <MapPin size={42} />
                                    </div>

                                    {/* ================= MESSAGE ================= */}
                                    <div className={styles.messageSection}>
                                        <form onSubmit={handleSendMessage}>
                                            <textarea
                                                ref={messageInputRef}
                                                className={styles.messageInput}
                                                value={message}
                                                onChange={(e) =>
                                                    setMessage(e.target.value)
                                                }
                                                placeholder={`Hi, is this ${product.title} still available?`}
                                            />

                                            <button
                                                type="submit"
                                                className={styles.sendButton}
                                                disabled={!message.trim()}
                                            >
                                                Send Message
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ================= REPORT CONFIRM ================= */}
                        <AnimatePresence>
                            {showReportConfirm && (
                                <motion.div
                                    className={styles.reportOverlay}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <motion.div
                                        className={styles.reportDialog}
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.9, opacity: 0 }}
                                    >
                                        <h3>Report Listing?</h3>
                                        <p>This will notify moderators.</p>
                                        <div>
                                            <button
                                                onClick={() =>
                                                    setShowReportConfirm(false)
                                                }
                                            >
                                                Cancel
                                            </button>
                                            <button onClick={confirmReport}>
                                                Report
                                            </button>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ProductDetailsModal;