import { useMemo } from "react";
import { useFeedStore, FILTER_OPTIONS } from "../store/feedStore";

const optionLookup = Object.values(FILTER_OPTIONS).reduce((acc, options) => {
  if (!Array.isArray(options)) return acc;

  options.forEach((option) => {
    acc[option.id] = option.label;
  });

  return acc;
}, {});

const formatLabel = (value) => optionLookup[value] || value;

export const useAdvancedFeedFilters = () => {
  const distance = useFeedStore((state) => state.distance);
  const timeRange = useFeedStore((state) => state.timeRange);
  const customDateRange = useFeedStore((state) => state.customDateRange);
  const selectedCategories = useFeedStore((state) => state.selectedCategories);
  const priorityLevels = useFeedStore((state) => state.priorityLevels);
  const postTypes = useFeedStore((state) => state.postTypes);
  const verificationStatuses = useFeedStore((state) => state.verificationStatuses);
  const engagementLevels = useFeedStore((state) => state.engagementLevels);
  const mediaTypes = useFeedStore((state) => state.mediaTypes);
  const locationGranularity = useFeedStore((state) => state.locationGranularity);
  const customRadius = useFeedStore((state) => state.customRadius);
  const sortBy = useFeedStore((state) => state.sortBy);
  const isAdvancedFiltersOpen = useFeedStore((state) => state.isAdvancedFiltersOpen);
  const isMobileFiltersOpen = useFeedStore((state) => state.isMobileFiltersOpen);
  const savedFilterPresets = useFeedStore((state) => state.savedFilterPresets);
  const categories = useFeedStore((state) => state.categories);

  const toggleAdvancedFilters = useFeedStore((state) => state.toggleAdvancedFilters);
  const openMobileFilters = useFeedStore((state) => state.openMobileFilters);
  const closeMobileFilters = useFeedStore((state) => state.closeMobileFilters);
  const setDistance = useFeedStore((state) => state.setDistance);
  const setTimeRange = useFeedStore((state) => state.setTimeRange);
  const setCustomDateRange = useFeedStore((state) => state.setCustomDateRange);
  const setSortBy = useFeedStore((state) => state.setSortBy);
  const setLocationGranularity = useFeedStore((state) => state.setLocationGranularity);
  const setCustomRadius = useFeedStore((state) => state.setCustomRadius);
  const toggleCategory = useFeedStore((state) => state.toggleCategory);
  const toggleFilterValue = useFeedStore((state) => state.toggleFilterValue);
  const clearAllFilters = useFeedStore((state) => state.clearAllFilters);
  const saveCurrentFiltersAsPreset = useFeedStore((state) => state.saveCurrentFiltersAsPreset);
  const applySavedPreset = useFeedStore((state) => state.applySavedPreset);
  const removeSavedPreset = useFeedStore((state) => state.removeSavedPreset);
  const applyFilters = useFeedStore((state) => state.applyFilters);

  const activeTags = useMemo(() => {
    const tags = [];

    if (distance !== 500) {
      tags.push({ key: "distance", label: `Distance: ${distance}m` });
    }

    if (timeRange !== "today") {
      tags.push({ key: "timeRange", label: `When: ${formatLabel(timeRange)}` });
    }

    if (locationGranularity !== "same-neighborhood") {
      tags.push({ key: "locationGranularity", label: `Location: ${formatLabel(locationGranularity)}` });
    }

    if (locationGranularity === "custom-radius" && customRadius !== 500) {
      tags.push({ key: "customRadius", label: `Radius: ${customRadius}m` });
    }

    if (sortBy !== "proximity") {
      tags.push({ key: "sortBy", label: `Sort: ${formatLabel(sortBy)}` });
    }

    selectedCategories.forEach((categoryId) => {
      const category = categories.find((item) => item.id === categoryId);
      tags.push({ key: "selectedCategories", value: categoryId, label: category?.label || categoryId });
    });

    priorityLevels.forEach((value) => tags.push({ key: "priorityLevels", value, label: formatLabel(value) }));
    postTypes.forEach((value) => tags.push({ key: "postTypes", value, label: formatLabel(value) }));
    verificationStatuses.forEach((value) => tags.push({ key: "verificationStatuses", value, label: formatLabel(value) }));
    engagementLevels.forEach((value) => tags.push({ key: "engagementLevels", value, label: formatLabel(value) }));
    mediaTypes.forEach((value) => tags.push({ key: "mediaTypes", value, label: formatLabel(value) }));

    return tags;
  }, [
    categories,
    customRadius,
    distance,
    engagementLevels,
    locationGranularity,
    mediaTypes,
    postTypes,
    priorityLevels,
    selectedCategories,
    sortBy,
    timeRange,
    verificationStatuses,
  ]);

  const removeTag = (tag) => {
    if (tag.key === "distance") {
      setDistance(500);
      return;
    }

    if (tag.key === "timeRange") {
      setTimeRange("today");
      return;
    }

    if (tag.key === "locationGranularity") {
      setLocationGranularity("same-neighborhood");
      return;
    }

    if (tag.key === "customRadius") {
      setCustomRadius(500);
      return;
    }

    if (tag.key === "sortBy") {
      setSortBy("proximity");
      return;
    }

    if (tag.key === "selectedCategories") {
      toggleCategory(tag.value);
      return;
    }

    if (tag.value) {
      toggleFilterValue(tag.key, tag.value);
    }
  };

  const activeFilterCount = activeTags.length;

  const toggleFilters = (isMobile) => {
    if (isMobile) {
      openMobileFilters();
      return;
    }

    toggleAdvancedFilters();
  };

  const applyMobileFilters = () => {
    applyFilters();
    closeMobileFilters();
  };

  return {
    state: {
      distance,
      timeRange,
      customDateRange,
      selectedCategories,
      priorityLevels,
      postTypes,
      verificationStatuses,
      engagementLevels,
      mediaTypes,
      locationGranularity,
      customRadius,
      sortBy,
      isAdvancedFiltersOpen,
      isMobileFiltersOpen,
      savedFilterPresets,
      categories,
      activeFilterCount,
      activeTags,
    },
    options: FILTER_OPTIONS,
    actions: {
      setDistance,
      setTimeRange,
      setCustomDateRange,
      setSortBy,
      setLocationGranularity,
      setCustomRadius,
      toggleCategory,
      toggleFilterValue,
      clearAllFilters,
      saveCurrentFiltersAsPreset,
      applySavedPreset,
      removeSavedPreset,
      toggleAdvancedFilters,
      toggleFilters,
      closeMobileFilters,
      applyMobileFilters,
      removeTag,
    },
  };
};
