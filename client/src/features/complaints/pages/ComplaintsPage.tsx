import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { AlertTriangle, CheckCheck, Clock3, FilePlus2, Filter, MapPinned, Siren, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ComplaintDetailsDrawer } from '../components/ComplaintDetailsDrawer';
import { ComplaintForm } from '../components/ComplaintForm';
import { CivicHeroBanner } from '../components/dashboard/CivicHeroBanner';
import {
  ComplaintFilterToolbar,
  type ComplaintSortOption,
} from '../components/dashboard/ComplaintFilterToolbar';
import { ComplaintFeedCard } from '../components/dashboard/ComplaintFeedCard';
import { ComplaintStatsOverview } from '../components/dashboard/ComplaintStatsOverview';
import { NeighborhoodMapPreview } from '../components/dashboard/NeighborhoodMapPreview';
import { useComplaintsBoard } from '../hooks/useComplaintsBoard';
import {
  type ComplaintCategory,
  type ComplaintItem,
  type ComplaintPriority,
  type ComplaintStatus,
  type ComplaintTimeRange,
} from '../types/complaint.types';

const feedVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.08 },
  },
};

const feedItemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
};

const priorityRank: Record<ComplaintPriority, number> = {
  Low: 1,
  Medium: 2,
  High: 3,
  Urgent: 4,
};

const toggleInArray = <T,>(items: T[], value: T): T[] => {
  return items.includes(value) ? items.filter((item) => item !== value) : [...items, value];
};

