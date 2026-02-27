//src/features/feed/components/NeighborhoodMood.jsx
import React from 'react';
import { motion } from 'framer-motion';
import styles from './NeighborhoodMood.module.css';

export const NeighborhoodMood = () => {
    return (
        <motion.div
            className={styles.container}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
        >
            <div className={styles.emoji}>👋</div>
            <h3 className={styles.title}>Neighborhood Mood</h3>
            <p className={styles.description}>Normal activity level</p>
        </motion.div>
    );
};