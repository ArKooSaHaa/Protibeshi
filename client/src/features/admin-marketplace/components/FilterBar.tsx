import { Search } from 'lucide-react';
import type { AdminMarketplaceSort, AdminReportSeverity } from '../types/adminMarketplace.types';

interface FilterBarProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  locationFilter: string;
  onLocationFilterChange: (value: string) => void;
  sortBy: AdminMarketplaceSort;
  onSortByChange: (value: AdminMarketplaceSort) => void;
  categoryOptions: string[];
  locationOptions: string[];
  showSeverityFilter: boolean;
  severityFilter: 'all' | AdminReportSeverity;
  onSeverityFilterChange: (value: 'all' | AdminReportSeverity) => void;
}

export const FilterBar = ({
  searchQuery,
  onSearchQueryChange,
  categoryFilter,
  onCategoryFilterChange,
  locationFilter,
  onLocationFilterChange,
  sortBy,
  onSortByChange,
  categoryOptions,
  locationOptions,
  showSeverityFilter,
  severityFilter,
  onSeverityFilterChange,
}: FilterBarProps) => {
  return (
    <section className="amp-filter-wrap" aria-label="Marketplace moderation filters">
      <div className="amp-search-box">
        <Search size={16} />
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="Search title, seller, or location"
        />
      </div>

      <div className="amp-filter-row">
        <label>
          <span>Category</span>
          <select value={categoryFilter} onChange={(event) => onCategoryFilterChange(event.target.value)}>
            <option value="all">All categories</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Location</span>
          <select value={locationFilter} onChange={(event) => onLocationFilterChange(event.target.value)}>
            <option value="all">All locations</option>
            {locationOptions.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Sort</span>
          <select
            value={sortBy}
            onChange={(event) => onSortByChange(event.target.value as AdminMarketplaceSort)}
          >
            <option value="latest">Latest</option>
            <option value="most_reported">Most reported</option>
            <option value="oldest">Oldest</option>
          </select>
        </label>

        {showSeverityFilter ? (
          <label>
            <span>Report severity</span>
            <select
              value={severityFilter}
              onChange={(event) =>
                onSeverityFilterChange(event.target.value as 'all' | AdminReportSeverity)
              }
            >
              <option value="all">All severity</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>
        ) : null}
      </div>
    </section>
  );
};
