//src/features/feed/components/PostComposer.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFeedStore } from '../store/feedStore';
import { PostComposerModal } from './PostComposerModal';
import styles from './PostComposer.module.css';

export const PostComposer = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { addPost } = useFeedStore();

    const handleSubmit = ({ headline, description, details, labels = [] }) => {
        const trimmedHeadline = headline.trim();
        if (!trimmedHeadline) return;

        const contentParts = [description.trim(),
        details.trim()].filter(Boolean);

        const content = contentParts.length > 0 ? contentParts.join('\n\n')
            : trimmedHeadline;
        const sanitizedLabels = labels
            .map((label) => String(label).trim())
            .filter(Boolean);
        const tags = sanitizedLabels.length > 0 ? sanitizedLabels : ['Community'];
        const lowerTags = tags.map((tag) => tag.toLowerCase());
        const isEventPost = lowerTags.some((tag) => tag === 'event');
        const isEmergencyPost = lowerTags.some((tag) => tag === 'emergency');

        addPost({
            title: trimmedHeadline,
            content,
            tags,
            type: isEventPost ? 'event' : isEmergencyPost ? 'emergency' : 'community',
            priority: isEmergencyPost ? 'high' : 'low',
        });

        setIsExpanded(false);
    };

    return (
        <motion.div
            className={styles.container}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
        >
            <div className={styles.avatar}>
                <span className={styles.avatarText}>Y</span>
            </div>

            <div className={styles.inputWrapper}>
                <p className={styles.composerPrompt}>Share a quick neighborhood
                    update</p>

                <AnimatePresence mode="wait">
                    {!isExpanded ? (
                        <motion.button
                            key="collapsed"
                            className={styles.collapsedInput}
                            onClick={() => setIsExpanded(true)}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <span className={styles.placeholder}>
                                What's happening nearby? Share update, ask for help, ...
                            </span>
                        </motion.button>
                    ) : (
                        <PostComposerModal
                            onClose={() => setIsExpanded(false)}
                            onSubmit={handleSubmit}
                        />
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};