export const ComplaintsPage = () => {
  const {
    complaints,
    filteredComplaints,
    filters,
    setFilters,
    selectedComplaint,
    setSelectedComplaint,
    isFormOpen,
    setIsFormOpen,
    formState,
    formErrors,
    updateFormValue,
    handleSubmit,
  } = useComplaintsBoard();

  const [sortBy, setSortBy] = useState<ComplaintSortOption>('Newest');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isMapPanelOpen, setIsMapPanelOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isFormOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFormOpen]);

  useEffect(() => {
    if (!isFilterPanelOpen && !isMapPanelOpen) {
      return;
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFilterPanelOpen(false);
        setIsMapPanelOpen(false);
      }
    };

    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [isFilterPanelOpen, isMapPanelOpen]);

  const handleViewDetails = (complaint: ComplaintItem) => {
    setSelectedComplaint(complaint);
  };

  const sortedComplaints = useMemo(() => {
    const items = [...filteredComplaints];

    switch (sortBy) {
      case 'Closest':
        return items.sort((a, b) => a.distance - b.distance);
      case 'Most urgent':
        return items.sort((a, b) => {
          if (priorityRank[b.priority] !== priorityRank[a.priority]) {
            return priorityRank[b.priority] - priorityRank[a.priority];
          }

          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      case 'Most discussed':
        return items.sort((a, b) => b.comments - a.comments);
      case 'Newest':
      default:
        return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }, [filteredComplaints, sortBy]);

  const stats = useMemo(() => {
    const totalComplaints = complaints.length;
    const activeCases = complaints.filter(
      (item) => item.status === 'Pending' || item.status === 'Under Review' || item.status === 'In Progress',
    ).length;
    const resolvedIssues = complaints.filter((item) => item.status === 'Resolved').length;
    const highPriority = complaints.filter(
      (item) => item.priority === 'High' || item.priority === 'Urgent',
    ).length;

    const responseSamples = complaints
      .map((item) => {
        const firstAction = item.updates.find((update) => update.stage !== 'Reported');

        if (!firstAction) {
          return null;
        }

        const createdAt = new Date(item.createdAt).getTime();
        const actedAt = new Date(firstAction.date).getTime();
        const diffHours = Math.max(1, Math.round((actedAt - createdAt) / (1000 * 60 * 60)));
        return Number.isFinite(diffHours) ? diffHours : null;
      })
      .filter((value): value is number => value !== null);

    const avgResponseTime =
      responseSamples.length > 0
        ? Math.round(responseSamples.reduce((sum, value) => sum + value, 0) / responseSamples.length)
        : 0;

    return [
      {
        id: 'total',
        label: 'Total Complaints',
        value: totalComplaints,
        hint: 'All civic reports in this neighborhood',
        icon: FilePlus2,
        tone: 'bg-slate-100 text-slate-700',
        ring: 'bg-slate-300/35',
      },
      {
        id: 'active',
        label: 'Active Cases',
        value: activeCases,
        hint: 'Pending or in review this week',
        icon: AlertTriangle,
        tone: 'bg-blue-100 text-blue-700',
        ring: 'bg-blue-300/35',
      },
      {
        id: 'resolved',
        label: 'Resolved Issues',
        value: resolvedIssues,
        hint: 'Closed by civic authority',
        icon: CheckCheck,
        tone: 'bg-emerald-100 text-emerald-700',
        ring: 'bg-emerald-300/35',
      },
      {
        id: 'response',
        label: 'Avg Response Time',
        value: avgResponseTime,
        suffix: 'h',
        hint: 'Average first civic acknowledgment',
        icon: Clock3,
        tone: 'bg-amber-100 text-amber-700',
        ring: 'bg-amber-300/35',
      },
      {
        id: 'priority',
        label: 'High Priority',
        value: highPriority,
        hint: 'High and urgent complaints',
        icon: Siren,
        tone: 'bg-rose-100 text-rose-700',
        ring: 'bg-rose-300/35',
      },
    ];
  }, [complaints]);

  return (
    <div className="flex flex-col gap-4 px-2 pb-28 pt-2 lg:gap-5">
      <CivicHeroBanner />

      <ComplaintStatsOverview stats={stats} />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"
            whileHover={{ y: -1 }}
            whileTap={{ y: 1 }}
            onClick={() => setIsFilterPanelOpen(true)}
          >
            <Filter size={15} className="text-emerald-600" /> Filters
          </motion.button>
          <motion.button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"
            whileHover={{ y: -1 }}
            whileTap={{ y: 1 }}
            onClick={() => setIsMapPanelOpen(true)}
          >
            <MapPinned size={15} className="text-emerald-600" /> Map
          </motion.button>
        </div>
        <span className="text-xs font-medium text-slate-500">Sorted by {sortBy}</span>
      </div>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Complaints Feed</h2>
            <p className="text-xs text-slate-500">{sortedComplaints.length} issues match current filters</p>
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
            Sorted by {sortBy}
          </span>
        </div>

        <motion.div
          className="grid gap-3 md:grid-cols-2"
          variants={feedVariants}
          initial="hidden"
          animate="visible"
        >
          {sortedComplaints.map((complaint) => (
            <motion.div key={complaint.id} variants={feedItemVariants}>
              <ComplaintFeedCard complaint={complaint} onViewDetails={handleViewDetails} />
            </motion.div>
          ))}
        </motion.div>

        <AnimatePresence>
          {isFilterPanelOpen && (
            <motion.div
              className="fixed inset-0 z-68 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm lg:pl-65"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterPanelOpen(false)}
            >
              <motion.div
                className="relative w-full max-w-6xl lg:max-w-[calc(100vw-320px)]"
                initial={{ opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-500 shadow"
                  onClick={() => setIsFilterPanelOpen(false)}
                  aria-label="Close filters"
                >
                  <X size={16} />
                </button>

                <ComplaintFilterToolbar
                  filters={filters}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  onToggleStatus={(value: ComplaintStatus) =>
                    setFilters((prev) => ({ ...prev, statuses: toggleInArray(prev.statuses, value) }))
                  }
                  onTogglePriority={(value: ComplaintPriority) =>
                    setFilters((prev) => ({ ...prev, priorities: toggleInArray(prev.priorities, value) }))
                  }
                  onToggleCategory={(value: ComplaintCategory) =>
                    setFilters((prev) => ({ ...prev, categories: toggleInArray(prev.categories, value) }))
                  }
                  onDistanceChange={(value: number) => setFilters((prev) => ({ ...prev, distance: value }))}
                  onTimeRangeChange={(value: ComplaintTimeRange) =>
                    setFilters((prev) => ({ ...prev, timeRange: value }))
                  }
                  onClearFilters={() =>
                    setFilters((prev) => ({
                      ...prev,
                      statuses: [],
                      priorities: [],
                      categories: [],
                      distance: 2000,
                      timeRange: 'All',
                      myComplaints: false,
                    }))
                  }
                />
              </motion.div>
            </motion.div>
          )}

          {isMapPanelOpen && (
            <motion.div
              className="fixed inset-0 z-67 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm lg:pl-65"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMapPanelOpen(false)}
            >
              <motion.div
                className="relative w-full max-w-5xl lg:max-w-[calc(100vw-380px)]"
                initial={{ opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-500 shadow"
                  onClick={() => setIsMapPanelOpen(false)}
                  aria-label="Close map preview"
                >
                  <X size={16} />
                </button>

                <NeighborhoodMapPreview
                  complaints={sortedComplaints}
                  onSelectComplaint={(complaint) => {
                    handleViewDetails(complaint);
                    setIsMapPanelOpen(false);
                  }}
                />
              </motion.div>
            </motion.div>
          )}

          {sortedComplaints.length === 0 && (
            <motion.div
              className="flex items-start gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-5 text-slate-600"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
            >
              <AlertTriangle size={18} className="mt-0.5 text-amber-600" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900">No complaints match these filters</h3>
                <p className="text-xs text-slate-500">
                  Try widening distance, choosing a broader date range, or clearing status chips.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <motion.button
        type="button"
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-linear-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_24px_34px_-22px_rgba(5,150,105,0.8)]"
        onClick={() => setIsFormOpen(true)}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
      >
        <FilePlus2 size={16} /> Submit Complaint
      </motion.button>

      <ComplaintDetailsDrawer
        complaint={selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
      />

      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            className="fixed inset-0 z-70 flex items-start justify-center bg-slate-900/45 px-3 pb-3 pt-8 backdrop-blur-sm md:pt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={() => setIsFormOpen(false)}
          >
            <motion.div
              className="relative max-h-[calc(100vh-56px)] w-full max-w-3xl overflow-auto rounded-3xl pb-2 md:max-h-[calc(100vh-84px)]"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="absolute right-4 top-4 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-500 shadow"
                onClick={() => setIsFormOpen(false)}
                aria-label="Close submit complaint dialog"
              >
                <X size={18} />
              </button>
              <ComplaintForm
                formState={formState}
                formErrors={formErrors}
                onChange={updateFormValue}
                onSubmit={handleSubmit}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
