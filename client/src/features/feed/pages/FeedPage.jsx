// src/features/feed/pages/FeedPage.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { FeedSidebarFilters } from '../components/FeedSidebarFilters';
import { PostComposer } from '../components/PostComposer';
import { FeedSummaryHeader } from '../components/FeedSummaryHeader';
import { FeedCard } from '../components/FeedCard';
import { UpcomingEventsPanel } from
    '../components/UpcomingEventsPanel';
import { NeighborhoodMood } from '../components/NeighborhoodMood';
import { useFeedStore } from '../store/feedStore';
import styles from './FeedPage.module.css';
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            duration: 0.5,
            staggerChildren: 0.1,
            delayChildren: 0.3,
        },
    },
};
const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94],
        },
    },
};
export const FeedPage = () => {
    const { filteredPosts } = useFeedStore();
    return (
        <motion.div
            className={styles.feedPage}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Left Column - Filters */}
            <motion.aside className={styles.leftColumn}
                variants={itemVariants}>
                <FeedSidebarFilters />
            </motion.aside>
            {/* Center Column - Feed */}
            <motion.main className={styles.centerColumn}
                variants={itemVariants}>
                <div className={styles.centerScroll}>
                    <PostComposer />
                    <FeedSummaryHeader />
                    <div className={styles.feedList}>
                        {filteredPosts.map((post, index) => (
                            <FeedCard key={post.id} post={post} index={index} />
                        ))}
                    </div>
                </div>
            </motion.main>
            {/* Right Column - Widgets */}
            <motion.aside className={styles.rightColumn}
                variants={itemVariants}>
                <NeighborhoodMood />
                <UpcomingEventsPanel />
            </motion.aside>
        </motion.div>
    );
};