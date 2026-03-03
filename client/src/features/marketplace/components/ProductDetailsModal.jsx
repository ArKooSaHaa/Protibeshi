/// src/features/marketplace/components/ProductDetailsModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle } from 'lucide-react';
import styles from './ProductDetailsModal.module.css';

const ProductDetailsModal = ({ isOpen, onClose, product }) => {
    const [message, setMessage] = useState('');
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

    /* ================= Actions ================= */
    const handleMessageClick = () => {
        messageInputRef.current?.focus();
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
                                    <motion.img
                                        src={product.image}
                                        alt={product.title}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.2 }}
                                    />
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
                                    </div>
                                </div>

                                {/* ================= CONTENT ================= */}
                                <div className={styles.detailsContent}>
                                    <h2 className={styles.sectionTitle}>Category</h2>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Type</span>
                                        <span className={styles.detailValue}>{product.category}</span>
                                    </div>

                                    <h2 className={styles.sectionTitle}>Details</h2>
                                    <div className={styles.description}>
                                        <p>
                                            {product.title} is available for purchase at {product.price}.
                                        </p>
                                    </div>

                                    <h2 className={styles.sectionTitle}>Additional details</h2>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Listing tag</span>
                                        <span className={styles.detailValue}>{product.badge}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Location</span>
                                        <span className={styles.detailValue}>{product.location}</span>
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
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ProductDetailsModal;