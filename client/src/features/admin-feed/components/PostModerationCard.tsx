import { AnimatePresence, motion } from 'framer-motion';
import {
  BadgeCheck,
  Flag,
  MapPin,
  MessageSquare,
  Pin,
  PinOff,
  ShieldCheck,
  Trash2,
  UserRound,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { AdminFeedPost, AdminPostStatus } from '../types/adminFeed.types';

interface PostModerationCardProps {
  post: AdminFeedPost;
  isSelected: boolean;
  onToggleSelect: (postId: string) => void;
  onVerifyPost: (postId: string) => void;
  onDeletePost: (postId: string) => void;
  onOpenReports: (postId: string) => void;
  onOpenFullPost: (postId: string) => void;
  onTogglePinned: (postId: string) => void;
}

const statusLabels: Record<AdminPostStatus, string> = {
  pending: 'Pending',
  verified: 'Verified',
  reported: 'Reported',
};

const statusClasses: Record<AdminPostStatus, string> = {
  pending: 'afd-status-pending',
  verified: 'afd-status-verified',
  reported: 'afd-status-reported',
};

const formatPostTime = (isoDate: string): string => {
  return new Date(isoDate).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return 'U';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }

  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
};

export const PostModerationCard = ({
  post,
  isSelected,
  onToggleSelect,
  onVerifyPost,
  onDeletePost,
  onOpenReports,
  onOpenFullPost,
  onTogglePinned,
}: PostModerationCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const cardTitle = useMemo(() => {
    const trimmedTitle = post.title?.trim();
    if (trimmedTitle) {
      return trimmedTitle;
    }

    const fallbackTitle = post.content.trim().slice(0, 80);
    return fallbackTitle || 'Untitled post';
  }, [post.content, post.title]);

  const collapsedText = useMemo(() => {
    const trimmedShortDescription = post.short_description?.trim();
    if (trimmedShortDescription) {
      return trimmedShortDescription;
    }

    if (post.content.length <= 200) {
      return post.content;
    }

    return `${post.content.slice(0, 200)}...`;
  }, [post.content, post.short_description]);

  const hasLongContent = useMemo(() => {
    return post.content.trim().length > 0 && collapsedText !== post.content;
  }, [collapsedText, post.content]);

  const previewText = useMemo(() => {
    const hasContent = post.content.trim().length > 0;

    if (isExpanded) {
      return hasContent ? post.content : collapsedText;
    }

    if (hasLongContent) {
      return collapsedText;
    }

    return hasContent ? post.content : collapsedText;
  }, [collapsedText, hasLongContent, isExpanded, post.content]);

  return (
    <motion.article
      className={`afd-post-card ${post.status === 'reported' ? 'afd-post-card-reported' : ''}`}
      whileHover={{ y: -4, scale: 1.006 }}
      transition={{ duration: 0.2 }}
      layout
    >
      <header className="afd-card-header">
        <div className="afd-card-header-left">
          <label className="afd-card-select">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(post.id)}
              aria-label={`Select post ${post.id}`}
            />
            <span>Select</span>
          </label>

          <button
            type="button"
            className={`afd-pin-btn ${post.pinned ? 'afd-pin-active' : ''}`}
            onClick={() => onTogglePinned(post.id)}
            aria-label={post.pinned ? 'Unpin post' : 'Pin post'}
          >
            {post.pinned ? <PinOff size={14} /> : <Pin size={14} />}
            <span>{post.pinned ? 'Pinned' : 'Pin'}</span>
          </button>
        </div>

        <div className="afd-card-header-right">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={post.status}
              className={`afd-status-badge ${statusClasses[post.status]}`}
              initial={{ opacity: 0, scale: 0.92, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -2 }}
              transition={{ duration: 0.18 }}
            >
              {statusLabels[post.status]}
            </motion.span>
          </AnimatePresence>
          {post.report_count > 0 ? (
            <span className="afd-report-chip">
              <Flag size={12} /> {post.report_count}
            </span>
          ) : null}
        </div>
      </header>

      <div className="afd-author-row">
        <div className="afd-avatar-wrap">
          {post.user.avatar_url ? (
            <img src={post.user.avatar_url} alt={post.user.name} className="afd-avatar-image" />
          ) : (
            <span className="afd-avatar-fallback">{getInitials(post.user.name)}</span>
          )}
        </div>

        <div className="afd-author-meta">
          <p className="afd-author-name">
            <UserRound size={14} /> {post.user.name}
          </p>
          <p className="afd-author-subline">
            <span>
              <MapPin size={13} /> {post.location}
            </span>
            <span>{formatPostTime(post.created_at)}</span>
          </p>
        </div>
      </div>

      <div className="afd-content-wrap">
        <h3 className="afd-post-title">{cardTitle}</h3>
        <p className="afd-content-text">{previewText}</p>
        {hasLongContent ? (
          <button
            type="button"
            className="afd-inline-link"
            onClick={() => setIsExpanded((previous) => !previous)}
            aria-expanded={isExpanded}
          >
            {isExpanded ? 'Show less' : 'View more'}
          </button>
        ) : null}
      </div>

      <div className="afd-card-actions">
        <motion.button
          type="button"
          className="afd-action-btn afd-action-verify afd-ripple-btn"
          whileTap={{ scale: 0.97 }}
          onClick={() => onVerifyPost(post.id)}
          disabled={post.status === 'verified'}
        >
          <BadgeCheck size={14} /> {post.status === 'verified' ? 'Verified' : 'Verify Post'}
        </motion.button>

        <motion.button
          type="button"
          className="afd-action-btn afd-action-danger afd-ripple-btn"
          whileTap={{ scale: 0.97 }}
          onClick={() => onDeletePost(post.id)}
        >
          <Trash2 size={14} /> Delete Post
        </motion.button>

        <motion.button
          type="button"
          className="afd-action-btn afd-action-warning afd-ripple-btn"
          whileTap={{ scale: 0.97 }}
          onClick={() => onOpenReports(post.id)}
        >
          <MessageSquare size={14} /> View Reports
        </motion.button>

        <motion.button
          type="button"
          className="afd-action-btn afd-action-neutral afd-ripple-btn"
          whileTap={{ scale: 0.97 }}
          onClick={() => onOpenFullPost(post.id)}
        >
          <ShieldCheck size={14} /> View Full Post
        </motion.button>
      </div>
    </motion.article>
  );
};
