// src/features/feed/store/feedStore.js
import { create } from "zustand";
import { mockPosts, mockEvents, mockCategories } from "../mock/feedData";
const FILTER_DEBOUNCE_MS = 260;

export const FILTER_OPTIONS = {
  timeRanges: [
    { id: "today", label: "Today" },
    { id: "last3days", label: "Last 3 days" },
    { id: "thisweek", label: "This week" },
    { id: "custom", label: "Custom date range" },
  ],
  priorityLevels: [
    { id: "high", label: "High" },
    { id: "medium", label: "Medium" },
    { id: "low", label: "Low" },
    { id: "emergency-only", label: "Emergency only" },
  ],
  postTypes: [
    { id: "announcement", label: "Announcement" },
    { id: "help-request", label: "Help Request" },
    { id: "offer-help", label: "Offer Help" },
    { id: "event", label: "Event" },
    { id: "marketplace", label: "Marketplace" },
    { id: "complaint", label: "Complaint" },
  ],
  verificationStatuses: [
    { id: "verified-only", label: "Verified Only" },
    { id: "official-posts-only", label: "Official Posts Only" },
    { id: "neighbors-only", label: "Neighbors Only" },
  ],
  engagementLevels: [
    { id: "most-liked", label: "Most Liked" },
    { id: "most-commented", label: "Most Commented" },
    { id: "recently-active", label: "Recently Active" },
  ],
  mediaTypes: [
    { id: "has-image", label: "Has Image" },
    { id: "has-video", label: "Has Video" },
    { id: "text-only", label: "Text Only" },
  ],
  locationGranularity: [
    { id: "same-building", label: "Same Building" },
    { id: "same-block", label: "Same Block" },
    { id: "same-neighborhood", label: "Same Neighborhood" },
    { id: "custom-radius", label: "Custom Radius" },
  ],
  sortOptions: [
    { id: "proximity", label: "Proximity & Recent" },
    { id: "newest", label: "Newest First" },
    { id: "oldest", label: "Oldest First" },
    { id: "relevant", label: "Most Relevant" },
    { id: "urgent", label: "Most Urgent" },
  ],
};

const INITIAL_SAVED_PRESETS = [
  {
    id: "preset-emergency-alerts",
    name: "Emergency Alerts",
    filters: {
      priorityLevels: ["high", "emergency-only"],
      selectedCategories: ["emergency"],
      sortBy: "urgent",
    },
  },
  {
    id: "preset-events-near",
    name: "Events Near Me",
    filters: {
      postTypes: ["event"],
      selectedCategories: ["events"],
      sortBy: "proximity",
      locationGranularity: "same-neighborhood",
    },
  },
  {
    id: "preset-marketplace",
    name: "Marketplace Only",
    filters: {
      postTypes: ["marketplace"],
      selectedCategories: ["marketplace"],
      sortBy: "newest",
    },
  },
];

const defaultFilters = {
  distance: 500,
  timeRange: "today",
  customDateRange: {
    start: "",
    end: "",
  },
  selectedCategories: [],
  priorityLevels: [],
  postTypes: [],
  verificationStatuses: [],
  engagementLevels: [],
  mediaTypes: [],
  locationGranularity: "same-neighborhood",
  customRadius: 500,
  sortBy: "proximity",
};

let filterDebounceTimer;

const timeMapInMinutes = {
  "just now": 0,
  "5 min": 5,
  "2 hrs": 120,
  "3 hrs": 180,
  "5 hrs": 300,
  "1 day": 1440,
};

const typeAliases = {
  emergency: ["announcement", "complaint"],
  community: ["announcement", "help-request", "offer-help"],
  service: ["offer-help"],
  marketplace: ["marketplace"],
  event: ["event"],
};

const locationLimits = {
  "same-building": 100,
  "same-block": 300,
  "same-neighborhood": 1000,
};

const parseDistance = (distanceValue) => Number.parseInt(distanceValue, 10) || 0;

