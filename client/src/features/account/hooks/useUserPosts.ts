import { useCallback, useEffect, useMemo, useState } from 'react';

export type AccountPostTab =
  | 'feed'
  | 'marketplace'
  | 'rent'
  | 'services'
  | 'complaints'
  | 'relief';

export type PostStatus = 'active' | 'expired' | 'pending' | 'open';
export type ReliefType = 'request' | 'offer';

export interface UserProfile {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  city: string;
  neighborhood: string;
  avatarUrl: string;
  bio: string;
  createdAt: string;
  verificationStatus: 'verified' | 'unverified';
}

export interface UserPost {
  id: string;
  authorId: string;
  tab: AccountPostTab;
  title: string;
  description: string;
  datePosted: string;
  location: string;
  status: PostStatus;
  imageUrl?: string;
  price?: string;
  condition?: string;
  category?: string;
  bedrooms?: number;
  priceRange?: string;
  priority?: 'low' | 'medium' | 'high';
  reliefType?: ReliefType;
}

interface FeedSummary {
  totalPosts: number;
  marketplaceListings: number;
  rentListings: number;
  servicesOffered: number;
  complaintsSubmitted: number;
  reliefPosts: number;
}

interface UserPostsResult {
  profile: UserProfile;
  activeTab: AccountPostTab;
  posts: UserPost[];
  totalCount: number;
  hasMore: boolean;
  isLoading: boolean;
  isSavingProfile: boolean;
  stats: FeedSummary;
  pageSize: number;
  tabs: Array<{ key: AccountPostTab; label: string }>;
  setActiveTab: (tab: AccountPostTab) => void;
  loadMore: () => void;
  updateProfile: (payload: Partial<UserProfile>) => Promise<void>;
  updatePost: (
    tab: AccountPostTab,
    postId: string,
    payload: Partial<Pick<UserPost, 'title' | 'description' | 'location' | 'status'>>,
  ) => Promise<void>;
  deletePost: (tab: AccountPostTab, postId: string) => Promise<void>;
}

const PAGE_SIZE = 6;

const currentUserId = 'user-1';

const initialProfile: UserProfile = {
  id: currentUserId,
  fullName: 'Arko Saha',
  username: 'arkosaha',
  email: 'arko@protibeshi.app',
  phone: '+8801711223344',
  city: 'Dhaka',
  neighborhood: 'Motijheel',
  avatarUrl:
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=280&q=80',
  bio: 'Building safer neighborhoods through local collaboration and transparent community action.',
  createdAt: '2024-01-15T08:30:00.000Z',
  verificationStatus: 'verified',
};

