import { motion } from 'framer-motion';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { availabilityOptions, serviceCategories, sortOptions } from '../mock/servicesData';
import { ServiceFilterState } from '../types/service.types';
import styles from './ServicesFilters.module.css';

interface ServicesFiltersProps {
  filters: ServiceFilterState;
  onFilterChange: (next: ServiceFilterState) => void;
}

export const ServicesFilters = ({ filters, onFilterChange }: ServicesFiltersProps) => {
  const updateValue = <K extends keyof ServiceFilterState>(key: K, value: ServiceFilterState[K]) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const toggleCategory = (category: (typeof serviceCategories)[number]) => {
    const nextCategories = filters.categories.includes(category)
      ? filters.categories.filter((item) => item !== category)
      : [...filters.categories, category];
    updateValue('categories', nextCategories);
  };

  const toggleAvailability = (value: (typeof availabilityOptions)[number]) => {
    const nextAvailability = filters.availability.includes(value)
      ? filters.availability.filter((item) => item !== value)
      : [...filters.availability, value];
    updateValue('availability', nextAvailability);
  };

  return (
    <motion.div
      className={styles.filtersCard}
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className={styles.cardHeader}>
        <SlidersHorizontal size={16} />
        <h3>Filters</h3>
      </div>

      <div className={styles.group}>
        <div className={styles.groupTitle}>Distance</div>
        <input
          type="range"
          min={50}
          max={2000}
          step={50}
          value={filters.distance}
          onChange={(event) => updateValue('distance', Number(event.target.value))}
          className={styles.slider}
        />
        <div className={styles.helper}>{filters.distance}m</div>
      </div>

      <div className={styles.group}>
        <button type="button" className={styles.groupTitleRow}>
          <span>Category</span>
          <ChevronDown size={16} />
        </button>
        <div className={styles.checkboxList}>
          {serviceCategories.map((category) => (
            <label key={category} className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={filters.categories.includes(category)}
                onChange={() => toggleCategory(category)}
              />
              <span>{category}</span>
            </label>
          ))}
        </div>
      </div>

      <div className={styles.group}>
        <div className={styles.groupTitle}>Availability</div>
        <div className={styles.checkboxList}>
          {availabilityOptions.map((option) => (
            <label key={option} className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={filters.availability.includes(option)}
                onChange={() => toggleAvailability(option)}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </div>

      <div className={styles.group}>
        <div className={styles.groupTitle}>Price Range</div>
        <div className={styles.priceRow}>
          <input
            type="number"
            min={0}
            value={filters.minPrice}
            onChange={(event) => updateValue('minPrice', Number(event.target.value) || 0)}
            placeholder="Min"
            className={styles.input}
          />
          <span className={styles.separator}>—</span>
          <input
            type="number"
            min={0}
            value={filters.maxPrice}
            onChange={(event) => updateValue('maxPrice', Number(event.target.value) || 0)}
            placeholder="Max"
            className={styles.input}
          />
        </div>
      </div>

      <div className={styles.groupInline}>
        <label className={styles.switchLabel}>
          <input
            type="checkbox"
            checked={filters.verifiedOnly}
            onChange={() => updateValue('verifiedOnly', !filters.verifiedOnly)}
          />
          <span>Verified providers only</span>
        </label>
      </div>

      <div className={styles.groupInline}>
        <label className={styles.switchLabel}>
          <input
            type="checkbox"
            checked={filters.minRating >= 4}
            onChange={() => updateValue('minRating', filters.minRating >= 4 ? 0 : 4)}
          />
          <span>4★ & above</span>
        </label>
      </div>

      <div className={styles.group}>
        <div className={styles.groupTitle}>Sort By</div>
        <select
          className={styles.select}
          value={filters.sortBy}
          onChange={(event) => updateValue('sortBy', event.target.value as ServiceFilterState['sortBy'])}
        >
          {sortOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </motion.div>
  );
};
