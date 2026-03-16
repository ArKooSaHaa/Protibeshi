import { FormEvent, useMemo, useState } from 'react';
import { Bookmark, Flag, Heart, Loader2, MapPin, MessageCircle, Send, ShieldAlert, Smile } from 'lucide-react';
import { FeedPost, resolvePostImageUrl } from '@/api/feedApi';
import styles from './PostCard.module.css';

type PostCardProps = {
  post: FeedPost & { liked?: boolean; saved?: boolean };
  likePending?: boolean;
  savePending?: boolean;
  onLike: (postId: number) => Promise<void>;
  onOpenComments: (postId: number) => Promise<void>;
  onSubmitComment: (postId: number, comment: string) => Promise<void>;
  onSave: (postId: number) => Promise<void>;
  onReport: (postId: number, reason: string) => Promise<void>;
};

const formatTime = (rawDate: string) => {
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) {
    return 'Just now';
  }

  return date.toLocaleString();
};

const DEFAULT_API_BASE = 'http://127.0.0.1:8000';

const resolveUserImageUrl = (rawPath: string | null | undefined) => {
  if (!rawPath) {
    return null;
  }

  if (rawPath.startsWith('http://') || rawPath.startsWith('https://')) {
    return rawPath;
  }

  const baseUrl = import.meta.env.VITE_API_URL || DEFAULT_API_BASE;

  if (rawPath.startsWith('/')) {
    return `${baseUrl}${rawPath}`;
  }

  if (rawPath.startsWith('storage/')) {
    return `${baseUrl}/${rawPath}`;
  }

  return `${baseUrl}/storage/${rawPath}`;
};

const getUserProfilePhoto = (post: FeedPost) => {
  const user = post.user as (Record<string, unknown> & { name?: string }) | null;
  if (!user) {
    return null;
  }

  const possibleFields = [
    'avatar',
    'avatar_url',
    'avatarUrl',
    'photo',
    'profile_photo',
    'profile_photo_url',
    'profilePhoto',
    'profilePicture',
    'profile_picture',
    'image',
    'image_url',
  ];

  for (const field of possibleFields) {
    const value = user[field];
    if (typeof value === 'string' && value.trim()) {
      return resolveUserImageUrl(value.trim());
    }
  }

  return null;
};

