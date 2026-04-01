import { motion } from 'framer-motion';
import { Download, Filter, Search } from 'lucide-react';
import type { AdminDateFilter, AdminFilterTab } from '../types/adminFeed.types';

interface AdminFilterToolbarProps {
  searchQuery: string;
  activeTab: AdminFilterTab;
  dateFilter: AdminDateFilter;
  locationFilter: string;
  locationOptions: string[];
  filteredCount: number;
  allVisibleSelected: boolean;
  onSearchChange: (value: string) => void;
  onTabChange: (tab: AdminFilterTab) => void;
  onDateFilterChange: (value: AdminDateFilter) => void;
  onLocationFilterChange: (value: string) => void;
  onToggleSelectVisible: () => void;
  onExportReports: () => void;
}

const tabItems: Array<{ value: AdminFilterTab; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending Verification' },
  { value: 'verified', label: 'Verified' },
  { value: 'reported', label: 'Reported' },
];

const dateItems: Array<{ value: AdminDateFilter; label: string }> = [
  { value: 'all', label: 'All Dates' },
  { value: '24h', label: 'Last 24h' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
];

export const AdminFilterToolbar = ({
  searchQuery,
  activeTab,
  dateFilter,
  locationFilter,
  locationOptions,
  filteredCount,
  allVisibleSelected,
  onSearchChange,
  onTabChange,
  onDateFilterChange,
  onLocationFilterChange,
  onToggleSelectVisible,
  onExportReports,
}: AdminFilterToolbarProps) => {
  return (
    <section className="afd-toolbar" aria-label="Post filters">
      <div className="afd-search-wrap">
        <Search size={16} className="afd-search-icon" />
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          className="afd-search-input"
          placeholder="Search by post content, user, or location"
          aria-label="Search posts"
        />
      </div>

      <div className="afd-tabs-wrap" role="tablist" aria-label="Post status filters">
        {tabItems.map((tab) => {
          const isActive = activeTab === tab.value;

          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`afd-tab-button ${isActive ? 'afd-tab-active' : ''}`}
              onClick={() => onTabChange(tab.value)}
            >
              {isActive ? <motion.span className="afd-tab-indicator" layoutId="afd-tab-indicator" /> : null}
              <span className="afd-tab-label">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="afd-select-row">
        <label className="afd-select-group">
          <span>
            <Filter size={14} /> Date
          </span>
          <select
            value={dateFilter}
            className="afd-select"
            onChange={(event) => onDateFilterChange(event.target.value as AdminDateFilter)}
          >
            {dateItems.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="afd-select-group">
          <span>
            <Filter size={14} /> Location
          </span>
          <select
            value={locationFilter}
            className="afd-select"
            onChange={(event) => onLocationFilterChange(event.target.value)}
          >
            <option value="all">All Locations</option>
            {locationOptions.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </label>

        <motion.button
          type="button"
          className="afd-btn afd-btn-neutral afd-ripple-btn"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={onToggleSelectVisible}
        >
          {allVisibleSelected ? 'Clear Visible' : 'Select Visible'}
        </motion.button>

        <motion.button
          type="button"
          className="afd-btn afd-btn-primary afd-ripple-btn"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={onExportReports}
        >
          <Download size={14} /> Export Report
        </motion.button>
      </div>

      <p className="afd-filter-count">{filteredCount} posts match your current filters.</p>
    </section>
  );
};
