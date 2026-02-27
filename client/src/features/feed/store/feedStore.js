// src/features/feed/store/feedStore.js
import { create } from "zustand";
import { mockPosts, mockEvents, mockCategories } from "../mock/feedData";
export const useFeedStore = create((set, get) => ({
  defaultFilters: {
    distance: 500,
    timeFilter: "today",
    sortBy: "proximity",
    selectedCategories: [],
  },
  // Posts
  posts: mockPosts,
  filteredPosts: mockPosts,
  // Filters
  distance: 500,
  timeFilter: "today",
  sortBy: "proximity",
  selectedCategories: [],
  // Events
  events: mockEvents,
  // Categories
  categories: mockCategories,
  // UI State
  isLoading: false,
  showComposer: false,
  // Actions
  setDistance: (distance) => {
    set({ distance });
    get().applyFilters();
  },
  setTimeFilter: (timeFilter) => {
    set({ timeFilter });
    get().applyFilters();
  },
  setSortBy: (sortBy) => {
    set({ sortBy });
    get().applyFilters();
  },
  resetFilters: () => {
    const { defaultFilters } = get();
    set({
      distance: defaultFilters.distance,
      timeFilter: defaultFilters.timeFilter,
      sortBy: defaultFilters.sortBy,
      selectedCategories: [...defaultFilters.selectedCategories],
    });
    get().applyFilters();
  },
  toggleCategory: (categoryId) => {
    const { selectedCategories } = get();
    const newCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter((id) => id !== categoryId)
      : [...selectedCategories, categoryId];
    set({ selectedCategories: newCategories });
    get().applyFilters();
  },
  applyFilters: () => {
    const { posts, distance, selectedCategories, sortBy } = get();
    let filtered = [...posts];
    // Filter by distance (convert distance string to number for comparison)
    filtered = filtered.filter((post) => {
      const postDistance = parseInt(post.distance);
      return postDistance <= distance;
    });
    // Filter by categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((post) => {
        const postCategory = post.tags[0]?.toLowerCase() || "";
        return selectedCategories.some((cat) =>
          postCategory.includes(cat.toLowerCase()),
        );
      });
    }
    // Sort
    if (sortBy === "proximity") {
      filtered.sort((a, b) => parseInt(a.distance) - parseInt(b.distance));
    } else if (sortBy === "newest") {
      // Mock sorting by time
      filtered.sort((a, b) => {
        const timeMap = {
          "5 min": 1,
          "2 hrs": 2,
          "3 hrs": 3,
          "5 hrs": 4,
          "1 day": 5,
        };
        return timeMap[a.timeAgo] - timeMap[b.timeAgo];
      });
    } else if (sortBy === "popular") {
      filtered.sort((a, b) => b.likes - a.likes);
    }
    set({ filteredPosts: filtered });
  },
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
      ...newPost,
    };
    set((state) => ({
      posts: [post, ...state.posts],
      filteredPosts: [post, ...state.filteredPosts],
      showComposer: false,
    }));
  },
  likePost: (postId) => {
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId ? { ...post, likes: post.likes + 1 } : post,
      ),
      filteredPosts: state.filteredPosts.map((post) =>
        post.id === postId ? { ...post, likes: post.likes + 1 } : post,
      ),
    }));
  },
}));
