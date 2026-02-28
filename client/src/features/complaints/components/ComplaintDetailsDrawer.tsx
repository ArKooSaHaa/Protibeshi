// src/features/complaints/components/ComplaintDetailsDrawer.tsx
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, FileText, X } from "lucide-react";
import { ComplaintItem } from "../types/complaint.types";
import styles from "./ComplaintDetailsDrawer.module.css";

interface ComplaintDetailsDrawerProps {
  complaint: ComplaintItem | null;

  onClose: () => void;
}

export const ComplaintDetailsDrawer = ({
  complaint,
  onClose,
}: ComplaintDetailsDrawerProps) => {
  return (
    <AnimatePresence>
      {complaint && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.aside
            className={styles.drawer}
            initial={{ x: 420 }}
            animate={{ x: 0 }}
            exit={{ x: 420 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.header}>
              <div>
                <h3>{complaint.title}</h3>
                <p>{complaint.id}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className={styles.closeButton}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.statusRow}>
              <span
                className={`${styles.status} 
                ${styles[`status${complaint.status.replace(/\s/g, "")}`]}`}
              >
                {complaint.status}
              </span>
              <span className={styles.priority}>
                {complaint.priority}
                Priority
              </span>

              <span className={styles.metaItem}>{complaint.category}</span>
            </div>

            <div className={styles.section}>
              <h4>Complaint details</h4>
              <p>{complaint.description}</p>
              <div className={styles.metaGrid}>
                <div>
                  <span>Location</span>
                  <strong>{complaint.location}</strong>
                </div>
                <div>
                  <span>Reported by</span>
                  <strong>{complaint.reportedBy}</strong>
                </div>
                <div>
                  <span>Distance</span>
                  <strong>{complaint.distance}m</strong>
                </div>
                <div>
                  <span>Reported</span>
                  <strong>
                    {new Date(complaint.createdAt).toLocaleDateString()}
                  </strong>
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <h4>Timeline</h4>
              <div className={styles.timeline}>
                {complaint.updates.map((update, index) => (
                  <motion.div
                    key={update.stage}
                    className={styles.timelineItem}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.05 }}
                  >
                    <span className={styles.timelineDot} />
                    <div>
                      <strong>{update.stage}</strong>
                      <span>{update.date}</span>

                      {update.note && <p>{update.note}</p>}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {complaint.attachments && complaint.attachments.length > 0 && (
              <div className={styles.section}>
                <h4>Attachments</h4>
                <div className={styles.attachments}>
                  {complaint.attachments.map((item) => (
                    <span key={item}>
                      <FileText size={14} /> {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {complaint.resolutionSummary && (
              <div className={styles.section}>
                <h4>Resolution summary</h4>
                <div className={styles.resolutionBox}>
                  {complaint.resolutionSummary}
                </div>
              </div>
            )}

            <div className={styles.footer}>
              <span className={styles.footerMeta}>
                <Calendar size={14} /> Last updated{" "}
                {new Date(complaint.createdAt).toLocaleDateString()}
              </span>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