const parseTimeToMinutes = (timeAgo = "") => {
  const normalized = String(timeAgo).trim().toLowerCase();
  if (timeMapInMinutes[normalized] !== undefined) {
    return timeMapInMinutes[normalized];
  }

  if (normalized.includes("min")) {
    return Number.parseInt(normalized, 10) || 0;
  }

  if (normalized.includes("hr")) {
    return (Number.parseInt(normalized, 10) || 0) * 60;
  }

  if (normalized.includes("day")) {
    return (Number.parseInt(normalized, 10) || 0) * 1440;
  }

  return Number.MAX_SAFE_INTEGER;
};

const getPostPriority = (post) => {
  if (post.type === "emergency") return "high";
  return post.priority || "medium";
};

const matchesTimeRange = (post, timeRange, customDateRange) => {
  const postMinutes = parseTimeToMinutes(post.timeAgo);

  if (timeRange === "today") return postMinutes <= 1440;
  if (timeRange === "last3days") return postMinutes <= 4320;
  if (timeRange === "thisweek") return postMinutes <= 10080;

  if (timeRange === "custom") {
    const { start, end } = customDateRange;
    if (!start || !end) return true;

    const endDate = new Date(end);
    const startDate = new Date(start);
    const postDate = new Date(Date.now() - postMinutes * 60 * 1000);
    return postDate >= startDate && postDate <= endDate;
  }

  return true;
};

const matchesSelectedCategories = (post, selectedCategories) => {
  if (selectedCategories.length === 0) return true;

  const postType = String(post.type || "").toLowerCase();
  const tagText = (post.tags || []).join(" ").toLowerCase();
  return selectedCategories.some((category) => {
    const normalizedCategory = category.toLowerCase();
    if (postType.includes(normalizedCategory)) return true;
    return tagText.includes(normalizedCategory);
  });
};

const matchesPostType = (post, postTypes) => {
  if (postTypes.length === 0) return true;

  const mappedTypes = typeAliases[post.type] || [post.type];
  return postTypes.some((requestedType) => mappedTypes.includes(requestedType));
};

const matchesVerificationStatus = (post, verificationStatuses) => {
  if (verificationStatuses.length === 0) return true;

  const isOfficial = Boolean(post.author?.isOfficial);
  const isVerified = isOfficial || Boolean(post.author?.badge);

  return verificationStatuses.some((status) => {
    if (status === "verified-only") return isVerified;
    if (status === "official-posts-only") return isOfficial;
    if (status === "neighbors-only") return !isOfficial;
    return true;
  });
};

const matchesPriority = (post, priorityLevels) => {
  if (priorityLevels.length === 0) return true;

  const postPriority = getPostPriority(post);
  return priorityLevels.some((level) => {
    if (level === "emergency-only") return post.type === "emergency";
    return postPriority === level;
  });
};

const matchesEngagement = (post, engagementLevels) => {
  if (engagementLevels.length === 0) return true;

  const likes = Number(post.likes || 0);
  const comments = Number(post.comments || 0);
  const minutes = parseTimeToMinutes(post.timeAgo);

  return engagementLevels.some((level) => {
    if (level === "most-liked") return likes >= 20;
    if (level === "most-commented") return comments >= 8;
    if (level === "recently-active") return minutes <= 180;
    return true;
  });
};

const matchesMedia = (post, mediaTypes) => {
  if (mediaTypes.length === 0) return true;

  const hasImage = Boolean(post.imageUrl || post.image || post.images?.length);
  const hasVideo = Boolean(post.videoUrl || post.video || post.videos?.length);
  const isTextOnly = !hasImage && !hasVideo;

  return mediaTypes.some((mediaType) => {
    if (mediaType === "has-image") return hasImage;
    if (mediaType === "has-video") return hasVideo;
    if (mediaType === "text-only") return isTextOnly;
    return true;
  });
};

const matchesLocationGranularity = (post, locationGranularity, customRadius) => {
  const postDistance = parseDistance(post.distance);
  if (locationGranularity === "custom-radius") {
    return postDistance <= customRadius;
  }

  const limit = locationLimits[locationGranularity] || locationLimits["same-neighborhood"];
  return postDistance <= limit;
};

