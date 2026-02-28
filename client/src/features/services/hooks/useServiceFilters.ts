// src/features/services/hooks/useServiceFilters.ts 
import { useMemo } from 'react';
import { ServiceFilterState, ServiceItem } from
  '../types/service.types';

export const DEFAULT_SERVICE_FILTERS: ServiceFilterState = {
  distance: 350,
  categories: [],
  availability: [],
  minPrice: 200,
  maxPrice: 3000,
  verifiedOnly: false,
  minRating: 0,
  sortBy: 'Nearest',
};

const applySort = (services: ServiceItem[], sortBy:
  ServiceFilterState['sortBy']) => {
  switch (sortBy) {
    case 'Nearest':
      return [...services].sort((a, b) => a.distance - b.distance);
    case 'Highest Rated':
      return [...services].sort((a, b) => b.rating - a.rating);
    case 'Lowest Price':
      return [...services].sort((a, b) => a.price - b.price);
    case 'Most Reviewed':
      return [...services].sort((a, b) => b.reviews - a.reviews);
    case 'Recently Added':
      return [...services].sort((a, b) => b.createdAt - a.createdAt);
    default:
      return services;
  }
};

export const useServiceFilters = (services: ServiceItem[], filters:
  ServiceFilterState) => {
  return useMemo(() => {
    const filtered = services.filter((service) => {
      if (service.distance > filters.distance) {
        return false;
      }

      if (service.price < filters.minPrice || service.price >
        filters.maxPrice) {
        return false;
      }

      if (filters.categories.length > 0 &&
        !filters.categories.includes(service.category)) {
        return false;
      }

      if (filters.availability.length > 0 &&
        !filters.availability.includes(service.availability)) {
        return false;
      }

      if (filters.verifiedOnly && !service.verified) {
        return false;
      }

      if (service.rating < filters.minRating) {
        return false;
      }

      return true;
    });

    return applySort(filtered, filters.sortBy);
  }, [services, filters]);
}; 