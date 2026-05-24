import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { deletePost as deleteFeedPost, getMyPosts, type FeedPost } from '@/api/feedApi';
import { deleteRelief, getReliefs } from '@/api/relief';
import { deleteListing, getListings } from '@/services/listingService';
import { deleteRentListing, getRentListings } from '@/services/rentService';
import { deleteService, getServices } from '@/services/serviceService';
import { deleteComplaint, getComplaints } from '@/services/complaintService';
import { getStoredToken } from '@/features/auth/utils/tokenStorage';
import {
  fetchAccountProfile,
  getAccountErrorMessage,
  updateAccountProfile,
  type AccountProfileApi,
} from '../services/accountService';

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
  fullAddress: string;
  avatarUrl: string;
  bio: string;
  createdAt: string;
  emailVerified: boolean;
  verificationStatus: 'verified' | 'unverified';
  isBanned: boolean;
  bannedAt: string;
  bannedUntil: string;
  bannedReason: string;
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
  isPendingModeration?: boolean;
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
  isProfileLoading: boolean;
  isSavingProfile: boolean;
  profileError: string | null;
  stats: FeedSummary;
  pageSize: number;
  tabs: Array<{ key: AccountPostTab; label: string }>;
  setActiveTab: (tab: AccountPostTab) => void;
  loadMore: () => void;
  refreshProfile: () => Promise<void>;
  updateProfile: (payload: Partial<UserProfile>) => Promise<void>;
  updatePost: (
    tab: AccountPostTab,
    postId: string,
    payload: Partial<Pick<UserPost, 'title' | 'description' | 'location' | 'status'>>,
  ) => Promise<void>;
  deletePost: (tab: AccountPostTab, postId: string) => Promise<void>;
}

const PAGE_SIZE = 6;

const initialProfile: UserProfile = {
  id: '',
  fullName: '',
  username: '',
  email: '',
  phone: '',
  city: '',
  neighborhood: '',
  fullAddress: '',
  avatarUrl: '',
  bio: '',
  createdAt: '',
  emailVerified: false,
  verificationStatus: 'unverified',
  isBanned: false,
  bannedAt: '',
  bannedUntil: '',
  bannedReason: '',
};

const allTabs: Array<{ key: AccountPostTab; label: string }> = [
  { key: 'feed', label: 'Feed Posts' },
  { key: 'marketplace', label: 'Marketplace Posts' },
  { key: 'rent', label: 'Rent Listings' },
  { key: 'services', label: 'Services' },
  { key: 'complaints', label: 'Complaints' },
  { key: 'relief', label: 'Relief Posts' },
];

const mapAccountProfile = (profile: AccountProfileApi): UserProfile => ({
  id: String(profile.id),
  fullName: profile.full_name || [profile.first_name, profile.last_name].filter(Boolean).join(' '),
  username: profile.username || '',
  email: profile.email || '',
  phone: profile.phone || '',
  city: profile.city || '',
  neighborhood: profile.neighborhood || '',
  fullAddress: profile.full_address || '',
  avatarUrl: profile.profile_picture_url || '',
  bio: profile.bio || '',
  createdAt: profile.created_at || '',
  emailVerified: Boolean(profile.email_verified),
  verificationStatus: profile.verification_status === 'verified' ? 'verified' : 'unverified',
  isBanned: Boolean(profile.is_banned),
  bannedAt: profile.banned_at || '',
  bannedUntil: profile.banned_until || '',
  bannedReason: profile.banned_reason || '',
});

const formatDatePosted = (rawDate: unknown): string => {
  if (typeof rawDate !== 'string' || !rawDate) {
    return 'Recently';
  }

  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) {
    return 'Recently';
  }

  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const toNumberId = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : -1;
};

const looksLikeReliefPost = (post: FeedPost): boolean => {
  const label = (post.label ?? '').toLowerCase();
  const type = (post.post_type ?? '').toLowerCase();

  return label.includes('relief')
    || label.includes('help needed')
    || type.includes('relief');
};

