import { FormEvent, useMemo, useRef, useState } from 'react';
import { Bookmark, Flag, Heart, Loader2, MapPin, MessageCircle, Send, ShieldAlert, Smile } from 'lucide-react';
import { FeedPost, resolvePostImageUrl } from '@/api/feedApi';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import styles from './PostCard.module.css';

type PostCardProps = {
  post: FeedPost & { liked?: boolean; saved?: boolean };
  currentUserId?: number | null;
  currentUserName?: string | null;
  currentUserAvatarUrl?: string | null;
  likePending?: boolean;
  savePending?: boolean;
  votePending?: boolean;
  onLike: (postId: number) => Promise<void>;
  onOpenComments: (postId: number) => Promise<void>;
  onSubmitComment: (postId: number, comment: string) => Promise<void>;
  onSave: (postId: number) => Promise<void>;
  onVote: (postId: number, vote: 'yes' | 'no') => Promise<void>;
  onReport: (postId: number, reason: string) => Promise<void>;
  highlighted?: boolean;
};

const formatTime = (rawDate: string) => {
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) {
    return 'Just now';
  }

  return date.toLocaleString();
};

const resolveUserImageUrl = (rawPath: string | null | undefined) => {
  return resolveMediaUrl(rawPath);
};

const getStringAtPath = (source: Record<string, unknown>, path: string) => {
  const segments = path.split('.');
  let current: unknown = source;

  for (const segment of segments) {
    if (!current || typeof current !== 'object') {
      return null;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return typeof current === 'string' && current.trim() ? current.trim() : null;
};

const getValueAtPath = (source: Record<string, unknown>, path: string) => {
  const segments = path.split('.');
  let current: unknown = source;

  for (const segment of segments) {
    if (!current || typeof current !== 'object') {
      return null;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return current ?? null;
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
    'profile_picture',
    'profile_picture_url',
    'profilePictureUrl',
    'photo',
    'profile_photo',
    'profile_photo_url',
    'profilePhoto',
    'profilePicture',
    'profile_picture',
    'image',
    'image_url',
    'user.profile_picture',
    'user.profile_picture_url',
    'profile.avatar',
    'profile.avatar_url',
    'profile.profile_picture_url',
    'profile.photo',
  ];

  for (const field of possibleFields) {
    const value = getStringAtPath(user, field);
    if (value) {
      return resolveUserImageUrl(value);
    }
  }

  return null;
};

const getLocalUser = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const keys = ['user', 'auth_user', 'authUser', 'currentUser', 'profile'];
  for (const key of keys) {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      continue;
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, unknown>;
      }
    } catch {
      continue;
    }
  }

  return null;
};

const getLocalUserProfilePhotoForPost = (post: FeedPost) => {
  const localUser = getLocalUser();
  if (!localUser) {
    return null;
  }

  const localName = getStringAtPath(localUser, 'name') || getStringAtPath(localUser, 'user.name');
  const localIdRaw = getValueAtPath(localUser, 'id') ?? getValueAtPath(localUser, 'user.id');
  const localId = typeof localIdRaw === 'number' ? localIdRaw : typeof localIdRaw === 'string' ? Number(localIdRaw) : null;

  const postUserName = post.user?.name || null;
  const postUserId = typeof post.user?.id === 'number' ? post.user.id : null;

  const sameUserById = localId !== null && postUserId !== null && localId === postUserId;
  const sameUserByName = !!localName && !!postUserName && localName.trim() === postUserName.trim();

  if (!sameUserById && !sameUserByName) {
    return null;
  }

  const possibleFields = [
    'avatar',
    'avatar_url',
    'avatarUrl',
    'profile_picture_url',
    'profilePictureUrl',
    'photo',
    'profile_photo',
    'profile_photo_url',
    'profilePicture',
    'profile.avatar',
    'profile.avatar_url',
    'profile.profile_picture_url',
    'profile.photo',
    'user.avatar',
    'user.avatar_url',
    'user.profile_picture_url',
    'user.photo',
  ];

  for (const field of possibleFields) {
    const value = getStringAtPath(localUser, field);
    if (value) {
      return resolveUserImageUrl(value);
    }
  }

  return null;
};

const resolveInitial = (name: string | null | undefined) => {
  const trimmed = typeof name === 'string' ? name.trim() : '';
  const source = trimmed || 'U';
  return source.slice(0, 1).toUpperCase();
};

