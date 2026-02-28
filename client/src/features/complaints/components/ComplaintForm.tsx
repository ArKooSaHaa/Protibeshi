// src/features/complaints/components/ComplaintForm.tsx 
import { motion } from 'framer-motion';
import { AlertCircle, Paperclip } from 'lucide-react';
import {
  complaintCategories,
  complaintPriorities,
  complaintVisibilityOptions,
  ComplaintFormErrors,
  ComplaintFormState,
} from '../types/complaint.types';
import { complaintFormLimits } from '../mock/complaintsData';
import styles from './ComplaintForm.module.css';
interface ComplaintFormProps {
  formState: ComplaintFormState;
  formErrors: ComplaintFormErrors;
  onChange: <K extends keyof ComplaintFormState>(key: K, value:
    ComplaintFormState[K]) => void;
  onSubmit: () => void;
}

export const ComplaintForm = ({ formState, formErrors, onChange,
  onSubmit }: ComplaintFormProps) => {
  return (
    <motion.div
      className={styles.formCard} initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={styles.headerRow}>
        <h2>Submit a Complaint</h2>
        <span className={styles.requiredNote}>* Required</span>

      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>
          Title *
          <input
            type="text"
            value={formState.title}
            onChange={(event) => onChange('title', event.target.value)}
            className={styles.input}
            placeholder="Short, specific summary" maxLength={complaintFormLimits.title}
          />
        </label>
        <div className={styles.helperRow}>
          {formErrors.title ? <span
            className={styles.error}>{formErrors.title}</span> : <span />}
          <span className={styles.count}>
            {formState.title.length}/{complaintFormLimits.title}
          </span>
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>
          Category *
          <select
            className={styles.select}
            value={formState.category}
            onChange={(event) =>
              onChange('category', event.target.value as
                ComplaintFormState['category'])
            }
          >
            <option value="">Select category</option>
            {complaintCategories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        {formErrors.category && <span
          className={styles.error}>{formErrors.category}</span>}
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>
          Description *
          <textarea
            value={formState.description}
            onChange={(event) => onChange('description',
              event.target.value)}
            className={styles.textarea}
            placeholder="Provide clear details and any timeline context"
            maxLength={complaintFormLimits.description}
          />
        </label>
        <div className={styles.helperRow}>
          {formErrors.description ? <span
            className={styles.error}>{formErrors.description}</span> : <span />}
          <span className={styles.count}>

            {formState.description.length}/{complaintFormLimits.description}
          </span>
        </div>
      </div>

      <div className={styles.gridRow}>
        <label className={styles.label}>
          Location *
          <input
            type="text"
            value={formState.location}
            onChange={(event) => onChange('location',
              event.target.value)}
            className={styles.input}
            placeholder="Neighborhood, street, landmark"
          />
        </label>
        <label className={styles.label}>
          Priority *
          <select
            className={styles.select}
            value={formState.priority}

            onChange={(event) =>
              onChange('priority', event.target.value as
                ComplaintFormState['priority'])
            }
          >
            <option value="">Select priority</option>
            {complaintPriorities.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>
      {(formErrors.location || formErrors.priority) && (
        <div className={styles.errorRow}>
          {formErrors.location && <span
            className={styles.error}>{formErrors.location}</span>}          {formErrors.priority && <span
              className={styles.error}>{formErrors.priority}</span>}
        </div>
      )}

      <div className={styles.gridRow}>
        <label className={styles.label}>
          Visibility
          <select
            className={styles.select}
            value={formState.visibility}
            onChange={(event) =>
              onChange('visibility', event.target.value as
                ComplaintFormState['visibility'])
            }
          >
            {complaintVisibilityOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.label}>

          Upload photo (optional)
          <div className={styles.uploadRow}>
            <label className={styles.uploadButton}>
              <Paperclip size={14} />
              <input
                type="file"
                accept="image/*"
                onChange={(event) => onChange('photo',
                  event.target.files?.[0] || null)}
              />
              Attach file
            </label>
            <span className={styles.fileName}>
              {formState.photo ? formState.photo.name : 'No file selected'}
            </span>
          </div>
        </label>
      </div>

      <div className={styles.noticeBox}>
        <AlertCircle size={16} />
        <p>
          All complaints are reviewed by community moderators. Please
          provide accurate information to help          with resolution.
        </p>
      </div>

      <motion.button
        type="button"
        className={styles.submitButton} whileHover={{ y: -1 }}
        whileTap={{ y: 1 }}
        onClick={onSubmit}
      >
        Submit Complaint
      </motion.button>
    </motion.div>
  );
}; 
