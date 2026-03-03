import React from "react";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import styles from "./FilterToggle.module.css";

export const FilterToggle = ({ isOpen, activeFilterCount, onToggle, compact = false }) => {
  return (
    <button
      type="button"
      className={`${styles.toggleButton} ${isOpen ? styles.toggleButtonActive : ""} ${compact ? styles.toggleButtonCompact : ""}`}
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-controls="advanced-feed-filters"
    >
      <span className={styles.leftContent}>
        <SlidersHorizontal size={16} aria-hidden="true" />
        <span className={styles.label}>{compact ? "Filters" : "Advanced Filters"}</span>
        {activeFilterCount > 0 && <span className={styles.count}>({activeFilterCount})</span>}
      </span>
      {!compact && (
        <ChevronDown
          size={18}
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}
          aria-hidden="true"
        />
      )}
    </button>
  );
};
