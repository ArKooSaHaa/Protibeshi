import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, MapPin, UserRound, X } from 'lucide-react';
import type { AdminFeedPost } from '../types/adminFeed.types';

interface FullPostModalProps {
  post: AdminFeedPost | null;
  isOpen: boolean;
  onClose: () => void;
}

const formatPostDate = (isoDate: string): string => {
  return new Date(isoDate).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const FullPostModal = ({ post, isOpen, onClose }: FullPostModalProps) => {
  const postTitle = post?.title?.trim() || (post ? `Post #${post.id}` : 'Post');
  const postSummary = post?.short_description?.trim() || '';

  return (
    <AnimatePresence>
      {isOpen && post ? (
        <motion.div
          className="afd-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.section
            className="afd-modal-card"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Full post content"
          >
            <header className="afd-modal-header">
              <div>
                <p className="afd-modal-kicker">Full Post View</p>
                <h3 className="afd-modal-title">{postTitle}</h3>
                <p className="afd-modal-meta">Complete resident submission for moderation.</p>
              </div>
              <button type="button" className="afd-modal-close" onClick={onClose} aria-label="Close post view">
                <X size={18} />
              </button>
            </header>

            <div className="afd-full-post-meta">
              <p>
                <UserRound size={14} /> {post.user.name}
              </p>
              <p>
                <MapPin size={14} /> {post.location}
              </p>
              <p>
                <CalendarDays size={14} /> {formatPostDate(post.created_at)}
              </p>
            </div>

            {postSummary ? <p className="afd-full-post-summary">{postSummary}</p> : null}

            <article className="afd-full-post-content">{post.content}</article>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
