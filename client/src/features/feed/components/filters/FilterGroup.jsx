import React from "react";
import styles from "./FilterGroup.module.css";

export const FilterGroup = ({ title, options, selectedValues, onToggle }) => {
  return (
    <section className={styles.group} aria-label={title}>
      <h4 className={styles.groupTitle}>{title}</h4>
      <div className={styles.optionList}>
        {options.map((option) => {
          const isActive = selectedValues.includes(option.id);

          return (
            <button
              key={option.id}
              type="button"
              className={`${styles.optionButton} ${isActive ? styles.optionButtonActive : ""}`}
              aria-pressed={isActive}
              onClick={() => onToggle(option.id)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </section>
  );
};
