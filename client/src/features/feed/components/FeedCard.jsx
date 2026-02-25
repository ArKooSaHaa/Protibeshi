import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Clock, 
  ThumbsUp, 
  MessageCircle, 
  MoreHorizontal,
  X,
  CheckCircle,
  Award,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { useFeedStore } from '../store/feedStore';
import styles from './FeedCard.module.css';

export const FeedCard = ({ post, index }) => {
  const { likePost } = useFeedStore();
  const [isLiked, setIsLiked] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [comments, setComments] = useState(
    post.commentsList || post.commentsData || []
  );

  const isEmergency = post.type === 'emergency';
  const isCommunity = post.type === 'community';

  const handleLike = () => {
    if (!isLiked) {
      likePost(post.id);
      setIsLiked(true);
    }
  };

  const handleAddComment = (event) => {
    event.preventDefault();
    if (!commentInput.trim()) return;
    const newComment = {
      id: Date.now(),
      author: 'You',
      text: commentInput.trim(),
    };
    setComments((prev) => [...prev, newComment]);
    setCommentInput('');
  };

  const handleReportSubmit = (event) => {
    event.preventDefault();
    if (!reportReason) return;
    setShowReport(false);
    setReportReason('');
    setReportDetails('');
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  return (
    <motion.article
      className={`${styles.card} ${isEmergency ? styles.cardEmergency : ''}`}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      layout
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.author}>
          {post.author.isOfficial ? (
            <div className={styles.officialAvatar}>
              <span className={styles.officialAvatarText}>
                {post.author.name.charAt(0)}
              </span>
            </div>
          ) : (
            <div className={styles.avatar}>
              <span className={styles.avatarText}>
                {post.author.name.charAt(0)}
              </span>
            </div>
          )}

          <div className={styles.authorInfo}>
            <div className={styles.authorNameRow}>
              <span className={styles.authorName}>{post.author.name}</span>
              {post.author.isOfficial && (
                <span className={styles.officialBadge}>
                  <CheckCircle size={12} />
                  Official
                </span>
              )}
              {post.author.badge && (
                <span className={styles.badge}>
                  <Award size={12} />
                  {post.author.badge}
                </span>
              )}
            </div>
            {post.author.block && (
              <span className={styles.block}>{post.author.block}</span>
            )}
          </div>
        </div>

        <div className={styles.meta}>
          <span className={styles.metaItem}>
            <MapPin size={14} />
            {post.distance} away
          </span>
          <span className={styles.metaDot}>•</span>
          <span className={styles.metaItem}>
            <Clock size={14} />
            {post.timeAgo}
          </span>
          {post.reactions?.map((reaction, i) => (
            <span key={i} className={styles.reaction}>
              <Sparkles size={12} />
              {reaction}
            </span>
          ))}
        </div>

        <span className={styles.postType}>Neighbor post</span>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <h3 className={`${styles.title} ${isEmergency ? styles.titleEmergency : ''}`}>
          {isEmergency && <AlertTriangle size={20} className={styles.emergencyIcon} />}
          {post.title}
        </h3>

        <p className={styles.text}>
          {showFullContent ? post.content : post.content.slice(0, 150)}
          {post.content.length > 150 && !showFullContent && '...'}
        </p>

        {post.content.length > 150 && (
          <button
            className={styles.readMore}
            onClick={() => setShowFullContent(!showFullContent)}
          >
            {showFullContent ? 'Show less' : 'Read more'}
          </button>
        )}

        {/* Tags */}
        <div className={styles.tags}>
          {post.tags.map((tag, i) => (
            <span
              key={i}
              className={`${styles.tag} ${isEmergency ? styles.tagEmergency : ''}`}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        {isEmergency ? (
          <motion.button
            className={styles.viewDetailsButton}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            View details
          </motion.button>
        ) : (
          <div className={styles.actionButtons}>
            <motion.button
              className={`${styles.actionButton} ${isLiked ? styles.actionButtonActive : ''}`}
              onClick={handleLike}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ThumbsUp size={18} />
              <span>{post.likes}</span>
            </motion.button>

            <motion.button
              className={styles.actionButton}
              onClick={() => setShowComments((prev) => !prev)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <MessageCircle size={18} />
              <span>{comments.length || post.comments}</span>
            </motion.button>

            <div className={styles.menuWrapper}>
              <motion.button
                className={styles.actionButton}
                onClick={() => setShowMenu((prev) => !prev)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-expanded={showMenu}
                aria-haspopup="menu"
              >
                <MoreHorizontal size={18} />
              </motion.button>
              {showMenu && (
                <div className={styles.menu} role="menu">
                  <button
                    className={styles.menuItem}
                    type="button"
                    onClick={() => {
                      setIsSaved((prev) => !prev);
                      setShowMenu(false);
                    }}
                  >
                    {isSaved ? 'Saved' : 'Save post'}
                  </button>
                  <button
                    className={`${styles.menuItem} ${styles.menuItemDanger}`}
                    type="button"
                    onClick={() => {
                      setShowReport(true);
                      setShowMenu(false);
                    }}
                  >
                    Report
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showComments && !isEmergency && (
        <div className={styles.commentsSection}>
          <div className={styles.commentList}>
            {comments.length === 0 ? (
              <p className={styles.emptyComments}>Be the first to comment.</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className={styles.commentItem}>
                  <div className={styles.commentAvatar}>
                    {comment.author.charAt(0)}
                  </div>
                  <div className={styles.commentBody}>
                    <span className={styles.commentAuthor}>{comment.author}</span>
                    <span className={styles.commentText}>{comment.text}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          <form className={styles.commentForm} onSubmit={handleAddComment}>
            <input
              className={styles.commentInput}
              placeholder="Write a comment..."
              value={commentInput}
              onChange={(event) => setCommentInput(event.target.value)}
            />
            <button
              type="submit"
              className={styles.commentSubmit}
              disabled={!commentInput.trim()}
            >
              Post
            </button>
          </form>
        </div>
      )}

      {/* Footer Note */}
      {isEmergency && (
        <p className={styles.footerNote}>
          Why am I seeing this? (Based on proximity & category affinity)
        </p>
      )}

      {showReport && (
        <div className={styles.reportOverlay} onClick={() => setShowReport(false)}>
          <div className={styles.reportModal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.reportHeader}>
              <h4 className={styles.reportTitle}>Report post</h4>
              <button
                type="button"
                className={styles.reportClose}
                onClick={() => setShowReport(false)}
              >
                <X size={16} />
              </button>
            </div>
            <form className={styles.reportForm} onSubmit={handleReportSubmit}>
              <label className={styles.reportField}>
                <span className={styles.reportLabel}>Reason</span>
                <select
                  className={styles.reportSelect}
                  value={reportReason}
                  onChange={(event) => setReportReason(event.target.value)}
                  required
                >
                  <option value="">Select a reason</option>
                  <option value="spam">Spam or misleading</option>
                  <option value="harassment">Harassment or hate</option>
                  <option value="violence">Violence or dangerous behavior</option>
                  <option value="false">False information</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label className={styles.reportField}>
                <span className={styles.reportLabel}>Details</span>
                <textarea
                  className={styles.reportTextarea}
                  placeholder="Tell us what happened"
                  value={reportDetails}
                  onChange={(event) => setReportDetails(event.target.value)}
                  rows={3}
                />
              </label>
              <div className={styles.reportActions}>
                <button
                  type="button"
                  className={styles.reportCancel}
                  onClick={() => setShowReport(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.reportSubmit}
                  disabled={!reportReason}
                >
                  Submit report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.article>
  );
};