const seedPosts: UserPost[] = [
  {
    id: 'f-1',
    authorId: currentUserId,
    tab: 'feed',
    title: 'Gas leak detected - evacuate immediately',
    description: 'Strong smell near lane 3. Fire service has been informed.',
    datePosted: '2 hours ago',
    location: 'Motijheel',
    status: 'active',
  },
  {
    id: 'f-2',
    authorId: currentUserId,
    tab: 'feed',
    title: 'Community clean-up this Friday',
    description: 'Volunteers needed at 8am near the playground.',
    datePosted: '1 day ago',
    location: 'Motijheel Park',
    status: 'active',
  },
  {
    id: 'm-1',
    authorId: currentUserId,
    tab: 'marketplace',
    title: 'iPhone 12 - 128GB Blue',
    description: 'Excellent condition with charger and original box.',
    datePosted: '4 hours ago',
    location: 'Motijheel',
    status: 'active',
    imageUrl:
      'https://images.unsplash.com/photo-1605236453806-6ff36851218e?auto=format&fit=crop&w=480&q=80',
    price: '৳52,000',
    condition: 'Used - Like New',
    category: 'Electronics',
  },
  {
    id: 'm-2',
    authorId: currentUserId,
    tab: 'marketplace',
    title: 'Wooden study desk',
    description: 'Sturdy desk, minor scratches.',
    datePosted: '2 days ago',
    location: 'Shapla Chattar',
    status: 'active',
    imageUrl:
      'https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=480&q=80',
    price: '৳8,000',
    condition: 'Used - Good',
    category: 'Furniture',
  },
  {
    id: 'r-1',
    authorId: currentUserId,
    tab: 'rent',
    title: '2 bed apartment near Motijheel',
    description: 'Family-friendly unit, lift and generator available.',
    datePosted: '1 day ago',
    location: 'Motijheel Block B',
    status: 'active',
    imageUrl:
      'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=480&q=80',
    price: '৳28,000/month',
    bedrooms: 2,
  },
  {
    id: 'r-2',
    authorId: currentUserId,
    tab: 'rent',
    title: 'Single room sublet',
    description: 'Ideal for students, utility bills shared.',
    datePosted: '5 days ago',
    location: 'Motijheel Lane 4',
    status: 'expired',
    imageUrl:
      'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=480&q=80',
    price: '৳9,500/month',
    bedrooms: 1,
  },
  {
    id: 's-1',
    authorId: currentUserId,
    tab: 'services',
    title: 'Home plumbing support',
    description: 'Pipe leak repairs and quick emergency checks.',
    datePosted: '3 hours ago',
    location: 'Motijheel',
    status: 'active',
    category: 'Home Repair',
    priceRange: '৳500 - ৳2,500',
  },
  {
    id: 's-2',
    authorId: currentUserId,
    tab: 'services',
    title: 'Math tutor (Class 8-12)',
    description: 'Evening sessions available on weekdays.',
    datePosted: '3 days ago',
    location: 'Motijheel',
    status: 'active',
    category: 'Education',
    priceRange: '৳1,000 - ৳3,000',
  },
  {
    id: 'c-1',
    authorId: currentUserId,
    tab: 'complaints',
    title: 'Broken street light near block C',
    description: 'Street has remained dark for three nights.',
    datePosted: '9 hours ago',
    location: 'Motijheel Block C',
    status: 'pending',
    priority: 'medium',
  },
  {
    id: 'c-2',
    authorId: currentUserId,
    tab: 'complaints',
    title: 'Drain overflow after rain',
    description: 'Waterlogging making road unusable in evening.',
    datePosted: '2 days ago',
    location: 'Inner Road 7',
    status: 'active',
    priority: 'high',
  },
  {
    id: 'rp-1',
    authorId: currentUserId,
    tab: 'relief',
    title: 'Need food supplies for elderly neighbors',
    description: 'Requesting dry food packs for 3 families.',
    datePosted: '6 hours ago',
    location: 'Motijheel',
    status: 'open',
    reliefType: 'request',
  },
  {
    id: 'rp-2',
    authorId: currentUserId,
    tab: 'relief',
    title: 'Offering blankets and warm clothes',
    description: 'Can provide pickup from community center.',
    datePosted: '1 day ago',
    location: 'Community Center',
    status: 'open',
    reliefType: 'offer',
  },
  {
    id: 'f-3',
    authorId: currentUserId,
    tab: 'feed',
    title: 'Water line maintenance notice',
    description: 'Supply may be interrupted from 11pm to 4am.',
    datePosted: '5 hours ago',
    location: 'Ward 12',
    status: 'active',
  },
  {
    id: 'm-3',
    authorId: currentUserId,
    tab: 'marketplace',
    title: 'Bicycle for daily commute',
    description: 'Smooth ride, recently serviced.',
    datePosted: '7 days ago',
    location: 'Motijheel',
    status: 'expired',
    imageUrl:
      'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=480&q=80',
    price: '৳12,500',
    condition: 'Used',
    category: 'Sports',
  },
];

const allTabs: Array<{ key: AccountPostTab; label: string }> = [
  { key: 'feed', label: 'Feed Posts' },
  { key: 'marketplace', label: 'Marketplace Posts' },
  { key: 'rent', label: 'Rent Listings' },
  { key: 'services', label: 'Services' },
  { key: 'complaints', label: 'Complaints' },
  { key: 'relief', label: 'Relief Posts' },
];

