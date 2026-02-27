//src/features/feed/components/FeedSummaryHeader.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, AlertTriangle } from 'lucide-react';
import styles from './FeedSummaryHeader.module.css';

export const FeedSummaryHeader = () => {
    return (
        <motion.div
            className={styles.container}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
        >
            <div className={styles.left}>
                <div className={styles.icon}>
                    <BarChart3 size={18} />
                </div>
                <span className={styles.title}>Feed Summary</span>
                <span className={styles.stats}>5 posts today • 2 alerts • 1
                    event</span>
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
};