export const PostCard = ({
  post,
  likePending,
  savePending,
  onLike,
  onOpenComments,
  onSubmitComment,
  onSave,
  onReport,
}: PostCardProps) => {
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reportFeedback, setReportFeedback] = useState<string | null>(null);
  const [inlineComment, setInlineComment] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [commentFeedback, setCommentFeedback] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [profileImageFailed, setProfileImageFailed] = useState(false);

  const imageUrl = useMemo(() => resolvePostImageUrl(post.image), [post.image]);
  const profilePhoto = useMemo(() => getUserProfilePhoto(post), [post]);
  const isEmergency = (post.post_type || '').toLowerCase() === 'emergency';
  const shortDescription = (post.short_description || '').trim();
  const fallbackSummary = (post.content || '').trim();
  const summaryText = shortDescription || fallbackSummary;
  const detailText = (post.content || '').trim();
  const hasDetailText = !!detailText && detailText !== summaryText;
  const hasExpandableContent = hasDetailText || !!imageUrl;

  const handleReportSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setReporting(true);
    setReportFeedback(null);
    try {
      await onReport(post.id, reportReason.trim());
      setReportFeedback('Report submitted successfully.');
      setReportReason('');
      setShowReport(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to report post';
      setReportFeedback(message);
    } finally {
      setReporting(false);
    }
  };

  const handleInlineCommentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = inlineComment.trim();
    if (!trimmed) {
      return;
    }

    setCommenting(true);
    setCommentFeedback(null);

    try {
      await onSubmitComment(post.id, trimmed);
      setInlineComment('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add comment';
      setCommentFeedback(message);
    } finally {
      setCommenting(false);
    }
  };

  return (
    <article className={`${styles.card} ${isEmergency ? styles.emergencyCard : ''}`}>
      <header className={styles.header}>
        <div className={styles.userSection}>
          <div className={styles.avatar}>
            {profilePhoto && !profileImageFailed ? (
              <img
                src={profilePhoto}
                alt={post.user?.name || 'User profile'}
                className={styles.profileImage}
                onError={() => setProfileImageFailed(true)}
              />
            ) : (
              (post.user?.name || 'N').charAt(0).toUpperCase()
            )}
          </div>
          <div className={styles.userMeta}>
            <div className={styles.nameRow}>
              <span className={styles.userName}>{post.user?.name || 'Neighbor'}</span>
              {isEmergency ? (
                <span className={styles.emergencyBadge}>
                  <ShieldAlert size={12} /> Emergency
                </span>
              ) : null}
              {post.label ? <span className={styles.labelBadge}>{post.label}</span> : null}
            </div>
            <div className={styles.subMeta}>
              <span>{formatTime(post.created_at)}</span>
              {post.location ? (
                <>
                  <span>•</span>
                  <span className={styles.locationText}>
                    <MapPin size={12} /> {post.location}
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <div className={styles.body}>
        <h3 className={styles.title}>{post.title}</h3>
        <p className={styles.shortDescription}>{summaryText}</p>

        {hasExpandableContent ? (
          <button
            type="button"
            className={styles.viewMoreButton}
            onClick={() => setShowDetails((previous) => !previous)}
          >
            {showDetails ? 'View less' : 'View more'}
          </button>
        ) : null}

        {showDetails ? (
          <div className={styles.detailsSection}>
            {hasDetailText ? <p className={styles.detailText}>{detailText}</p> : null}
            {imageUrl ? (
              <div className={styles.imageWrap}>
                <img src={imageUrl} alt={post.title} className={styles.image} />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {!hasExpandableContent && imageUrl ? (
        <div className={styles.imageWrap}>
          <img src={imageUrl} alt={post.title} className={styles.image} />
        </div>
      ) : null}

      <footer className={styles.footer}>
        <div className={styles.stats}>
          <span>{post.likes_count} likes</span>
          <span>{post.comments_count} comments</span>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.actionButton} ${post.liked ? styles.actionActive : ''}`}
            onClick={() => onLike(post.id)}
            disabled={likePending}
          >
            {likePending ? <Loader2 className={styles.spin} size={15} /> : <Heart size={15} />}
            Like
          </button>

          <button type="button" className={styles.actionButton} onClick={() => onOpenComments(post.id)}>
            <MessageCircle size={15} />
            Comment
          </button>

          <button
            type="button"
            className={`${styles.actionButton} ${post.saved ? styles.actionActive : ''}`}
            onClick={() => onSave(post.id)}
            disabled={savePending}
          >
            {savePending ? <Loader2 className={styles.spin} size={15} /> : <Bookmark size={15} />}
            Save
          </button>

          <button
            type="button"
            className={styles.actionButton}
            onClick={() => setShowReport(true)}
          >
            <Flag size={15} />
            Report
          </button>
        </div>

        <form className={styles.commentComposer} onSubmit={handleInlineCommentSubmit}>
          <div className={styles.commentAvatar}>Y</div>
          <input
            className={styles.commentInput}
            type="text"
            placeholder="Write your comment..."
            value={inlineComment}
            onChange={(event) => setInlineComment(event.target.value)}
            disabled={commenting}
          />
          <button type="button" className={styles.commentIconBtn} aria-label="emoji picker" disabled>
            <Smile size={15} />
          </button>
          <button
            type="submit"
            className={styles.commentSendBtn}
            aria-label="send comment"
            disabled={commenting || !inlineComment.trim()}
          >
            {commenting ? <Loader2 className={styles.spin} size={14} /> : <Send size={14} />}
          </button>
        </form>

        {reportFeedback ? <p className={styles.feedback}>{reportFeedback}</p> : null}
        {commentFeedback ? <p className={styles.feedback}>{commentFeedback}</p> : null}
      </footer>

      {showReport ? (
        <div className={styles.reportOverlay} onClick={() => setShowReport(false)}>
          <div className={styles.reportModal} onClick={(event) => event.stopPropagation()}>
            <h4 className={styles.reportTitle}>Report post</h4>
            <form onSubmit={handleReportSubmit} className={styles.reportForm}>
              <textarea
                className={styles.reportInput}
                placeholder="Reason"
                value={reportReason}
                onChange={(event) => setReportReason(event.target.value)}
                rows={4}
              />
              <div className={styles.reportActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowReport(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn} disabled={reporting}>
                  {reporting ? 'Submitting...' : 'Submit report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </article>
  );
};
