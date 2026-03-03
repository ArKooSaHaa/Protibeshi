//src/features/feed/components/FeedSummaryHeader.jsx
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, AlertTriangle, X } from 'lucide-react';
import styles from './FeedSummaryHeader.module.css';

export const FeedSummaryHeader = ({ compact = true }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    const summaryCard = (
        <motion.div
            className={styles.container}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
        >
            <div className={styles.left}>
                <div className={styles.icon}>
                    <BarChart3 size={18} />
                </div>
                <span className={styles.title}>Feed Summary</span>
                <span className={styles.stats}>5 posts today • 2 alerts • 1 event</span>
            </div>

            <motion.div
                className={styles.badge}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <AlertTriangle size={14} />
                <span>2 high priority</span>
            </motion.div>
        </motion.div>
    );

    if (!compact) {
        return summaryCard;
    }

    return (
        <>
            <button
                type="button"
                className={styles.compactButton}
                onClick={() => setIsOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={isOpen}
                aria-controls="feed-summary-modal"
            >
                <BarChart3 size={16} />
                <span>Feed Summary</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className={styles.overlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.section
                            id="feed-summary-modal"
                            className={styles.modal}
                            role="dialog"
                            aria-modal="true"
                            aria-label="Feed summary details"
                            initial={{ opacity: 0, y: 16, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 16, scale: 0.98 }}
                            transition={{ duration: 0.22, ease: 'easeInOut' }}
                            onClick={(event) => event.stopPropagation()}
                        >
                            <button
                                type="button"
                                className={styles.closeButton}
                                onClick={() => setIsOpen(false)}
                                aria-label="Close feed summary"
                            >
                                <X size={16} />
                            </button>
                            {summaryCard}
                        </motion.section>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};