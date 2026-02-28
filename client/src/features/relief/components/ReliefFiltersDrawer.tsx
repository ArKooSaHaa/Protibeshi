
// src/features/relief/components/ReliefFiltersDrawer.tsx 
import { AnimatePresence, motion } from 'framer-motion';
import { SlidersHorizontal, X } from 'lucide-react';
import {
  reliefHelpTypes,
  reliefStatuses,
  reliefTimeRanges,
  reliefUrgencyLevels,
  type ReliefFilterState,
  type ReliefHelpType,
  type ReliefStatus,
  type ReliefTimeRange,
  type ReliefUrgency,
} from '../types/relief.types';
import styles from './ReliefFiltersDrawer.module.css';

interface ReliefFiltersDrawerProps {
  isOpen: boolean;
  filters: ReliefFilterState;
  onClose: () => void;
  onToggleHelpType: (t: ReliefHelpType) => void;
  onToggleUrgency: (u: ReliefUrgency) => void;
  onToggleStatus: (s: ReliefStatus) => void;
  onSetTimeRange: (r: ReliefTimeRange) => void;
  onSetDistance: (d: number) => void;
  onSetVerifiedOnly: (v: boolean) => void;
  onReset: () => void;
}

const urgencyColors: Record<ReliefUrgency, string> = {
  Normal: '',
  Important: styles.selectedAmber,
  Urgent: styles.selectedOrange,
  Critical: styles.selectedRed,
};

export const ReliefFiltersDrawer = ({
  isOpen,
  filters,
  onClose,
  onToggleHelpType,
  onToggleUrgency,
  onToggleStatus,
  onSetTimeRange,
  onSetDistance,
  onSetVerifiedOnly,
  onReset,
}: ReliefFiltersDrawerProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
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
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Header */}
            <div className={styles.header}>
              <span className={styles.headerTitle}>
                <SlidersHorizontal size={16} />
                Filter Relief Posts
              </span>
              <button className={styles.closeBtn} onClick={onClose}
                type="button">
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className={styles.body}>
              {/* Help Type */}
              <div className={styles.section}>
                <span className={styles.sectionLabel}>Type of
                  Help</span>
                <div className={styles.chips}>
                  {reliefHelpTypes.map((type) => (
                    <button
                      key={type}
                      className={`${styles.chip} 
${filters.helpTypes.includes(type) ? styles.selected : ''}`}
                      onClick={() => onToggleHelpType(type)}
                      type="button"
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Urgency */}
              <div className={styles.section}>
                <span className={styles.sectionLabel}>Urgency
                  Level</span>
                <div className={styles.chips}>
                  {reliefUrgencyLevels.map((u) => {
                    const isSelected = filters.urgencies.includes(u);
                    const colorClass = isSelected ? (urgencyColors[u] ||
                      styles.selected) : '';
                    return (
                      <button
                        key={u}
                        className={`${styles.chip} ${colorClass}`}
                        onClick={() => onToggleUrgency(u)}
                        type="button"
                      >
                        {u}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status */}
              <div className={styles.section}>
                <span className={styles.sectionLabel}>Status</span>
                <div className={styles.chips}>
                  {reliefStatuses.map((s) => (
                    <button
                      key={s}
                      className={`${styles.chip} 
${filters.statuses.includes(s) ? styles.selected : ''}`}
                      onClick={() => onToggleStatus(s)}
                      type="button"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Distance */}
              <div className={styles.section}>
                <span className={styles.sectionLabel}>Distance</span>
                <div className={styles.sliderRow}>
                  <div className={styles.sliderLabel}>
                    <span>Nearby</span>
                    <span className="font-semibold text-slate-700">
                      {filters.distance < 1000 ? `${filters.distance}m`
                        : `${(filters.distance / 1000).toFixed(1)}km`}
                    </span>
                    <span>1km</span>
                  </div>
                  <input
                    type="range"
                    className={styles.slider}
                    min={100}
                    max={1000}
                    step={50}
                    value={filters.distance}
                    onChange={(e) =>
                      onSetDistance(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Time Range */}
              <div className={styles.section}>
                <span className={styles.sectionLabel}>Time Posted</span>
                <div className={styles.chips}>
                  {reliefTimeRanges.map((r) => (
                    <button
                      key={r}
                      className={`${styles.chip} ${filters.timeRange ===
                        r ? styles.selected : ''}`}
                      onClick={() => onSetTimeRange(r)}
                      type="button"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Verified only */}
              <div className={styles.section}>
                <span className={styles.sectionLabel}>Trust &
                  Safety</span>
                <div
                  className={`${styles.toggle} ${filters.verifiedOnly ?
                    styles.active : ''}`}
                  onClick={() =>
                    onSetVerifiedOnly(!filters.verifiedOnly)}
                >
                  <div className={styles.toggleText}>
                    <span className={styles.toggleLabel}>Verified
                      neighbors only</span>
                    <span className={styles.toggleDesc}>Show only posts
                      from verified residents</span>
                  </div>
                  <div className={`${styles.toggleSwitch} 
${filters.verifiedOnly ? styles.on : ''}`}>
                    <div className={styles.toggleKnob} />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={styles.footer}>
              <button className={styles.btnReset} onClick={onReset}
                type="button">
                Reset
              </button>
              <button className={styles.btnApply} onClick={onClose}
                type="button">
                Apply Filters
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};