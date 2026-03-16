import { FormEvent, useState } from 'react';
import { Loader2, MessageCircle, Send, X } from 'lucide-react';
import { FeedComment, FeedPost } from '@/api/feedApi';
import styles from './PostComments.module.css';

type PostCommentsProps = {
  open: boolean;
  loading: boolean;
  submitting: boolean;
  post: FeedPost | null;
  error: string | null;
  onClose: () => void;
  onSubmitComment: (postId: number, comment: string) => Promise<void>;
};

const formatTime = (rawDate: string) => {
  const date = new Date(rawDate);

  if (Number.isNaN(date.getTime())) {
    return 'Just now';
  }

  return date.toLocaleString();
};

const CommentItem = ({ comment }: { comment: FeedComment }) => {
  const authorName = comment.user?.name || 'Neighbor';

  return (
    <div className={styles.commentItem}>
      <div className={styles.avatar}>{authorName.charAt(0).toUpperCase()}</div>
      <div className={styles.commentBody}>
        <div className={styles.metaRow}>
          <span className={styles.author}>{authorName}</span>
          <span className={styles.dot}>•</span>
          <span className={styles.time}>{formatTime(comment.created_at)}</span>
        </div>
        <p className={styles.commentText}>{comment.comment}</p>
      </div>
    </div>
  );
};

export const PostComments = ({
  open,
  loading,
  submitting,
  post,
  error,
  onClose,
  onSubmitComment,
}: PostCommentsProps) => {
  const [commentText, setCommentText] = useState('');

  if (!open || !post) {
    return null;
  }

  const comments = post.comments || [];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = commentText.trim();
    if (!trimmed) {
      return;
    }

    await onSubmitComment(post.id, trimmed);
    setCommentText('');
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Post comments"
      >
        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>Comments</h3>
            <p className={styles.subtitle}>{post.title}</p>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <Loader2 className={styles.spin} size={16} />
            Loading comments...
          </div>
        ) : (
          <div className={styles.list}>
            {comments.length === 0 ? (
              <div className={styles.emptyState}>
                <MessageCircle size={18} />
                No comments yet. Start the conversation.
              </div>
            ) : (
              comments.map((comment) => <CommentItem key={comment.id} comment={comment} />)
            )}
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            className={styles.input}
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            placeholder="Add comment"
            disabled={submitting}
          />
          <button type="submit" className={styles.submitButton} disabled={submitting || !commentText.trim()}>
            {submitting ? <Loader2 size={14} className={styles.spin} /> : <Send size={14} />}
            Post
          </button>
        </form>

        {error ? <p className={styles.errorText}>{error}</p> : null}
      </div>
    </div>
  );
};