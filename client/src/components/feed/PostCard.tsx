import { FormEvent, useMemo, useState } from 'react';
import {
  Bookmark,
  Flag,
  Heart,
  Loader2,
  MessageSquare,
  MoreVertical,
  Paperclip,
  SendHorizontal,
  ShieldAlert,
  Smile,
} from 'lucide-react';
import { FeedPost, resolvePostImageUrl } from '@/api/feedApi';
import styles from './PostCard.module.css';

type PostCardProps = {
  post: FeedPost & { liked?: boolean; saved?: boolean };
  likePending?: boolean;
  savePending?: boolean;
  onLike: (postId: number) => Promise<void>;
  onOpenComments: (postId: number) => Promise<void>;
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

export const PostCard = ({
  post,
  likePending,
  savePending,
  onLike,
  onOpenComments,
  onSave,
  onReport,
}: PostCardProps) => {
  const [showReport, setShowReport] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reportFeedback, setReportFeedback] = useState<string | null>(null);

  const imageUrl = useMemo(() => resolvePostImageUrl(post.image), [post.image]);
  const isEmergency = (post.post_type || '').toLowerCase() === 'emergency';
  const previewText = post.content || post.short_description || '';

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

  return (
    <article className={`${styles.card} ${isEmergency ? styles.emergencyCard : ''}`}>
      <header className={styles.header}>
        <div className={styles.userSection}>
          <div className={styles.avatar}>{(post.user?.name || 'N').charAt(0).toUpperCase()}</div>
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
            <div className={styles.subMeta}>{formatTime(post.created_at)}</div>
          </div>
        </div>

        <div className={styles.moreWrap}>
          <button
            type="button"
            className={styles.moreButton}
            onClick={() => setShowMoreActions((previous) => !previous)}
            aria-label="More actions"
          >
            <MoreVertical size={16} />
          </button>
          {showMoreActions ? (
            <div className={styles.moreMenu}>
              <button
                type="button"
                className={styles.moreMenuItem}
                onClick={() => {
                  setShowReport(true);
                  setShowMoreActions(false);
                }}
              >
                <Flag size={14} /> Report post
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <div className={styles.body}>
        <h3 className={styles.title}>{post.title}</h3>
        {previewText ? <p className={styles.description}>{previewText}</p> : null}
        {imageUrl ? (
          <div className={styles.imageWrap}>
            <img src={imageUrl} alt={post.title} className={styles.image} />
          </div>
        ) : null}
      </div>

      <footer className={styles.footer}>
        <div className={styles.metricsRow}>
          <button
            type="button"
            className={`${styles.metricButton} ${post.liked ? styles.actionActive : ''}`}
            onClick={() => onLike(post.id)}
            disabled={likePending}
          >
            {likePending ? <Loader2 className={styles.spin} size={15} /> : <Heart size={15} />}
            {post.likes_count} Likes
          </button>

          <button type="button" className={styles.metricButton} onClick={() => onOpenComments(post.id)}>
            <MessageSquare size={15} />
            {post.comments_count} Comments
          </button>

          <span className={styles.metricText}>
            <SendHorizontal size={15} />
            {post.shares_count || 0} Share
          </span>

          <button
            type="button"
            className={`${styles.metricButton} ${post.saved ? styles.actionActive : ''}`}
            onClick={() => onSave(post.id)}
            disabled={savePending}
          >
            {savePending ? <Loader2 className={styles.spin} size={15} /> : <Bookmark size={15} />}
            {post.saved ? 'Saved' : 'Save'}
          </button>
        </div>

        <div className={styles.commentBar}>
          <div className={styles.commentAvatar}>{(post.user?.name || 'Y').charAt(0).toUpperCase()}</div>
          <button type="button" className={styles.commentInputFake} onClick={() => onOpenComments(post.id)}>
            Write your comment..
          </button>
          <div className={styles.commentTools}>
            <button type="button" className={styles.toolButton} onClick={() => onOpenComments(post.id)}>
              <Paperclip size={16} />
            </button>
            <button type="button" className={styles.toolButton} onClick={() => onOpenComments(post.id)}>
              <Smile size={16} />
            </button>
            <button type="button" className={styles.sendButton} onClick={() => onOpenComments(post.id)}>
              <SendHorizontal size={16} />
            </button>
          </div>
        </div>

        {reportFeedback ? <p className={styles.feedback}>{reportFeedback}</p> : null}
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