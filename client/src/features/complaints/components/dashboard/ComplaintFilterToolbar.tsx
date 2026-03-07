import { motion } from 'framer-motion';
import { ArrowUpDown, CalendarDays, Filter, SlidersHorizontal } from 'lucide-react';
import {
  complaintCategories,
  complaintPriorities,
  complaintStatuses,
  complaintTimeRanges,
  type ComplaintCategory,
  type ComplaintFilterState,
  type ComplaintPriority,
  type ComplaintStatus,
  type ComplaintTimeRange,
} from '../../types/complaint.types';

export type ComplaintSortOption = 'Newest' | 'Closest' | 'Most urgent' | 'Most discussed';

interface ComplaintFilterToolbarProps {
  filters: ComplaintFilterState;
  sortBy: ComplaintSortOption;
  onSortChange: (value: ComplaintSortOption) => void;
  onToggleStatus: (value: ComplaintStatus) => void;
  onTogglePriority: (value: ComplaintPriority) => void;
  onToggleCategory: (value: ComplaintCategory) => void;
  onDistanceChange: (value: number) => void;
  onTimeRangeChange: (value: ComplaintTimeRange) => void;
  onClearFilters: () => void;
}

const chipBase =
  'rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400';

const isFiltered = (filters: ComplaintFilterState) => {
  return (
    filters.statuses.length > 0 ||
    filters.priorities.length > 0 ||
    filters.categories.length > 0 ||
    filters.distance < 2000 ||
    filters.timeRange !== 'All' ||
    filters.myComplaints
  );
};

export const ComplaintFilterToolbar = ({
  filters,
  sortBy,
  onSortChange,
  onToggleStatus,
  onTogglePriority,
  onToggleCategory,
  onDistanceChange,
  onTimeRangeChange,
  onClearFilters,
}: ComplaintFilterToolbarProps) => {
  return (
    <motion.section
      className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-[0_14px_30px_-22px_rgba(15,23,42,0.4)] backdrop-blur"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Filter size={16} className="text-emerald-600" />
          Filter and Sort
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <ArrowUpDown className="pointer-events-none absolute left-3 top-2.5 text-slate-400" size={14} />
            <select
              className="rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-8 text-xs font-medium text-slate-700"
              value={sortBy}
              onChange={(event) => onSortChange(event.target.value as ComplaintSortOption)}
            >
              <option>Newest</option>
              <option>Closest</option>
              <option>Most urgent</option>
              <option>Most discussed</option>
            </select>
          </div>
          <button
            type="button"
            onClick={onClearFilters}
            disabled={!isFiltered(filters)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            <SlidersHorizontal size={12} /> Status
          </div>
          <div className="flex flex-wrap gap-2">
            {complaintStatuses.map((status) => {
              const active = filters.statuses.includes(status);
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => onToggleStatus(status)}
                  className={`${chipBase} ${
                    active
                      ? 'border-blue-300 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {status}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Priority</div>
          <div className="flex flex-wrap gap-2">
            {complaintPriorities.map((priority) => {
              const active = filters.priorities.includes(priority);
              return (
                <button
                  key={priority}
                  type="button"
                  onClick={() => onTogglePriority(priority)}
                  className={`${chipBase} ${
                    active
                      ? 'border-rose-300 bg-rose-50 text-rose-700'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {priority}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Category</div>
          <div className="flex flex-wrap gap-2">
            {complaintCategories.map((category) => {
              const active = filters.categories.includes(category);
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => onToggleCategory(category)}
                  className={`${chipBase} ${
                    active
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Distance: {filters.distance}m
            </span>
            <input
              type="range"
              min={100}
              max={2000}
              step={50}
              value={filters.distance}
              onChange={(event) => onDistanceChange(Number(event.target.value))}
              className="h-2 w-full accent-emerald-500"
            />
          </label>

          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
            <div className="mb-2 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              <CalendarDays size={12} /> Date range
            </div>
            <div className="flex flex-wrap gap-2">
              {complaintTimeRanges.map((range) => {
                const active = filters.timeRange === range;
                return (
                  <button
                    key={range}
                    type="button"
                    onClick={() => onTimeRangeChange(range)}
                    className={`${chipBase} ${
                      active
                        ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {range}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};
