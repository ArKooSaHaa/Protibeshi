//src/features/feed/mock/feedData.js
export const mockPosts = [
  {
    id: 1,
    type: "emergency",
    author: {
      name: "Building Association",
      avatar: null,
      isOfficial: true,
    },
    distance: "45m",
    timeAgo: "5 min",
    title: "Gas leak detected - evacuate immediately",
    content:
      "Emergency services have been notified. Please exit the building calmly using the nearest stairwell.Assembly point at the main gate.",
    tags: ["Emergency", "Safety"],
    likes: 32,
    comments: 15,
    priority: "high",
  },
  {
    id: 2,
    type: "community",
    author: {
      name: "Moumita",
      block: "Block A",
      avatar: null,
      badge: "Helpful Neighbor",
    },
    distance: "60m",
    timeAgo: "2 hrs",
    title: "Free textbooks for class 8",
    content:
      "Have a full set of CBSE class 8 books in good condition.Happy to give away to any student in the neighborhood.",
    tags: ["Education", "Free"],
    likes: 24,
    comments: 8,
    reactions: ["Good vibes"],
  },
  {
    id: 3,
    type: "service",
    author: {
      name: "Rahul Sharma",
      block: "Block C",
      avatar: null,
    },
    distance: "120m",
    timeAgo: "3 hrs",
    title: "Plumber available - same day service",
    content:
      "Experienced plumber available for all types of repairs.Leakage, pipe fitting, bathroom fittings.Reasonable rates.",
    tags: ["Services", "Home Repair"],
    likes: 18,
    comments: 5,
  },
  {
    id: 4,
    type: "marketplace",
    author: {
      name: "Ananya Das",
      block: "Block B",
      avatar: null,
    },
    distance: "200m",
    timeAgo: "5 hrs",
    title: "Selling dining table - 6 seater",
    content:
      "Wooden dining table in excellent condition. 6 seater with hairs.Price: ₹8,000(negotiable).Pickup from Block B.",
    tags: ["For Sale", "Furniture"],
    likes: 12,
    comments: 3,
  },
  {
    id: 5,
    type: "event",
    author: {
      name: "Community Council",
      avatar: null,
      isOfficial: true,
    },
    distance: "0m",
    timeAgo: "1 day",
    title: "Monthly residents meeting - March",
    content:
      "Join us for the monthly residents meeting. Agenda: Security updates, maintenance fund, upcoming events.",
    tags: ["Meeting", "Community"],
    likes: 45,
    comments: 12,
  },
];

export const mockEvents = [
  {
    id: 1,
    title: "Rooftop adda & chai",
    date: "Today",
    time: "7:30 PM",
    distance: "40m away",
    interested: 14,
    category: "Social",
  },
  {
    id: 2,
    title: "Community clean-up drive",
    date: "Saturday",
    time: "8:00 AM",
    distance: "190m away",
    interested: 23,
    category: "Civic",
  },
  {
    id: 3,
    title: "Board games & potluck night",
    date: "Sunday",
    time: "6:00 PM",
    distance: "120m away",
    interested: 9,
    category: "Indoor",
  },
];

export const mockCategories = [
  {
    id: "emergency",
    label: "Emergency",
    icon: "AlertTriangle",
    color: "red",
  },
  { id: "utilities", label: "Utilities", icon: "Zap", color: "yellow" },
  { id: "services", label: "Services", icon: "Wrench", color: "blue" },
  { id: "social", label: "Social", icon: "Users", color: "purple" },
  { id: "events", label: "Events", icon: "Calendar", color: "green" },
  {
    id: "marketplace",
    label: "Marketplace",
    icon: "ShoppingBag",
    color: "orange",
  },
];

export const mockTimeFilters = [
  { id: "today", label: "Today" },
  { id: "last3days", label: "Last 3 days" },
  { id: "thisweek", label: "This week" },
  { id: "alltime", label: "All time" },
];

export const mockSortOptions = [
  { id: "proximity", label: "Proximity & Recent" },
  { id: "newest", label: "Newest First" },
  { id: "popular", label: "Most Popular" },
  { id: "distance", label: "Nearest First" },
];

export const mockNavigation = [
  { id: "feed", label: "Feed", icon: "Home", active: true },
  {
    id: "marketplace",
    label: "Marketplace",
    icon: "ShoppingBag",
    active: false,
  },
  { id: "rent", label: "Rent", icon: "Building", active: false },
  { id: "services", label: "Services", icon: "Wrench", active: false },
  {
    id: "complaints",
    label: "Complaints",
    icon: "AlertCircle",
    active: false,
  },
  { id: "relief", label: "Relief", icon: "Heart", active: false },
  {
    id: "messages",
    label: "Messages",
    icon: "MessageSquare",
    active: false,
  },
];

export const mockNeighborhoodMood = {
  emoji: "👋",
  label: "Normal activity level",
  description: "Things are calm in your neighborhood",
};

export const mockAIAssistant = {
  status: "Ready",
  message:
    "Hi! I am your Protibeshi AI. Ask me anything about your neighborhood — routes, safety, services, or events.",
};
