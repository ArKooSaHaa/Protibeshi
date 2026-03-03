import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { FilterGroup } from "./FilterGroup";
import styles from "./AdvancedFilterPanel.module.css";

const panelMotion = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 16, scale: 0.98 },
  transition: { duration: 0.28, ease: "easeInOut" },
};

const mobileSheetMotion = {
  initial: { y: "100%", opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: "100%", opacity: 0 },
  transition: { duration: 0.28, ease: "easeInOut" },
};

export const AdvancedFilterPanel = ({
  id,
  isOpen,
  isMobile,
  options,
  state,
  actions,
  onClose,
}) => {
  const [presetName, setPresetName] = useState("");

  const panelBody = (
    <div className={styles.panelBody}>
      <div className={styles.panelHeaderRow}>
        <h3 className={styles.panelTitle}>Filter Posts</h3>
        <div className={styles.panelHeaderActions}>
          <button
            type="button"
            className={styles.clearButton}
            onClick={actions.clearAllFilters}
          >
            Clear All Filters
          </button>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close advanced filters"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className={styles.grid}>
        <section className={styles.group}>
          <h4 className={styles.groupTitle}>Distance</h4>
          <div className={styles.sliderWrap}>
            <div className={styles.distanceLabel}>{state.distance}m</div>
            <input
              type="range"
              min="50"
              max="1000"
              step="50"
              value={state.distance}
              onChange={(event) => actions.setDistance(Number(event.target.value))}
              className={styles.slider}
              aria-label="Distance filter"
            />
            <div className={styles.sliderMeta}>
              <span>50m</span>
              <span>1km</span>
            </div>
          </div>
        </section>

        <section className={styles.group}>
          <h4 className={styles.groupTitle}>Time Range</h4>
          <div className={styles.timeOptions}>
            {options.timeRanges.map((range) => {
              const isSelected = state.timeRange === range.id;
              return (
                <button
                  key={range.id}
                  type="button"
                  className={`${styles.pillButton} ${isSelected ? styles.pillButtonActive : ""}`}
                  onClick={() => actions.setTimeRange(range.id)}
                  aria-pressed={isSelected}
                >
                  {range.label}
                </button>
              );
            })}
          </div>

          {state.timeRange === "custom" && (
            <div className={styles.customDateRow}>
              <label className={styles.dateField}>
                <span>Start</span>
                <input
                  type="date"
                  value={state.customDateRange.start}
                  onChange={(event) =>
                    actions.setCustomDateRange({
                      ...state.customDateRange,
                      start: event.target.value,
                    })
                  }
                />
              </label>

              <label className={styles.dateField}>
                <span>End</span>
                <input
                  type="date"
                  value={state.customDateRange.end}
                  onChange={(event) =>
                    actions.setCustomDateRange({
                      ...state.customDateRange,
                      end: event.target.value,
                    })
                  }
                />
              </label>
            </div>
          )}
        </section>

        <FilterGroup
          title="Categories"
          options={state.categories}
          selectedValues={state.selectedCategories}
          onToggle={actions.toggleCategory}
        />

        <FilterGroup
          title="Priority Level"
          options={options.priorityLevels}
          selectedValues={state.priorityLevels}
          onToggle={(value) => actions.toggleFilterValue("priorityLevels", value)}
        />

        <FilterGroup
          title="Post Type"
          options={options.postTypes}
          selectedValues={state.postTypes}
          onToggle={(value) => actions.toggleFilterValue("postTypes", value)}
        />

        <FilterGroup
          title="Verification Status"
          options={options.verificationStatuses}
          selectedValues={state.verificationStatuses}
          onToggle={(value) => actions.toggleFilterValue("verificationStatuses", value)}
        />

        <FilterGroup
          title="Engagement Level"
          options={options.engagementLevels}
          selectedValues={state.engagementLevels}
          onToggle={(value) => actions.toggleFilterValue("engagementLevels", value)}
        />

        <FilterGroup
          title="Media Type"
          options={options.mediaTypes}
          selectedValues={state.mediaTypes}
          onToggle={(value) => actions.toggleFilterValue("mediaTypes", value)}
        />

        <section className={styles.group}>
          <h4 className={styles.groupTitle}>Location Granularity</h4>
          <div className={styles.timeOptions}>
            {options.locationGranularity.map((location) => {
              const isSelected = state.locationGranularity === location.id;
              return (
                <button
                  key={location.id}
                  type="button"
                  className={`${styles.pillButton} ${isSelected ? styles.pillButtonActive : ""}`}
                  onClick={() => actions.setLocationGranularity(location.id)}
                  aria-pressed={isSelected}
                >
                  {location.label}
                </button>
              );
            })}
          </div>

          {state.locationGranularity === "custom-radius" && (
            <div className={styles.sliderWrap}>
              <div className={styles.distanceLabel}>{state.customRadius}m</div>
              <input
                type="range"
                min="100"
                max="2000"
                step="50"
                value={state.customRadius}
                onChange={(event) => actions.setCustomRadius(Number(event.target.value))}
                className={styles.slider}
                aria-label="Custom radius"
              />
            </div>
          )}
        </section>

        <section className={styles.group}>
          <h4 className={styles.groupTitle}>Sort Posts By</h4>
          <select
            className={styles.selectInput}
            value={state.sortBy}
            onChange={(event) => actions.setSortBy(event.target.value)}
            aria-label="Sort posts"
          >
            {options.sortOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </section>
      </div>

      <section className={styles.savedFilters}>
        <h4 className={styles.groupTitle}>Saved Filters</h4>
        <div className={styles.presetCreateRow}>
          <input
            value={presetName}
            onChange={(event) => setPresetName(event.target.value)}
            className={styles.presetInput}
            placeholder="Name this preset"
            aria-label="Preset name"
          />
          <button
            type="button"
            className={styles.saveButton}
            onClick={() => {
              actions.saveCurrentFiltersAsPreset(presetName);
              setPresetName("");
            }}
          >
            Save
          </button>
        </div>

        <div className={styles.presetList}>
          {state.savedFilterPresets.map((preset) => (
            <div key={preset.id} className={styles.presetItem}>
              <button
                type="button"
                className={styles.presetApply}
                onClick={() => actions.applySavedPreset(preset.id)}
              >
                {preset.name}
              </button>
              <button
                type="button"
                className={styles.presetRemove}
                onClick={() => actions.removeSavedPreset(preset.id)}
                aria-label={`Remove preset ${preset.name}`}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <div className={styles.mobileLayer} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`}>
            <motion.div className={styles.mobileSheet} {...mobileSheetMotion}>
              <div className={styles.mobileHeader}>
                <h3 id={`${id}-title`} className={styles.mobileTitle}>Advanced Filters</h3>
                <button type="button" className={styles.mobileClose} onClick={onClose}>
                  <X size={18} />
                </button>
              </div>

              <div className={styles.mobileContent}>{panelBody}</div>

              <div className={styles.mobileFooter}>
                <button type="button" className={styles.mobileApply} onClick={actions.applyMobileFilters}>
                  Apply Filters ({state.activeFilterCount})
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.desktopLayer}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.section
            id={id}
            className={styles.desktopModal}
            {...panelMotion}
            onClick={(event) => event.stopPropagation()}
          >
            {panelBody}
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
