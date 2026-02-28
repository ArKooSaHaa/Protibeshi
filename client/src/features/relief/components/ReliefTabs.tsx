// src/features/relief/components/ReliefTabs.tsx 
import { SlidersHorizontal } from 'lucide-react';
import type { ReliefTabView } from '../types/relief.types';
import styles from './ReliefTabs.module.css';

interface ReliefTabsProps {
  activeTab: ReliefTabView;
  requestCount: number;
  offerCount: number;
  activeFilterCount: number;
  onTabChange: (tab: ReliefTabView) => void;
  onFilterOpen: () => void;
}

export const ReliefTabs = ({
  activeTab,
  requestCount,
  offerCount,
  activeFilterCount,
  onTabChange,
  onFilterOpen,
}: ReliefTabsProps) => {
  return (
    <div className={styles.tabsRow}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${styles.requests} ${activeTab ===
            'requests' ? styles.active : ''}`}
          onClick={() => onTabChange('requests')}
          type="button"
        >
          Requests
          <span className={styles.count}>{requestCount}</span>
        </button>
        <button
          className={`${styles.tab} ${styles.offers} ${activeTab ===
            'offers' ? styles.active : ''}`}
          onClick={() => onTabChange('offers')}
          type="button"
        >
          Offers
          <span className={styles.count}>{offerCount}</span>
        </button>
      </div>

      <button
        className={`${styles.filterBtn} ${activeFilterCount > 0 ?
          styles.active : ''}`}
        onClick={onFilterOpen}
        type="button"
      >
        <SlidersHorizontal size={14} />
        Filter
        {activeFilterCount > 0 && (
          <span className={styles.badge}>{activeFilterCount}</span>
        )}
      </button>
    </div>
  );
};