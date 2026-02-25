import React from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  Zap, 
  Wrench, 
  Users, 
  Calendar, 
  ShoppingBag,
  ChevronDown,
  SlidersHorizontal
} from 'lucide-react';
import { useFeedStore } from '../store/feedStore';
import { mockTimeFilters, mockSortOptions } from '../mock/feedData';
import styles from './FeedSidebarFilters.module.css';

const categoryIcons = {
  emergency: AlertTriangle,
  utilities: Zap,
  services: Wrench,
  social: Users,
  events: Calendar,
  marketplace: ShoppingBag,
};

const categoryColors = {
  emergency: '#ef4444',
  utilities: '#eab308',
  services: '#3b82f6',
  social: '#a855f7',
  events: '#22c55e',
  marketplace: '#f97316',
};

export const FeedSidebarFilters = () => {
  const {
    distance,
    setDistance,
    timeFilter,
    setTimeFilter,
    sortBy,
    setSortBy,
    selectedCategories,
    toggleCategory,
    resetFilters,
    categories,
  } = useFeedStore();

  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className={styles.header}>
        <SlidersHorizontal size={18} />
        <h3 className={styles.title}>Advanced Filters</h3>
      </div>

      <div className={styles.resetButtonContainer}>
        <button
          type="button"
          className={styles.resetButton}
          onClick={resetFilters}
          aria-label="Reset all filters"
        >
          Reset filters
        </button>
      </div>

      <div className={styles.scrollContent}>

      {/* Distance Filter */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <label className={styles.label}>Distance</label>
          <span className={styles.value}>{distance}m</span>
        </div>
        <div className={styles.sliderContainer}>
          <input
            type="range"
            min="50"
            max="1000"
            step="50"
            value={distance}
            onChange={(e) => setDistance(parseInt(e.target.value))}
            className={styles.slider}
            aria-label="Distance filter"
          />
          <div className={styles.sliderLabels}>
            <span>50m</span>
            <span>1km</span>
          </div>
        </div>
      </div>

      {/* Time Filter */}
      <div className={styles.section}>
        <label className={styles.label}>When</label>
        <div className={styles.timeFilters}>
          {mockTimeFilters.map((filter) => (
            <motion.button
              key={filter.id}
              className={`${styles.timeButton} ${timeFilter === filter.id ? styles.timeButtonActive : ''}`}
              onClick={() => setTimeFilter(filter.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              aria-pressed={timeFilter === filter.id}
            >
              {filter.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Sort Filter */}
      <div className={styles.section}>
        <div className={styles.sortHeader}>
          <span className={styles.sortIcon}>↕</span>
          <label className={styles.label}>Sort</label>
        </div>
        <div className={styles.selectWrapper}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.select}
            aria-label="Sort posts"
          >
            {mockSortOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className={styles.selectIcon} />
        </div>
      </div>

      {/* Categories Filter */}
      <div className={styles.section}>
        <label className={styles.label}>Categories</label>
        <div className={styles.categories}>
          {categories.map((category) => {
            const Icon = categoryIcons[category.id];
            const isSelected = selectedCategories.includes(category.id);
            return (
              <motion.label
                key={category.id}
                className={`${styles.category} ${isSelected ? styles.categorySelected : ''}`}
                whileHover={{ x: 2 }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleCategory(category.id)}
                  className={styles.checkbox}
                  aria-label={`Filter by ${category.label}`}
                />
                <span 
                  className={styles.categoryIcon}
                  style={{ color: categoryColors[category.id] }}
                >
                  <Icon size={16} />
                </span>
                <span className={styles.categoryLabel}>{category.label}</span>
              </motion.label>
            );
          })}
        </div>
      </div>
      </div>
    </motion.div>
  );
};
