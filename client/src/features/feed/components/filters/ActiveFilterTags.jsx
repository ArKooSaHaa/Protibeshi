import React from "react";
import { X } from "lucide-react";
import styles from "./ActiveFilterTags.module.css";

export const ActiveFilterTags = ({ activeTags, onRemoveTag, onClearAll }) => {
  if (activeTags.length === 0) {
    return null;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.tags}>
        {activeTags.map((tag, index) => (
          <button
            key={`${tag.key}-${tag.value || tag.label}-${index}`}
            type="button"
            className={styles.tag}
            onClick={() => onRemoveTag(tag)}
            aria-label={`Remove filter ${tag.label}`}
          >
            <span>{tag.label}</span>
            <X size={14} aria-hidden="true" />
          </button>
        ))}
      </div>
      <button type="button" className={styles.clearAllButton} onClick={onClearAll}>
        Clear All Filters
      </button>
    </div>
  );
};
