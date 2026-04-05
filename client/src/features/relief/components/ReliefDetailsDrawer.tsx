// src/features/relief/components/ReliefDetailsDrawer.tsx 
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Clock, Flag, MapPin, Users, X } from
  'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import type { ReliefRequest } from '../types/relief.types';
import {
  formatDistance, formatRelativeTime, statusConfig,
  urgencyConfig
} from '../utils/relief.utils';
import styles from './ReliefDetailsDrawer.module.css';

interface ReliefDetailsDrawerProps {
  request: ReliefRequest | null;
  currentUserId?: number | null;
  isSubmittingComment?: boolean;
  isSubmittingReport?: boolean;
  onSubmitComment?: (request: ReliefRequest, message: string) => Promise<boolean>;
  onReport?: (request: ReliefRequest, reason: string) => Promise<{ message: string }>;
  onClose: () => void;
}

export const ReliefDetailsDrawer = ({
  request,
  currentUserId = null,
  isSubmittingComment = false,
  isSubmittingReport = false,
  onSubmitComment,
  onReport,
  onClose,
}:
  ReliefDetailsDrawerProps) => {
  const [commentDraft, setCommentDraft] = useState('');
  const [isReportPanelOpen, setIsReportPanelOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportFeedback, setReportFeedback] = useState<{
    variant: 'success' | 'error';
    message: string;
  } | null>(null);

  const isOwnRequest =
    !!request
    && typeof request.userId === 'number'
    && typeof currentUserId === 'number'
    && request.userId === currentUserId;

  useEffect(() => {
    setCommentDraft('');
    setIsReportPanelOpen(false);
    setReportReason('');
    setReportFeedback(null);
  }, [request?.id]);

  const handleCommentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!request) {
      return;
    }

    const message = commentDraft.trim();
    if (!message) {
      return;
    }

    const isSuccess = await onSubmitComment?.(request, message);
    if (isSuccess !== false) {
      setCommentDraft('');
    }
  };

  const handleSubmitReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!request || !onReport) {
      return;
    }

    const trimmedReason = reportReason.trim();
    if (trimmedReason.length < 5) {
      setReportFeedback({
        variant: 'error',
        message: 'Please provide at least 5 characters for the report reason.',
      });
      return;
    }

    setReportFeedback(null);

    try {
      const response = await onReport(request, trimmedReason);

      setReportReason('');
      setIsReportPanelOpen(false);
      setReportFeedback({
        variant: 'success',
        message: response?.message || 'Report submitted successfully. Admin team will review it.',
      });
    } catch (error) {
      setReportFeedback({
        variant: 'error',
        message: error instanceof Error ? error.message : 'Failed to submit report.',
      });
    }
  };

  return (
    <AnimatePresence>
      {request && (
        <>
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={styles.drawer}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.headerTop}>
                <div className={styles.titleBlock}>
                  <div className={styles.badges}>
                    <span
                      className={styles.helpTypeBadge}>{request.helpType}</span>
                    <span className={`${styles.urgBadge} 
${styles[urgencyConfig[request.urgency].colorClass]}`}>
                      <span className={`${styles.dot} 
${styles[urgencyConfig[request.urgency].dotClass]}`} />
                      {urgencyConfig[request.urgency].label}
                    </span>
                  </div>
                  <h2
                    className={styles.drawerTitle}>{request.title}</h2>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'flex-start',
                  gap: 8, flexShrink: 0
                }}>
                  <span className={`${styles.statusBadge} 
${styles[statusConfig[request.status].colorClass]}`}>
                    {request.status}
                  </span>
                  <button className={styles.closeBtn} onClick={onClose}
                    type="button">
                    <X size={15} />
                  </button>
                </div>
              </div>

              <div className={styles.meta}>
                <span className={styles.metaItem}>
                  <MapPin size={11} />{formatDistance(request.distance)}
                </span>
                <span className={styles.metaItem}>
                  <Clock size={11}
                  />{formatRelativeTime(request.createdAt)}
                </span>
                <span className={styles.metaItem}>
                  <Users size={11} />{request.volunteerCount}
                  volunteer{request.volunteerCount !== 1 ? 's' : ''}
                </span>
                {request.verified && (
                  <span className={styles.verifiedBadge}>
                    <CheckCircle2 size={11} /> Verified
                  </span>
                )}
              </div>
            </div>

            {/* Body */}
            <div className={styles.body}>
              {/* Description */}
              <div className={styles.section}>
                <span className={styles.sectionLabel}>Description</span>
                <p
                  className={styles.description}>{request.description}</p>
              </div>

              {/* Timeline */}
              <div className={styles.section}>
                <span className={styles.sectionLabel}>Timeline</span>
                <div className={styles.timeline}>
                  {request.timeline.map((entry, idx) => (
                    <div key={idx} className={styles.timelineItem}>
                      <div className={styles.timelineDotCol}>
                        <div className={`${styles.timelineDot} 
${styles.completed}`} />
                        {idx < request.timeline.length - 1 && (
                          <div className={styles.timelineLine} />
                        )}
                      </div>
                      <div className={styles.timelineContent}>
                        <span
                          className={styles.timelineStage}>{entry.stage}</span>
                        <span className={styles.timelineDate}>
                          {new Date(entry.date).toLocaleString('en-GB',
                            {
                              day: 'numeric', month: 'short', hour:
                                '2-digit', minute: '2-digit',
                            })}
                        </span>
                        {entry.note && (
                          <span
                            className={styles.timelineNote}>{entry.note}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comments */}
              <div className={styles.section}>
                <span className={styles.sectionLabel}>
                  Comments ({request.comments.length})
                </span>
                <div className={styles.comments}>
                  {request.comments.length === 0 ? (
                    <p className={styles.noComments}>No comments
                      yet.</p>
                  ) : (
                    request.comments.map((c) => (
                      <div key={c.id} className={styles.commentItem}>
                        <div className={styles.commentAvatar}>
                          {c.avatarUrl ? (
                            <img
                              src={c.avatarUrl}
                              alt={`${c.author} profile`}
                              className={styles.commentAvatarImage}
                              loading="lazy"
                            />
                          ) : c.avatarInitials}
                        </div>
                        <div className={styles.commentBody}>
                          <div className={styles.commentMeta}>
                            <span
                              className={styles.commentAuthor}>{c.author}</span>
                            <span className={styles.commentTime}>
                              {formatRelativeTime(c.createdAt)}
                            </span>
                          </div>
                          <p
                            className={styles.commentText}>{c.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Resolution summary */}
              {request.resolutionSummary && (
                <div className={styles.section}>
                  <span
                    className={styles.sectionLabel}>Resolution</span>
                  <div
                    className={styles.resolutionBox}>{request.resolutionSummary}</div>
                </div>
              )}
            </div>

            <div className={styles.commentComposerDock}>
              <form className={styles.commentComposer} onSubmit={handleCommentSubmit}>
                <input
                  className={styles.commentInput}
                  type="text"
                  placeholder="Write a comment..."
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                  disabled={isSubmittingComment}
                />
                <button
                  className={styles.commentPostButton}
                  type="submit"
                  disabled={isSubmittingComment || !commentDraft.trim()}
                >
                  {isSubmittingComment ? 'Posting...' : 'Post'}
                </button>
              </form>
            </div>

            {!isOwnRequest && reportFeedback ? (
              <p
                className={`${styles.reportFeedback} ${reportFeedback.variant === 'success'
                  ? styles.reportSuccess
                  : styles.reportError}`}
              >
                {reportFeedback.message}
              </p>
            ) : null}

            {!isOwnRequest && isReportPanelOpen ? (
              <form className={styles.reportPanel} onSubmit={handleSubmitReport}>
                <label htmlFor={`relief-report-${request.id}`} className={styles.reportLabel}>
                  Report reason
                </label>
                <textarea
                  id={`relief-report-${request.id}`}
                  className={styles.reportTextarea}
                  rows={4}
                  value={reportReason}
                  onChange={(event) => setReportReason(event.target.value)}
                  placeholder="Describe why this relief request should be reviewed"
                  maxLength={500}
                  disabled={isSubmittingReport}
                />
                <p className={styles.reportHint}>Submitted reports are reviewed by the admin moderation team.</p>
                <div className={styles.reportActions}>
                  <button
                    type="button"
                    className={styles.reportCancelButton}
                    onClick={() => {
                      setIsReportPanelOpen(false);
                      setReportReason('');
                    }}
                    disabled={isSubmittingReport}
                  >
                    Cancel
                  </button>
                  <button type="submit" className={styles.reportSubmitButton} disabled={isSubmittingReport}>
                    {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            ) : null}

            {/* Footer */}
            <div className={styles.footer}>
              {!isOwnRequest ? (
                <button
                  className={styles.btnReport}
                  type="button"
                  onClick={() => {
                    setIsReportPanelOpen((previous) => !previous);
                    setReportFeedback(null);
                  }}
                  disabled={isSubmittingReport}
                >
                  <Flag size={13} />
                  {isReportPanelOpen ? 'Hide Report Form' : 'Report to Admin'}
                </button>
              ) : (
                <span className={styles.ownerNote}>You cannot report your own relief request.</span>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}; 