export const PostCard = ({
  post,
  currentUserId = null,
  currentUserName = null,
  currentUserAvatarUrl = null,
  likePending,
  savePending,
  votePending,
  onLike,
  onOpenComments,
  onSubmitComment,
  onSave,
  onVote,
  onReport,
  highlighted = false,
}: PostCardProps) => {
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reportFeedback, setReportFeedback] = useState<string | null>(null);
  const [inlineComment, setInlineComment] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [commentAvatarFailed, setCommentAvatarFailed] = useState(false);
  const [commentFeedback, setCommentFeedback] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [profileImageFailed, setProfileImageFailed] = useState(false);
  const commentInputRef = useRef<HTMLInputElement | null>(null);

  const imageUrl = useMemo(() => resolvePostImageUrl(post.image), [post.image]);
  const profilePhoto = useMemo(() => {
    const postPhoto = getUserProfilePhoto(post);
    if (postPhoto) {
      return postPhoto;
    }

    const postUserName = post.user?.name?.trim() || null;
    const postUserId = typeof post.user?.id === 'number' ? post.user.id : null;
    const matchesCurrentUserById = currentUserId !== null && postUserId !== null && currentUserId === postUserId;
    const matchesCurrentUserByName =
      !!currentUserName && !!postUserName && currentUserName.trim() === postUserName;

    if (currentUserAvatarUrl && (matchesCurrentUserById || matchesCurrentUserByName)) {
      return resolveUserImageUrl(currentUserAvatarUrl) || currentUserAvatarUrl;
    }

    return getLocalUserProfilePhotoForPost(post);
  }, [post, currentUserAvatarUrl, currentUserId, currentUserName]);
  const isEmergency = (post.post_type || '').toLowerCase() === 'emergency';
  const isVerified = String(post.moderation_status || '').toLowerCase() === 'verified';
  const isEvent = String(post.label || post.post_type || '').trim().toLowerCase() === 'event';
  const shortDescription = (post.short_description || '').trim();
  const fallbackSummary = (post.content || '').trim();
  const summaryText = shortDescription || fallbackSummary;
  const detailText = (post.content || '').trim();
  const hasDetailText = !!detailText && detailText !== summaryText;
  const hasExpandableContent = hasDetailText || !!imageUrl;
  const yesVotes = post.yes_votes_count ?? 0;
  const noVotes = post.no_votes_count ?? 0;
  const currentVote = post.current_user_vote ?? null;
  const eventVoteOpen = post.event_vote_open !== false;
  const eventVoteClosed = isEvent && !eventVoteOpen;
  const eventVoteExpiryLabel = post.event_vote_expires_at ? formatTime(post.event_vote_expires_at) : null;

  const commenterPhoto = useMemo(() => {
    if (!currentUserAvatarUrl) {
      return null;
    }

    return resolveUserImageUrl(currentUserAvatarUrl) || currentUserAvatarUrl;
  }, [currentUserAvatarUrl]);

  const commenterInitial = useMemo(() => resolveInitial(currentUserName), [currentUserName]);

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
    <article className={`${styles.card} ${isEmergency ? styles.emergencyCard : ''} ${highlighted ? styles.highlight : ''}`}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
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

          {isVerified ? <span className={styles.verifiedBadge}>Verified</span> : null}
        </div>
      </header>

      <div className={styles.body}>
        <h3 className={styles.title}>{post.title}</h3>
        <p className={styles.shortDescription}>{summaryText}</p>

        {isEvent ? (
          <div className={styles.pollSection}>
            <div className={styles.pollHeader}>
              <span className={styles.pollLabel}>Event poll</span>
              <span className={styles.pollCounts}>{yesVotes + noVotes} votes</span>
            </div>

            {eventVoteClosed ? (
              <div className={styles.pollClosedNotice}>
                Voting closed after 2 days{eventVoteExpiryLabel ? ` • Closed ${eventVoteExpiryLabel}` : ''}
              </div>
            ) : null}

            <div className={styles.pollActions}>
              <button
                type="button"
                className={`${styles.pollButton} ${currentVote === 'yes' ? styles.pollButtonActiveYes : ''}`}
                onClick={() => void onVote(post.id, 'yes')}
                disabled={votePending || eventVoteClosed}
              >
                <span>Yes</span>
                <span>{yesVotes}</span>
              </button>
              <button
                type="button"
                className={`${styles.pollButton} ${currentVote === 'no' ? styles.pollButtonActiveNo : ''}`}
                onClick={() => void onVote(post.id, 'no')}
                disabled={votePending || eventVoteClosed}
              >
                <span>No</span>
                <span>{noVotes}</span>
              </button>
            </div>
          </div>
        ) : null}

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

      {isEvent ? (
        <footer className={styles.eventFooter}>
          <div className={styles.eventFooterActions}>
            <button type="button" className={styles.actionButton} onClick={() => setShowReport(true)}>
              <Flag size={15} />
              Report
            </button>
          </div>

          {reportFeedback ? <p className={styles.feedback}>{reportFeedback}</p> : null}
        </footer>
      ) : (
        <footer className={styles.footer}>
          <div className={styles.stats}>
            <span>{post.likes_count} likes</span>
            <span>{post.comments_count} comments</span>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={`${styles.actionButton} ${post.liked ? styles.likeActive : ''}`}
              onClick={() => onLike(post.id)}
              disabled={likePending}
            >
              {likePending ? (
                <Loader2 className={styles.spin} size={15} />
              ) : (
                <Heart
                  size={15}
                  className={post.liked ? styles.likeIconActive : undefined}
                  fill={post.liked ? 'currentColor' : 'none'}
                />
              )}
              Like
            </button>

            <button
              type="button"
              className={styles.actionButton}
              onClick={() => {
                commentInputRef.current?.focus();
                void onOpenComments(post.id);
              }}
            >
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
            <div className={styles.commentAvatar}>
              {commenterPhoto && !commentAvatarFailed ? (
                <img
                  src={commenterPhoto}
                  alt={currentUserName || 'You'}
                  className={styles.commentAvatarImage}
                  onError={() => setCommentAvatarFailed(true)}
                />
              ) : (
                commenterInitial
              )}
            </div>
            <input
              ref={commentInputRef}
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
      )}

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