export const useUserPosts = (): UserPostsResult => {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [activeTab, setActiveTab] = useState<AccountPostTab>('feed');
  const [postsState, setPostsState] = useState<UserPost[]>(seedPosts);
  const [loadedTabs, setLoadedTabs] = useState<Record<AccountPostTab, boolean>>({
    feed: false,
    marketplace: false,
    rent: false,
    services: false,
    complaints: false,
    relief: false,
  });
  const [loadingTab, setLoadingTab] = useState<AccountPostTab | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [visibleCounts, setVisibleCounts] = useState<Record<AccountPostTab, number>>({
    feed: PAGE_SIZE,
    marketplace: PAGE_SIZE,
    rent: PAGE_SIZE,
    services: PAGE_SIZE,
    complaints: PAGE_SIZE,
    relief: PAGE_SIZE,
  });

  const ownedPosts = useMemo(
    () => postsState.filter((post) => post.authorId === currentUserId),
    [postsState],
  );

  const postsByTab = useMemo(() => {
    return {
      feed: ownedPosts.filter((post) => post.tab === 'feed'),
      marketplace: ownedPosts.filter((post) => post.tab === 'marketplace'),
      rent: ownedPosts.filter((post) => post.tab === 'rent'),
      services: ownedPosts.filter((post) => post.tab === 'services'),
      complaints: ownedPosts.filter((post) => post.tab === 'complaints'),
      relief: ownedPosts.filter((post) => post.tab === 'relief'),
    };
  }, [ownedPosts]);

  const loadTab = useCallback((tab: AccountPostTab) => {
    if (loadedTabs[tab] || loadingTab === tab) {
      return;
    }

    setLoadingTab(tab);
    window.setTimeout(() => {
      setLoadedTabs((prev) => ({ ...prev, [tab]: true }));
      setLoadingTab((current) => (current === tab ? null : current));
    }, 450);
  }, [loadedTabs, loadingTab]);

  useEffect(() => {
    loadTab(activeTab);
  }, [activeTab, loadTab]);

  const totalCount = postsByTab[activeTab].length;
  const currentVisibleCount = visibleCounts[activeTab];
  const hasMore = totalCount > currentVisibleCount;
  const posts = loadedTabs[activeTab] ? postsByTab[activeTab].slice(0, currentVisibleCount) : [];

  const loadMore = useCallback(() => {
    setVisibleCounts((prev) => ({
      ...prev,
      [activeTab]: Math.min(prev[activeTab] + PAGE_SIZE, postsByTab[activeTab].length),
    }));
  }, [activeTab, postsByTab]);

  const stats = useMemo<FeedSummary>(() => {
    return {
      totalPosts: ownedPosts.length,
      marketplaceListings: postsByTab.marketplace.length,
      rentListings: postsByTab.rent.length,
      servicesOffered: postsByTab.services.length,
      complaintsSubmitted: postsByTab.complaints.length,
      reliefPosts: postsByTab.relief.length,
    };
  }, [ownedPosts.length, postsByTab]);

  const updateProfile = useCallback(async (payload: Partial<UserProfile>) => {
    setIsSavingProfile(true);

    await new Promise<void>((resolve) => {
      window.setTimeout(() => resolve(), 550);
    });

    setProfile((prev) => ({ ...prev, ...payload }));
    setIsSavingProfile(false);
  }, []);

  const updatePost = useCallback(async (
    tab: AccountPostTab,
    postId: string,
    payload: Partial<Pick<UserPost, 'title' | 'description' | 'location' | 'status'>>,
  ) => {
    const target = postsState.find((post) => post.id === postId);

    if (!target || target.authorId !== currentUserId || target.tab !== tab) {
      return;
    }

    await new Promise<void>((resolve) => {
      window.setTimeout(() => resolve(), 250);
    });

    setPostsState((prev) =>
      prev.map((post) => {
        if (post.id !== postId) {
          return post;
        }

        return {
          ...post,
          ...payload,
        };
      }),
    );
  }, [postsState]);

  const deletePost = useCallback(async (tab: AccountPostTab, postId: string) => {
    const target = postsState.find((post) => post.id === postId);

    if (!target || target.authorId !== currentUserId || target.tab !== tab) {
      return;
    }

    await new Promise<void>((resolve) => {
      window.setTimeout(() => resolve(), 200);
    });

    setPostsState((prev) => prev.filter((post) => post.id !== postId));
  }, [postsState]);

  return {
    profile,
    activeTab,
    posts,
    totalCount,
    hasMore,
    isLoading: loadingTab === activeTab,
    isSavingProfile,
    stats,
    pageSize: PAGE_SIZE,
    tabs: allTabs,
    setActiveTab,
    loadMore,
    updateProfile,
    updatePost,
    deletePost,
  };
};
