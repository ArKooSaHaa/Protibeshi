import { motion } from 'framer-motion';
import { Inbox } from 'lucide-react';

export const FeedEmptyState = () => {
  return (
    <motion.div
      className="afd-empty-state"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Inbox size={20} />
      <h3>No posts found for this filter</h3>
      <p>Try resetting your search, date, or location filters to review more posts.</p>
    </motion.div>
  );
};
