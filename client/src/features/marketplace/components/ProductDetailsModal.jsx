/// src/features/marketplace/components/ProductDetailsModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { sendMessage as sendChatMessage, startConversation } from '@/api/chatApi';
import { ROUTES } from '@/config/routes.config';
import { reportListing } from '@/services/listingService';
import styles from './ProductDetailsModal.module.css';

const ProductDetailsModal = ({ isOpen, onClose, product }) => {
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isReportFormOpen, setIsReportFormOpen] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [isReporting, setIsReporting] = useState(false);
    const [reportFeedback, setReportFeedback] = useState(null);
    const messageInputRef = useRef(null);
    const navigate = useNavigate();

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

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        setIsReportFormOpen(false);
        setReportReason('');
        setIsReporting(false);
        setReportFeedback(null);
    }, [isOpen, product?.id]);

    if (!product) return null;

    const detailsText = product.details?.trim() || '';
    const additionalOptionsPrefix = 'Additional options:';
    const hasAdditionalOptions = detailsText.includes(additionalOptionsPrefix);

    const [mainDetails, additionalOptions] = hasAdditionalOptions
        ? detailsText.split(additionalOptionsPrefix)
        : [detailsText, ''];

    /* ================= Actions ================= */
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim() || !product?.sellerId || !product?.id) return;

        const buyerNote = message.trim();
        const productSummary = [
            `Product: ${product.title || 'N/A'}`,
            `Price: ${product.price || 'N/A'}`,
            `Category: ${product.category || 'N/A'}`,
            `Location: ${product.location || 'N/A'}`,
            `Details: ${mainDetails.trim() || 'No additional details provided'}`,
        ].join('\n');

        const composedMessage = `Hello, I am interested in this listing.\n\n${productSummary}\n\nBuyer note: ${buyerNote}`;

        setIsSending(true);
        try {
            const res = await startConversation(Number(product.sellerId), Number(product.id));
            const conversationId = res?.conversation?.id;

            if (!conversationId) {
                throw new Error('Conversation could not be created');
            }

            await sendChatMessage(Number(conversationId), composedMessage.slice(0, 4900));

            setMessage('');
            onClose();
            navigate(`${ROUTES.MESSAGES}?conversation=${conversationId}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to open conversation';
            window.alert(errorMessage);
        } finally {
            setIsSending(false);
        }
    };

    const handleSubmitReport = async (e) => {
        e.preventDefault();

        const listingId = product?.listingId || product?.id;
        if (!listingId) {
            setReportFeedback({
                type: 'error',
                text: 'Unable to report this listing right now.',
            });
            return;
        }

        setIsReporting(true);
        setReportFeedback(null);

        try {
            const response = await reportListing(listingId, reportReason);

            setReportFeedback({
                type: 'success',
                text: response?.message || 'Listing reported successfully.',
            });
            setReportReason('');
            setIsReportFormOpen(false);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to report listing';
            setReportFeedback({
                type: 'error',
                text: errorMessage,
            });
        } finally {
            setIsReporting(false);
        }
    };

    const handleCancelReport = () => {
        if (isReporting) {
            return;
        }

        setIsReportFormOpen(false);
        setReportReason('');
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
                                            {mainDetails.trim() || `${product.title} is available for purchase at ${product.price}.`}
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
                                    {hasAdditionalOptions && (
                                        <div className={styles.detailRow}>
                                            <span className={styles.detailLabel}>User notes</span>
                                            <span className={styles.detailValue}>{additionalOptions.trim()}</span>
                                        </div>
                                    )}

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
                                                disabled={!message.trim() || !product?.sellerId || isSending}
                                            >
                                                {isSending ? 'Opening chat...' : 'Send Message'}
                                            </button>
                                        </form>
                                    </div>

                                    <div className={styles.reportSection}>
                                        <h3 className={styles.reportTitle}>Report listing</h3>
                                        <p className={styles.reportHint}>
                                            Flag this post if it looks fraudulent, unsafe, or misleading.
                                        </p>

                                        {reportFeedback && (
                                            <p
                                                className={`${styles.reportFeedback} ${
                                                    reportFeedback.type === 'success'
                                                        ? styles.reportFeedbackSuccess
                                                        : styles.reportFeedbackError
                                                }`}
                                                role="status"
                                            >
                                                {reportFeedback.text}
                                            </p>
                                        )}

                                        {isReportFormOpen ? (
                                            <form className={styles.reportForm} onSubmit={handleSubmitReport}>
                                                <textarea
                                                    className={styles.reportInput}
                                                    value={reportReason}
                                                    onChange={(e) => setReportReason(e.target.value)}
                                                    placeholder="Share why this listing should be reviewed (optional)."
                                                    maxLength={500}
                                                />

                                                <div className={styles.reportActions}>
                                                    <button
                                                        type="button"
                                                        className={styles.reportCancelButton}
                                                        onClick={handleCancelReport}
                                                        disabled={isReporting}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className={styles.reportSubmitButton}
                                                        disabled={isReporting}
                                                    >
                                                        {isReporting ? 'Submitting...' : 'Submit report'}
                                                    </button>
                                                </div>
                                            </form>
                                        ) : (
                                            <button
                                                type="button"
                                                className={styles.reportToggleButton}
                                                onClick={() => {
                                                    setReportFeedback(null);
                                                    setIsReportFormOpen(true);
                                                }}
                                            >
                                                <Flag size={14} />
                                                Report this listing
                                            </button>
                                        )}
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