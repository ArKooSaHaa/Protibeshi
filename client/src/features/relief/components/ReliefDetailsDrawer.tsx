// src/features/relief/components/ReliefDetailsDrawer.tsx 
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Clock, Flag, MapPin, Users, X } from
  'lucide-react';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import type { ReliefRequest } from '../types/relief.types';
import {
  formatDistance, formatRelativeTime, statusConfig,
  urgencyConfig
} from '../utils/relief.utils';
import styles from './ReliefDetailsDrawer.module.css';

interface ReliefDetailsDrawerProps {
  request: ReliefRequest | null;
  onClose: () => void;
}

const toInitials = (name: string) => {
  const words = name
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean);

  if (words.length === 0) {
    return 'YO';
  }

  const first = words[0]?.[0] || '';
  const second = words[1]?.[0] || words[0]?.[1] || '';
  return `${first}${second}`.toUpperCase();
};

const resolveCurrentUserName = () => {
  if (typeof window === 'undefined') {
    return 'You';
  }

  const keys = ['user', 'auth_user', 'authUser', 'currentUser', 'profile'];
  for (const key of keys) {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      continue;
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== 'object') {
        continue;
      }

      const source = parsed as Record<string, unknown>;
      const directName = typeof source.name === 'string' ? source.name.trim() : '';
      const directUsername = typeof source.username === 'string' ? source.username.trim() : '';
      const nestedUser = source.user && typeof source.user === 'object'
        ? (source.user as Record<string, unknown>)
        : null;
      const nestedName = nestedUser && typeof nestedUser.name === 'string'
        ? nestedUser.name.trim()
        : '';

      if (directName) return directName;
      if (nestedName) return nestedName;
      if (directUsername) return directUsername;
    } catch {
      continue;
    }
  }

  return 'You';
};

export const ReliefDetailsDrawer = ({ request, onClose }:
  ReliefDetailsDrawerProps) => {
  const [localComments, setLocalComments] = useState(request?.comments ?? []);
  const [commentDraft, setCommentDraft] = useState('');
  const currentUserName = useMemo(() => resolveCurrentUserName(), []);

  useEffect(() => {
    if (!request) {
      setLocalComments([]);
      setCommentDraft('');
      return;
    }

    setLocalComments(request.comments ?? []);
    setCommentDraft('');
  }, [request]);

  const handleCommentSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const message = commentDraft.trim();
    if (!message) {
      return;
    }

    setLocalComments((prev) => ([
      ...prev,
      {
        id: `local-${Date.now()}`,
        author: currentUserName,
        avatarInitials: toInitials(currentUserName),
        message,
        createdAt: new Date().toISOString(),
      },
    ]));
    setCommentDraft('');
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
                  Comments ({localComments.length})
                </span>
                <div className={styles.comments}>
                  {localComments.length === 0 ? (
                    <p className={styles.noComments}>No comments
                      yet.</p>
                  ) : (
                    localComments.map((c) => (
                      <div key={c.id} className={styles.commentItem}>
                        <div
                          className={styles.commentAvatar}>{c.avatarInitials}</div>
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
                <form className={styles.commentComposer} onSubmit={handleCommentSubmit}>
                  <input
                    className={styles.commentInput}
                    type="text"
                    placeholder="Write a comment..."
                    value={commentDraft}
                    onChange={(event) => setCommentDraft(event.target.value)}
                  />
                  <button
                    className={styles.commentPostButton}
                    type="submit"
                    disabled={!commentDraft.trim()}
                  >
                    Post
                  </button>
                </form>
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

            {/* Footer */}
            <div className={styles.footer}>
              <button className={styles.btnReport} type="button">
                <Flag size={13} />
                Report
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}; 