const parsePostIdentifier = (postId: string): { prefix: string | null; sourceId: string } => {
  const normalizedId = typeof postId === 'string' ? postId.trim() : '';
  const separatorIndex = normalizedId.indexOf('-');

  if (separatorIndex <= 0 || separatorIndex >= normalizedId.length - 1) {
    return {
      prefix: null,
      sourceId: normalizedId,
    };
  }

  return {
    prefix: normalizedId.slice(0, separatorIndex),
    sourceId: normalizedId.slice(separatorIndex + 1),
  };
};

const mapReliefStatusToPostStatus = (status: unknown): PostStatus => {
  const normalizedStatus = String(status || '').toLowerCase();

  if (normalizedStatus === 'completed' || normalizedStatus === 'closed') {
    return 'expired';
  }

  if (normalizedStatus === 'assigned' || normalizedStatus === 'in_progress') {
    return 'active';
  }

  return 'open';
};

export const useUserPosts = (): UserPostsResult => {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [activeTab, setActiveTab] = useState<AccountPostTab>('feed');
  const [postsState, setPostsState] = useState<UserPost[]>([]);
  const [loadedTabs, setLoadedTabs] = useState<Record<AccountPostTab, boolean>>({
    feed: true,
    marketplace: true,
    rent: true,
    services: true,
    complaints: true,
    relief: true,
  });
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [visibleCounts, setVisibleCounts] = useState<Record<AccountPostTab, number>>({
    feed: PAGE_SIZE,
    marketplace: PAGE_SIZE,
    rent: PAGE_SIZE,
    services: PAGE_SIZE,
    complaints: PAGE_SIZE,
    relief: PAGE_SIZE,
  });

  const ownedPosts = useMemo(
    () => postsState.filter((post) => post.authorId === profile.id),
    [postsState, profile.id],
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

  const loadPosts = useCallback(async (profileId: string) => {
    const currentUserId = toNumberId(profileId);

    if (currentUserId < 0) {
      setPostsState([]);
      return;
    }

    setIsLoadingPosts(true);

    const [feedResult, listingsResult, rentResult, servicesResult, complaintsResult, reliefResult] = await Promise.allSettled([
      getMyPosts(),
      getListings(),
      getRentListings(),
      getServices(),
      getComplaints(),
      getReliefs(),
    ]);

    const mapped: UserPost[] = [];

    if (feedResult.status === 'fulfilled') {
      const ownFeed = feedResult.value.filter((post) => toNumberId(post?.user?.id) === currentUserId);

      ownFeed.forEach((post) => {
        const isRelief = looksLikeReliefPost(post);
        const moderationStatus = String(post.moderation_status || 'verified').toLowerCase();
        const isPendingModeration = moderationStatus === 'pending';

        mapped.push({
          id: `feed-${post.id}`,
          authorId: profileId,
          tab: isRelief ? 'relief' : 'feed',
          title: post.title || 'Untitled post',
          description: post.short_description || post.content || '',
          datePosted: formatDatePosted(post.created_at),
          location: post.location || 'Not specified',
          status: isPendingModeration ? 'pending' : (isRelief ? 'open' : 'active'),
          reliefType: isRelief ? 'request' : undefined,
          isPendingModeration,
        });
      });
    }

    if (listingsResult.status === 'fulfilled') {
      const ownListings = listingsResult.value.filter((item: any) => toNumberId(item?.user?.id) === currentUserId);

      ownListings.forEach((item: any) => {
        mapped.push({
          id: `marketplace-${item.id}`,
          authorId: profileId,
          tab: 'marketplace',
          title: item.title || 'Untitled listing',
          description: item.details || '',
          datePosted: formatDatePosted(item.created_at),
          location: item.location || 'Not specified',
          status: item.is_active === false ? 'expired' : 'active',
          imageUrl: item.photo_url || undefined,
          price: typeof item.price === 'number' ? `৳${item.price}` : String(item.price || 'N/A'),
          category: item.category || '',
        });
      });
    }

    if (rentResult.status === 'fulfilled') {
      const ownRent = rentResult.value.filter((item: any) => toNumberId(item?.user?.id) === currentUserId);

      ownRent.forEach((item: any) => {
        mapped.push({
          id: `rent-${item.id}`,
          authorId: profileId,
          tab: 'rent',
          title: item.title || 'Untitled rent listing',
          description: item.type || 'Rent listing',
          datePosted: formatDatePosted(item.created_at),
          location: item.location || 'Not specified',
          status: 'active',
          imageUrl: item.image || undefined,
          bedrooms: Number.isFinite(Number(item.beds)) ? Number(item.beds) : undefined,
          price: typeof item.price === 'number' ? `৳${item.price}/month` : String(item.price || 'N/A'),
        });
      });
    }

    if (servicesResult.status === 'fulfilled') {
      const ownServices = servicesResult.value.filter((item: any) => toNumberId(item?.ownerId) === currentUserId);

      ownServices.forEach((item: any) => {
        mapped.push({
          id: `service-${item.id}`,
          authorId: profileId,
          tab: 'services',
          title: item.title || 'Untitled service',
          description: item.shortDescription || item.fullDescription || '',
          datePosted: formatDatePosted(item.createdAt ? new Date(item.createdAt).toISOString() : ''),
          location: item.location || 'Not specified',
          status: 'active',
          category: item.category || '',
          priceRange: typeof item.price === 'number' ? `৳${item.price}` : String(item.price || 'N/A'),
        });
      });
    }

    if (complaintsResult.status === 'fulfilled') {
      const payload = complaintsResult.value;
      const complaintList = Array.isArray(payload)
        ? payload
        : (Array.isArray((payload as any)?.complaints) ? (payload as any).complaints : []);

      const ownComplaints = complaintList.filter((item: any) => toNumberId(item?.user?.id) === currentUserId);

      ownComplaints.forEach((item: any) => {
        const status = String(item.status || '').toLowerCase() === 'pending' ? 'pending' : 'active';

        mapped.push({
          id: `complaint-${item.id}`,
          authorId: profileId,
          tab: 'complaints',
          title: item.title || 'Untitled complaint',
          description: item.description || '',
          datePosted: formatDatePosted(item.created_at),
          location: item.location || 'Not specified',
          status,
          priority: item.priority || undefined,
        });
      });
    }

    if (reliefResult.status === 'fulfilled') {
      const ownReliefs = reliefResult.value.filter(
        (item) => toNumberId(item?.user?.id ?? item?.user_id) === currentUserId,
      );

      ownReliefs.forEach((item) => {
        mapped.push({
          id: `relief-${item.id}`,
          authorId: profileId,
          tab: 'relief',
          title: item.title || 'Untitled relief request',
          description: item.description || '',
          datePosted: formatDatePosted(item.created_at),
          location: item.location || 'Not specified',
          status: mapReliefStatusToPostStatus(item.status),
          reliefType: 'request',
        });
      });
    }

    mapped.sort((a, b) => {
      const aTime = Date.parse(a.datePosted);
      const bTime = Date.parse(b.datePosted);

      if (Number.isNaN(aTime) || Number.isNaN(bTime)) {
        return 0;
      }

      return bTime - aTime;
    });

    setPostsState(mapped);
    setLoadedTabs({
      feed: true,
      marketplace: true,
      rent: true,
      services: true,
      complaints: true,
      relief: true,
    });
    setIsLoadingPosts(false);
  }, []);

  const loadProfile = useCallback(async () => {
    setIsProfileLoading(true);
    setProfileError(null);

    try {
      const nextProfile = await fetchAccountProfile();
      const mappedProfile = mapAccountProfile(nextProfile);

      setProfile(mappedProfile);
      await loadPosts(mappedProfile.id);
    } catch (error: unknown) {
      const message = getAccountErrorMessage(error, 'Unable to load your account details right now.');
      setProfileError(message);
    } finally {
      setIsProfileLoading(false);
    }
  }, [loadPosts]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

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
      totalPosts: postsByTab.feed.length,
      marketplaceListings: postsByTab.marketplace.length,
      rentListings: postsByTab.rent.length,
      servicesOffered: postsByTab.services.length,
      complaintsSubmitted: postsByTab.complaints.length,
      reliefPosts: postsByTab.relief.length,
    };
  }, [postsByTab]);

  const updateProfile = useCallback(async (payload: Partial<UserProfile>) => {
    setIsSavingProfile(true);

    try {
      const updatedProfile = await updateAccountProfile({
        ...(payload.fullName !== undefined ? { full_name: payload.fullName.trim() } : {}),
        ...(payload.username !== undefined ? { username: payload.username.trim() } : {}),
        ...(payload.phone !== undefined ? { phone: payload.phone.trim() } : {}),
        ...(payload.city !== undefined ? { city: payload.city.trim() } : {}),
        ...(payload.neighborhood !== undefined ? { neighborhood: payload.neighborhood.trim() } : {}),
        ...(payload.fullAddress !== undefined ? { full_address: payload.fullAddress.trim() } : {}),
        ...(payload.bio !== undefined ? { bio: payload.bio.trim() } : {}),
        ...(payload.avatarUrl !== undefined ? { profile_picture: payload.avatarUrl.trim() } : {}),
      });

      setProfile(mapAccountProfile(updatedProfile));
      setProfileError(null);
      toast.success('Profile updated successfully.');
    } catch (error: unknown) {
      const message = getAccountErrorMessage(error, 'Unable to save your profile right now.');
      toast.error(message);
      throw error;
    } finally {
      setIsSavingProfile(false);
    }
  }, []);

  const updatePost = useCallback(async (
    tab: AccountPostTab,
    postId: string,
    payload: Partial<Pick<UserPost, 'title' | 'description' | 'location' | 'status'>>,
  ) => {
    const target = postsState.find((post) => post.id === postId);

    if (!target || target.authorId !== profile.id || target.tab !== tab) {
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
  }, [postsState, profile.id]);

  const deletePost = useCallback(async (tab: AccountPostTab, postId: string) => {
    const target = postsState.find((post) => post.id === postId);

    if (!target || target.authorId !== profile.id || target.tab !== tab) {
      return;
    }

    const { prefix, sourceId } = parsePostIdentifier(postId);

    if (!sourceId) {
      toast.error('Invalid post selected for deletion.');
      return;
    }

    const requireToken = () => {
      const token = getStoredToken();

      if (!token) {
        throw new Error('Your session has expired. Please sign in again.');
      }

      return token;
    };

    try {
      if (tab === 'feed') {
        await deleteFeedPost(sourceId);
      } else if (tab === 'marketplace') {
        await deleteListing(sourceId, requireToken());
      } else if (tab === 'rent') {
        await deleteRentListing(sourceId, requireToken());
      } else if (tab === 'services') {
        await deleteService(sourceId, requireToken());
      } else if (tab === 'complaints') {
        const complaintId = Number(sourceId);

        if (!Number.isFinite(complaintId) || complaintId <= 0) {
          throw new Error('Invalid complaint selected for deletion.');
        }

        await deleteComplaint(complaintId, requireToken());
      } else {
        if (prefix === 'relief') {
          await deleteRelief(sourceId);
        } else {
          await deleteFeedPost(sourceId);
        }
      }

      setPostsState((prev) => prev.filter((post) => post.id !== postId));
      toast.success('Post deleted successfully.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete post.';
      toast.error(message);
      throw error;
    }
  }, [postsState, profile.id]);

  return {
    profile,
    activeTab,
    posts,
    totalCount,
    hasMore,
    isLoading: isLoadingPosts,
    isProfileLoading,
    isSavingProfile,
    profileError,
    stats,
    pageSize: PAGE_SIZE,
    tabs: allTabs,
    setActiveTab,
    loadMore,
    refreshProfile: loadProfile,
    updateProfile,
    updatePost,
    deletePost,
  };
};
