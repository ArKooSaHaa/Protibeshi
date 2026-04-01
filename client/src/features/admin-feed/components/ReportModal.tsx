import { AnimatePresence, motion } from 'framer-motion';
import { Flag, ShieldCheck, Trash2, XCircle } from 'lucide-react';
import type { AdminFeedPost } from '../types/adminFeed.types';

interface ReportModalProps {
  post: AdminFeedPost | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (postId: string) => void;
  onIgnore: (postId: string) => void;
  onMarkSafe: (postId: string) => void;
}

const formatReportTime = (isoDate: string): string => {
  return new Date(isoDate).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const ReportModal = ({
  post,
  isOpen,
  onClose,
  onDelete,
  onIgnore,
  onMarkSafe,
}: ReportModalProps) => {
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
            aria-label="Report details"
          >
            <header className="afd-modal-header">
              <div>
                <p className="afd-modal-kicker">Reported Post</p>
                <h3 className="afd-modal-title">Review report details</h3>
                <p className="afd-modal-meta">
                  {post.report_count} reports on {post.id}
                </p>
              </div>
              <button type="button" className="afd-modal-close" onClick={onClose} aria-label="Close report modal">
                <XCircle size={18} />
              </button>
            </header>

            <div className="afd-report-body">
              {post.reports.length === 0 ? (
                <p className="afd-modal-empty">No report details are attached to this post.</p>
              ) : (
                <ul className="afd-report-list">
                  {post.reports.map((report) => (
                    <li key={report.id} className="afd-report-item">
                      <div className="afd-report-head">
                        <span className="afd-report-reason">
                          <Flag size={13} /> {report.reason}
                        </span>
                        <span className="afd-report-time">{formatReportTime(report.created_at)}</span>
                      </div>
                      <p className="afd-report-details">{report.details}</p>
                      <p className="afd-report-author">Reported by {report.reported_by}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <footer className="afd-modal-actions">
              <motion.button
                type="button"
                className="afd-btn afd-btn-danger afd-ripple-btn"
                whileTap={{ scale: 0.97 }}
                onClick={() => onDelete(post.id)}
              >
                <Trash2 size={15} /> Delete Post
              </motion.button>

              <motion.button
                type="button"
                className="afd-btn afd-btn-neutral afd-ripple-btn"
                whileTap={{ scale: 0.97 }}
                onClick={() => onIgnore(post.id)}
              >
                Ignore Reports
              </motion.button>

              <motion.button
                type="button"
                className="afd-btn afd-btn-primary afd-ripple-btn"
                whileTap={{ scale: 0.97 }}
                onClick={() => onMarkSafe(post.id)}
              >
                <ShieldCheck size={15} /> Mark as Safe
              </motion.button>
            </footer>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
