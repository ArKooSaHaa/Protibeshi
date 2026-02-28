// src/features/relief/hooks/useReliefFilters.ts
import { useMemo, useState } from 'react';
import type {
  HelpOffer,
  ReliefFilterState,
  ReliefHelpType,
  ReliefRequest,
  ReliefStatus,
  ReliefTabView,
  ReliefTimeRange,
  ReliefUrgency,
} from '../types/relief.types';

const defaultFilters: ReliefFilterState = {
  helpTypes: [],
  urgencies: [],
  statuses: [],
  distance: 1000,
  timeRange: 'All',
  verifiedOnly: false,
  tab: 'requests',
};

const TIME_RANGE_MS: Record<ReliefTimeRange, number> = {
  Today: 24 * 60 * 60 * 1000,
  'This week': 7 * 24 * 60 * 60 * 1000,
  'This month': 30 * 24 * 60 * 60 * 1000,
  All: Infinity,
};

export const useReliefFilters = (
  requests: ReliefRequest[],
  offers: HelpOffer[],
) => {
  const [filters, setFilters] = useState<ReliefFilterState>(defaultFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const toggleTab = (tab: ReliefTabView) =>
    setFilters((prev) => ({ ...prev, tab }));

  const toggleHelpType = (type: ReliefHelpType) =>
    setFilters((prev) => ({
      ...prev,
      helpTypes: prev.helpTypes.includes(type)
        ? prev.helpTypes.filter((t) => t !== type)
        : [...prev.helpTypes, type],
    }));

  const toggleUrgency = (level: ReliefUrgency) =>
    setFilters((prev) => ({
      ...prev,
      urgencies: prev.urgencies.includes(level)
        ? prev.urgencies.filter((u) => u !== level)
        : [...prev.urgencies, level],
    }));

  const toggleStatus = (status: ReliefStatus) =>
    setFilters((prev) => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter((s) => s !== status)
        : [...prev.statuses, status],
    }));

  const setTimeRange = (timeRange: ReliefTimeRange) =>
    setFilters((prev) => ({ ...prev, timeRange }));

  const setDistance = (distance: number) =>
    setFilters((prev) => ({ ...prev, distance }));

  const setVerifiedOnly = (verifiedOnly: boolean) =>
    setFilters((prev) => ({ ...prev, verifiedOnly }));

  const resetFilters = () => setFilters(defaultFilters);

  const activeFilterCount =
    filters.helpTypes.length +
    filters.urgencies.length +
    filters.statuses.length +
    (filters.verifiedOnly ? 1 : 0) +
    (filters.timeRange !== 'All' ? 1 : 0) +
    (filters.distance < 1000 ? 1 : 0);

  // ── Filtered requests ──────────────────────────────────────────────────────
  const filteredRequests = useMemo(() => {
    const cutoff = TIME_RANGE_MS[filters.timeRange];
    return requests.filter((r) => {
      if (filters.helpTypes.length && !filters.helpTypes.includes(r.helpType)) return false;
      if (filters.urgencies.length && !filters.urgencies.includes(r.urgency)) return false;
      if (filters.statuses.length && !filters.statuses.includes(r.status)) return false;
      if (r.distance > filters.distance) return false;
      if (filters.verifiedOnly && !r.verified) return false;
      if (cutoff !== Infinity) {
        const age = Date.now() - new Date(r.createdAt).getTime();
        if (age > cutoff) return false;
      }
      return true;
    });
  }, [requests, filters]);

  // ── Filtered offers ────────────────────────────────────────────────────────
  const filteredOffers = useMemo(() => {
    return offers.filter((o) => {
      if (filters.helpTypes.length && !filters.helpTypes.includes(o.helpType)) return false;
      if (o.distance > filters.distance) return false;
      if (filters.verifiedOnly && !o.verified) return false;
      return true;
    });
  }, [offers, filters]);

  return {
    filters,
    isFilterOpen,
    setIsFilterOpen,
    filteredRequests,
    filteredOffers,
    activeFilterCount,
    toggleTab,
    toggleHelpType,
    toggleUrgency,
    toggleStatus,
    setTimeRange,
    setDistance,
    setVerifiedOnly,
    resetFilters,
  };
};