const sortFilteredPosts = (filteredPosts, sortBy) => {
  if (sortBy === "proximity") {
    return filteredPosts.sort((a, b) => parseDistance(a.distance) - parseDistance(b.distance));
  }

  if (sortBy === "newest") {
    return filteredPosts.sort((a, b) => parseTimeToMinutes(a.timeAgo) - parseTimeToMinutes(b.timeAgo));
  }

  if (sortBy === "oldest") {
    return filteredPosts.sort((a, b) => parseTimeToMinutes(b.timeAgo) - parseTimeToMinutes(a.timeAgo));
  }

  if (sortBy === "relevant") {
    return filteredPosts.sort((a, b) => {
      const aScore = Number(a.likes || 0) + Number(a.comments || 0) - parseDistance(a.distance) / 50;
      const bScore = Number(b.likes || 0) + Number(b.comments || 0) - parseDistance(b.distance) / 50;
      return bScore - aScore;
    });
  }

  if (sortBy === "urgent") {
    return filteredPosts.sort((a, b) => {
      const emergencyWeightA = a.type === "emergency" ? 100 : 0;
      const emergencyWeightB = b.type === "emergency" ? 100 : 0;
      const priorityWeightA = getPostPriority(a) === "high" ? 50 : 0;
      const priorityWeightB = getPostPriority(b) === "high" ? 50 : 0;
      const scoreA = emergencyWeightA + priorityWeightA - parseDistance(a.distance) / 10;
      const scoreB = emergencyWeightB + priorityWeightB - parseDistance(b.distance) / 10;
      return scoreB - scoreA;
    });
  }

  return filteredPosts;
};

const getActiveFilterCount = (state) => {
  const filters = [
    state.distance !== defaultFilters.distance,
    state.timeRange !== defaultFilters.timeRange,
    state.selectedCategories.length > 0,
    state.priorityLevels.length > 0,
    state.postTypes.length > 0,
    state.verificationStatuses.length > 0,
    state.engagementLevels.length > 0,
    state.mediaTypes.length > 0,
    state.locationGranularity !== defaultFilters.locationGranularity,
    state.locationGranularity === "custom-radius" && state.customRadius !== defaultFilters.customRadius,
    state.sortBy !== defaultFilters.sortBy,
  ];

  return filters.filter(Boolean).length;
};

const scheduleFilters = (get) => {
  clearTimeout(filterDebounceTimer);
  filterDebounceTimer = setTimeout(() => {
    get().applyFilters();
  }, FILTER_DEBOUNCE_MS);
};

