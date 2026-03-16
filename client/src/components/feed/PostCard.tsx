import { FormEvent, useMemo, useState } from 'react';
import { Bookmark, Flag, Heart, Loader2, MapPin, MessageCircle, ShieldAlert } from 'lucide-react';
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
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reportFeedback, setReportFeedback] = useState<string | null>(null);

  const imageUrl = useMemo(() => resolvePostImageUrl(post.image), [post.image]);
  const isEmergency = (post.post_type || '').toLowerCase() === 'emergency';

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
        <p className={styles.description}>{post.short_description || post.content}</p>
        {imageUrl ? (
          <div className={styles.imageWrap}>
            <img src={imageUrl} alt={post.title} className={styles.image} />
          </div>
        ) : null}
      </div>

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

          <button type="button" className={styles.actionButton} onClick={() => setShowReport(true)}>
            <Flag size={15} />
            Report
          </button>
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