export const useFeedStore = create((set, get) => ({
  defaultFilters,

  posts: mockPosts,
  filteredPosts: mockPosts,
  events: mockEvents,
  categories: mockCategories,

  distance: defaultFilters.distance,
  timeRange: defaultFilters.timeRange,
  customDateRange: { ...defaultFilters.customDateRange },
  selectedCategories: [...defaultFilters.selectedCategories],
  priorityLevels: [...defaultFilters.priorityLevels],
  postTypes: [...defaultFilters.postTypes],
  verificationStatuses: [...defaultFilters.verificationStatuses],
  engagementLevels: [...defaultFilters.engagementLevels],
  mediaTypes: [...defaultFilters.mediaTypes],
  locationGranularity: defaultFilters.locationGranularity,
  customRadius: defaultFilters.customRadius,
  sortBy: defaultFilters.sortBy,

  savedFilterPresets: INITIAL_SAVED_PRESETS,
  isAdvancedFiltersOpen: false,
  isMobileFiltersOpen: false,

  isLoading: false,
  showComposer: false,

  toggleAdvancedFilters: () =>
    set((state) => ({ isAdvancedFiltersOpen: !state.isAdvancedFiltersOpen })),
  openMobileFilters: () => set({ isMobileFiltersOpen: true }),
  closeMobileFilters: () => set({ isMobileFiltersOpen: false }),

  setDistance: (distance) => {
    set({ distance });
    scheduleFilters(get);
  },
  setTimeRange: (timeRange) => {
    set({ timeRange });
    scheduleFilters(get);
  },
  setCustomDateRange: (customDateRange) => {
    set({ customDateRange });
    scheduleFilters(get);
  },
  setSortBy: (sortBy) => {
    set({ sortBy });
    scheduleFilters(get);
  },
  setLocationGranularity: (locationGranularity) => {
    set({ locationGranularity });
    scheduleFilters(get);
  },
  setCustomRadius: (customRadius) => {
    set({ customRadius });
    scheduleFilters(get);
  },

  toggleCategory: (categoryId) => {
    const { selectedCategories } = get();
    const newCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter((id) => id !== categoryId)
      : [...selectedCategories, categoryId];

    set({ selectedCategories: newCategories });
    scheduleFilters(get);
  },

  toggleFilterValue: (key, value) => {
    const currentValues = get()[key];
    const updatedValues = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value];

    set({ [key]: updatedValues });
    scheduleFilters(get);
  },

  clearAllFilters: () => {
    set({
      distance: defaultFilters.distance,
      timeRange: defaultFilters.timeRange,
      customDateRange: { ...defaultFilters.customDateRange },
      selectedCategories: [...defaultFilters.selectedCategories],
      priorityLevels: [...defaultFilters.priorityLevels],
      postTypes: [...defaultFilters.postTypes],
      verificationStatuses: [...defaultFilters.verificationStatuses],
      engagementLevels: [...defaultFilters.engagementLevels],
      mediaTypes: [...defaultFilters.mediaTypes],
      locationGranularity: defaultFilters.locationGranularity,
      customRadius: defaultFilters.customRadius,
      sortBy: defaultFilters.sortBy,
    });
    get().applyFilters();
  },

  resetFilters: () => {
    get().clearAllFilters();
  },

  saveCurrentFiltersAsPreset: (name) => {
    const trimmedName = String(name || "").trim();
    if (!trimmedName) return;

    const {
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
      savedFilterPresets,
    } = get();

    const nextPreset = {
      id: `preset-${Date.now()}`,
      name: trimmedName,
      filters: {
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
      },
    };

    set({ savedFilterPresets: [nextPreset, ...savedFilterPresets] });
  },

  applySavedPreset: (presetId) => {
    const preset = get().savedFilterPresets.find((item) => item.id === presetId);
    if (!preset) return;

    set({ ...preset.filters });

    get().applyFilters();
  },

  removeSavedPreset: (presetId) => {
    set((state) => ({
      savedFilterPresets: state.savedFilterPresets.filter((preset) => preset.id !== presetId),
    }));
  },

  applyFilters: () => {
    const {
      posts,
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
    } = get();

    const filtered = posts
      .filter((post) => parseDistance(post.distance) <= distance)
      .filter((post) => matchesLocationGranularity(post, locationGranularity, customRadius))
      .filter((post) => matchesTimeRange(post, timeRange, customDateRange))
      .filter((post) => matchesSelectedCategories(post, selectedCategories))
      .filter((post) => matchesPriority(post, priorityLevels))
      .filter((post) => matchesPostType(post, postTypes))
      .filter((post) => matchesVerificationStatus(post, verificationStatuses))
      .filter((post) => matchesEngagement(post, engagementLevels))
      .filter((post) => matchesMedia(post, mediaTypes));

    const sorted = sortFilteredPosts(filtered, sortBy);
    set({ filteredPosts: sorted });
  },

  getActiveFilterCount: () => getActiveFilterCount(get()),

  toggleComposer: () =>
    set((state) => ({
      showComposer: !state.showComposer,
    })),

  addPost: (newPost) => {
    const post = {
      id: Date.now(),
      type: "community",
      author: {
        name: "You",
        block: "Block A",
        avatar: null,
      },
      distance: "0m",
      timeAgo: "Just now",
      likes: 0,
      comments: 0,
      priority: "low",
      ...newPost,
    };

    set((state) => ({
      posts: [post, ...state.posts],
      showComposer: false,
    }));

    get().applyFilters();
  },

  likePost: (postId) => {
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId ? { ...post, likes: post.likes + 1 } : post,
      ),
    }));

    get().applyFilters();
  },
}));
