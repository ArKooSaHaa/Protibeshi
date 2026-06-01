import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { broadcastFeedRefreshSignal, isFeedRefreshSignalKey } from '@/lib/feedRefresh';
import {
  deleteAdminFeedPost,
  fetchAdminFeedPostsWithQuery,
  ignoreAdminFeedReports,
  reviewAdminFeedPostWithGemini,
  verifyAdminFeedPost,
} from '../services/adminFeedService';
import type {
  AdminActivityItem,
  AdminDateFilter,
  AdminFeedPost,
  AdminFeedStats,
  AdminFilterTab,
  AdminPostStatus,
  AdminToast,
  ActivityTone,
  ToastTone,
} from '../types/adminFeed.types';

const INITIAL_VISIBLE_COUNT = 6;
const LAZY_LOAD_STEP = 4;
const LAZY_LOAD_DELAY_MS = 350;
const TOAST_DURATION_MS = 2600;

const statusPriority: Record<AdminPostStatus, number> = {
  reported: 3,
  pending: 2,
  verified: 1,
  rejected: 0,
};

const createId = (prefix: string): string => {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
};

const isInsideDateWindow = (createdAt: string, filter: AdminDateFilter): boolean => {
  if (filter === 'all') {
    return true;
  }

  const target = new Date(createdAt).getTime();
  if (!Number.isFinite(target)) {
    return false;
  }

  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;

  if (filter === '24h') {
    return now - target <= oneDayMs;
  }

  if (filter === '7d') {
    return now - target <= oneDayMs * 7;
  }

  return now - target <= oneDayMs * 30;
};

export const useAdminFeedDashboard = () => {
  const [posts, setPosts] = useState<AdminFeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<AdminFilterTab>('all');
  const [dateFilter, setDateFilter] = useState<AdminDateFilter>('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [reviewQueue, setReviewQueue] = useState<'all' | 'gemini'>('all');

  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);

  const [reportModalPostId, setReportModalPostId] = useState<string | null>(null);
  const [fullPostModalPostId, setFullPostModalPostId] = useState<string | null>(null);
  const [deleteTargetIds, setDeleteTargetIds] = useState<string[]>([]);

  const [toasts, setToasts] = useState<AdminToast[]>([]);
  const [activityLog, setActivityLog] = useState<AdminActivityItem[]>([]);

  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [isLazyLoading, setIsLazyLoading] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const toastTimeoutsRef = useRef<number[]>([]);
  const lazyLoadTimeoutRef = useRef<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const removeToast = useCallback((toastId: string) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== toastId));
  }, []);

  const pushToast = useCallback(
    (message: string, tone: ToastTone) => {
      const nextId = createId('toast');
      setToasts((previous) => [...previous, { id: nextId, message, tone }]);

      const timeoutId = window.setTimeout(() => {
        removeToast(nextId);
      }, TOAST_DURATION_MS);

      toastTimeoutsRef.current.push(timeoutId);
    },
    [removeToast],
  );

  const appendActivity = useCallback((message: string, tone: ActivityTone) => {
    setActivityLog((previous) => {
      const entry: AdminActivityItem = {
        id: createId('activity'),
        message,
        tone,
        created_at: new Date().toISOString(),
      };

      return [entry, ...previous].slice(0, 40);
    });
  }, []);

  const loadPosts = useCallback(
    async (showBlockingLoader: boolean) => {
      if (showBlockingLoader) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      setLoadingError(null);

      try {
        const response = await fetchAdminFeedPostsWithQuery({ queue: reviewQueue });
        setPosts(response);
        setSelectedPostIds([]);
        setReportModalPostId(null);
        setFullPostModalPostId(null);
        setDeleteTargetIds([]);
        setLastSyncedAt(new Date().toISOString());
        appendActivity(`Loaded ${response.length} posts into moderation queue.`, 'info');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not load feed posts. Please retry.';
        setLoadingError(message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [appendActivity, reviewQueue],
  );

  useEffect(() => {
    void loadPosts(true);
  }, [loadPosts]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (isFeedRefreshSignalKey(event.key)) {
        void loadPosts(false);
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [loadPosts]);

  useEffect(() => {
    const activeToastTimeouts = toastTimeoutsRef.current;
    const activeLazyTimeoutId = lazyLoadTimeoutRef.current;

    return () => {
      activeToastTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
      if (activeLazyTimeoutId !== null) {
        window.clearTimeout(activeLazyTimeoutId);
      }
    };
  }, []);

  const activePosts = useMemo(() => {
    return posts.filter((post) => !post.is_deleted);
  }, [posts]);

  const locationOptions = useMemo(() => {
    return Array.from(new Set(activePosts.map((post) => post.location))).sort((left, right) =>
      left.localeCompare(right),
    );
  }, [activePosts]);

  const filteredPosts = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    const filtered = activePosts.filter((post) => {
      const normalizedTitle = post.title?.toLowerCase() ?? '';
      const normalizedShortDescription = post.short_description?.toLowerCase() ?? '';

      const matchesSearch =
        normalizedSearch.length === 0
        || normalizedTitle.includes(normalizedSearch)
        || normalizedShortDescription.includes(normalizedSearch)
        || post.content.toLowerCase().includes(normalizedSearch)
        || post.user.name.toLowerCase().includes(normalizedSearch)
        || post.location.toLowerCase().includes(normalizedSearch);

      const matchesTab = activeTab === 'all' || post.status === activeTab;
      const matchesDate = isInsideDateWindow(post.created_at, dateFilter);
      const matchesLocation = locationFilter === 'all' || post.location === locationFilter;

      return matchesSearch && matchesTab && matchesDate && matchesLocation;
    });

    return filtered.sort((left, right) => {
      if (left.pinned !== right.pinned) {
        return left.pinned ? -1 : 1;
      }

      if (statusPriority[left.status] !== statusPriority[right.status]) {
        return statusPriority[right.status] - statusPriority[left.status];
      }

      return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
    });
  }, [activePosts, activeTab, dateFilter, locationFilter, searchQuery]);

  const stats = useMemo<AdminFeedStats>(() => {
    return {
      totalPosts: posts.filter((post) => !post.is_deleted).length,
      pendingPosts: posts.filter((post) => !post.is_deleted && post.status === 'pending').length,
      reportedPosts: posts.filter((post) => !post.is_deleted && post.status === 'reported').length,
      deletedPosts: posts.filter((post) => post.is_deleted).length,
    };
  }, [posts]);

  const selectedCount = selectedPostIds.length;

  const visiblePosts = useMemo(() => {
    return filteredPosts.slice(0, visibleCount);
  }, [filteredPosts, visibleCount]);

  const hasMore = visibleCount < filteredPosts.length;

  const allVisibleSelected = useMemo(() => {
    if (visiblePosts.length === 0) {
      return false;
    }

    return visiblePosts.every((post) => selectedPostIds.includes(post.id));
  }, [selectedPostIds, visiblePosts]);

  const reportModalPost = useMemo(() => {
    if (!reportModalPostId) {
      return null;
    }

    return posts.find((post) => post.id === reportModalPostId) ?? null;
  }, [posts, reportModalPostId]);

  const fullPostModalPost = useMemo(() => {
    if (!fullPostModalPostId) {
      return null;
    }

    return posts.find((post) => post.id === fullPostModalPostId) ?? null;
  }, [posts, fullPostModalPostId]);

  const deletePreviewPosts = useMemo(() => {
    if (deleteTargetIds.length === 0) {
      return [];
    }

    return posts.filter((post) => deleteTargetIds.includes(post.id));
  }, [deleteTargetIds, posts]);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [activeTab, dateFilter, locationFilter, searchQuery]);

  const loadMorePosts = useCallback(() => {
    if (!hasMore || isLazyLoading) {
      return;
    }

    setIsLazyLoading(true);
    lazyLoadTimeoutRef.current = window.setTimeout(() => {
      setVisibleCount((previous) => Math.min(previous + LAZY_LOAD_STEP, filteredPosts.length));
      setIsLazyLoading(false);
      lazyLoadTimeoutRef.current = null;
    }, LAZY_LOAD_DELAY_MS);
  }, [filteredPosts.length, hasMore, isLazyLoading]);

  useEffect(() => {
    const node = sentinelRef.current;

    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          loadMorePosts();
        }
      },
      { rootMargin: '180px 0px 180px 0px' },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [loadMorePosts, visiblePosts.length]);

  const verifyPost = useCallback(
    async (postId: string) => {
      try {
        const updatedPost = await verifyAdminFeedPost(postId);

          setPosts((previous) =>
            previous.map((post) => {
              if (post.id !== postId) {
                return post;
              }

              return updatedPost;
            }),
          );

        pushToast('Post Verified', 'success');
        appendActivity(`Verified post ${postId}.`, 'success');
        setLastSyncedAt(new Date().toISOString());
        if (updatedPost.status === 'verified') {
          broadcastFeedRefreshSignal();
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not verify post.';
        pushToast('Verification failed', 'danger');
        appendActivity(`Verification failed for post ${postId}.`, 'danger');
        setLoadingError(message);
      }
    },
    [appendActivity, pushToast],
  );

  const runGeminiReview = useCallback(
    async (postId: string) => {
      try {
        const reviewResult = await reviewAdminFeedPostWithGemini(postId);
        const updatedPost = reviewResult.post;
        const isSafe = Boolean(reviewResult.gemini_review?.allow);
        const verdictReason = reviewResult.gemini_review?.reason?.trim() || updatedPost.moderation_note || null;

        setPosts((previous) =>
          previous.map((post) => {
            if (post.id !== postId) {
              return post;
            }

            return updatedPost;
          }),
        );

        pushToast(
          isSafe ? 'All good' : 'Admin alert',
          isSafe ? 'success' : 'danger',
        );
        appendActivity(
          isSafe
            ? `Gemini reviewed post ${postId}: all good, no scam, hate, or threat speech detected.`
            : `Gemini flagged post ${postId}: ${verdictReason || 'possible scam, hate, or threat speech detected.'}`,
          isSafe ? 'success' : 'danger',
        );
        setLastSyncedAt(new Date().toISOString());
        if (updatedPost.status === 'verified') {
          broadcastFeedRefreshSignal();
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not run Gemini review.';
        pushToast('Gemini review failed', 'danger');
        appendActivity(`Gemini review failed for post ${postId}.`, 'danger');
        setLoadingError(message);
      }
    },
    [appendActivity, pushToast],
  );

  const aiRejectPost = useCallback(
    async (postId: string) => {
      try {
        const updatedPost = await (await import('../services/adminFeedService')).rejectAdminFeedPostWithAI(postId);

        setPosts((previous) =>
          previous.map((post) => {
            if (post.id !== postId) {
              return post;
            }

            return updatedPost;
          }),
        );

        pushToast('AI Review Complete', 'info');
        appendActivity(`AI reviewed post ${postId}.`, 'info');
        setLastSyncedAt(new Date().toISOString());
        if (updatedPost.status === 'verified') {
          broadcastFeedRefreshSignal();
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not run AI review.';
        pushToast('AI review failed', 'danger');
        appendActivity(`AI review failed for post ${postId}.`, 'danger');
        setLoadingError(message);
      }
    },
    [appendActivity, pushToast],
  );

  const toggleSelectPost = useCallback((postId: string) => {
    setSelectedPostIds((previous) => {
      if (previous.includes(postId)) {
        return previous.filter((item) => item !== postId);
      }

      return [...previous, postId];
    });
  }, []);

  const toggleSelectVisiblePosts = useCallback(() => {
    const visibleIds = visiblePosts.map((post) => post.id);

    setSelectedPostIds((previous) => {
      const allVisibleAlreadySelected = visibleIds.every((id) => previous.includes(id));

      if (allVisibleAlreadySelected) {
        return previous.filter((id) => !visibleIds.includes(id));
      }

      const merged = new Set(previous);
      visibleIds.forEach((id) => merged.add(id));
      return Array.from(merged);
    });
  }, [visiblePosts]);

  const clearSelection = useCallback(() => {
    setSelectedPostIds([]);
  }, []);

  const openDeleteModalForPost = useCallback((postId: string) => {
    setDeleteTargetIds([postId]);
  }, []);

  const openDeleteModalForBulk = useCallback(() => {
    if (selectedPostIds.length === 0) {
      return;
    }

    setDeleteTargetIds(selectedPostIds);
  }, [selectedPostIds]);

  const closeDeleteModal = useCallback(() => {
    setDeleteTargetIds([]);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (deleteTargetIds.length === 0) {
      return;
    }

    try {
      const deletedPosts = await Promise.all(deleteTargetIds.map((postId) => deleteAdminFeedPost(postId)));
      const deletedMap = new Map(deletedPosts.map((post) => [post.id, post]));

      setPosts((previous) =>
        previous.map((post) => {
          const deletedPost = deletedMap.get(post.id);
          return deletedPost || post;
        }),
      );

      setSelectedPostIds((previous) => previous.filter((id) => !deleteTargetIds.includes(id)));

      if (reportModalPostId && deleteTargetIds.includes(reportModalPostId)) {
        setReportModalPostId(null);
      }

      if (fullPostModalPostId && deleteTargetIds.includes(fullPostModalPostId)) {
        setFullPostModalPostId(null);
      }

      const deletedCount = deleteTargetIds.length;

      pushToast('Post Deleted', 'danger');
      appendActivity(
        deletedCount === 1
          ? `Deleted post ${deleteTargetIds[0]}.`
          : `Deleted ${deletedCount} posts via bulk moderation.`,
        'danger',
      );

      setDeleteTargetIds([]);
      setLastSyncedAt(new Date().toISOString());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not delete posts.';
      pushToast('Delete failed', 'danger');
      appendActivity('Delete action failed for selected posts.', 'danger');
      setLoadingError(message);
    }
  }, [appendActivity, deleteTargetIds, fullPostModalPostId, pushToast, reportModalPostId]);

  const openReportModal = useCallback((postId: string) => {
    setReportModalPostId(postId);
  }, []);

  const closeReportModal = useCallback(() => {
    setReportModalPostId(null);
  }, []);

  const ignoreReports = useCallback(
    async (postId: string) => {
      try {
        const updatedPost = await ignoreAdminFeedReports(postId);

        setPosts((previous) =>
          previous.map((post) => {
            if (post.id !== postId) {
              return post;
            }

            return updatedPost;
          }),
        );

        setReportModalPostId(null);
        pushToast('Reports Ignored', 'info');
        appendActivity(`Ignored reports for post ${postId}.`, 'warning');
        setLastSyncedAt(new Date().toISOString());
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not ignore reports.';
        pushToast('Ignore failed', 'danger');
        appendActivity(`Ignoring reports failed for post ${postId}.`, 'danger');
        setLoadingError(message);
      }
    },
    [appendActivity, pushToast],
  );

  const markAsSafe = useCallback(
    (postId: string) => {
      void verifyPost(postId);
      setReportModalPostId(null);
      appendActivity(`Requested verification for post ${postId}.`, 'info');
    },
    [appendActivity, verifyPost],
  );

  const deleteFromReportModal = useCallback((postId: string) => {
    setReportModalPostId(null);
    setDeleteTargetIds([postId]);
  }, []);

  const openFullPostModal = useCallback((postId: string) => {
    setFullPostModalPostId(postId);
  }, []);

  const closeFullPostModal = useCallback(() => {
    setFullPostModalPostId(null);
  }, []);

  const togglePinned = useCallback(
    (postId: string) => {
      const target = posts.find((post) => post.id === postId);
      if (!target) {
        return;
      }

      setPosts((previous) =>
        previous.map((post) => {
          if (post.id !== postId) {
            return post;
          }

          return {
            ...post,
            pinned: !post.pinned,
          };
        }),
      );

      appendActivity(
        target.pinned ? `Unpinned post ${postId} from priority lane.` : `Pinned post ${postId} for priority review.`,
        'info',
      );
      setLastSyncedAt(new Date().toISOString());
    },
    [appendActivity, posts],
  );

  const bulkVerify = useCallback(async () => {
    if (selectedPostIds.length === 0) {
      return;
    }

    try {
      const verifiedPosts = await Promise.all(selectedPostIds.map((postId) => verifyAdminFeedPost(postId)));

      const verifiedMap = new Map(verifiedPosts.map((post) => [post.id, post]));

      setPosts((previous) =>
        previous.map((post) => {
          const verifiedPost = verifiedMap.get(post.id);
          return verifiedPost || post;
        }),
      );

      appendActivity(`Bulk verified ${selectedPostIds.length} selected posts.`, 'success');
      pushToast('Post Verified', 'success');
      // Broadcast feed refresh if any of the verified posts became visible
      const anyNowVisible = verifiedPosts.some((p) => (p as any).moderation_status === 'verified' || (p as any).status === 'verified');
      if (anyNowVisible) {
        broadcastFeedRefreshSignal();
      }
      setSelectedPostIds([]);
      setLastSyncedAt(new Date().toISOString());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not bulk verify posts.';
      pushToast('Bulk verify failed', 'danger');
      appendActivity('Bulk verification failed for selected posts.', 'danger');
      setLoadingError(message);
    }
  }, [appendActivity, pushToast, selectedPostIds]);

  const bulkMarkSafe = useCallback(() => {
    void bulkVerify();
  }, [bulkVerify]);

  const exportReports = useCallback(() => {
    const reportedCount = posts.filter((post) => !post.is_deleted && post.status === 'reported').length;
    appendActivity(`Exported moderation summary with ${reportedCount} reported posts.`, 'info');
    pushToast('Report exported (UI only)', 'info');
  }, [appendActivity, posts, pushToast]);

  const refreshPosts = useCallback(() => {
    void loadPosts(false);
  }, [loadPosts]);

  return {
    isLoading,
    isRefreshing,
    loadingError,
    posts,
    stats,
    searchQuery,
    activeTab,
    dateFilter,
    locationFilter,
    locationOptions,
    selectedPostIds,
    selectedCount,
    allVisibleSelected,
    filteredPosts,
    visiblePosts,
    hasMore,
    isLazyLoading,
    sentinelRef,
    reportModalPost,
    fullPostModalPost,
    deletePreviewPosts,
    deleteModalOpen: deleteTargetIds.length > 0,
    toasts,
    activityLog,
    lastSyncedAt,
    setSearchQuery,
    setActiveTab,
    setDateFilter,
    setLocationFilter,
    reviewQueue,
    setReviewQueue,
    removeToast,
    loadMorePosts,
    refreshPosts,
    verifyPost,
    openDeleteModalForPost,
    openDeleteModalForBulk,
    closeDeleteModal,
    confirmDelete,
    openReportModal,
    closeReportModal,
    ignoreReports,
    markAsSafe,
    deleteFromReportModal,
    openFullPostModal,
    closeFullPostModal,
    togglePinned,
    runGeminiReview,
    toggleSelectPost,
    toggleSelectVisiblePosts,
    clearSelection,
    bulkVerify,
    bulkMarkSafe,
    exportReports,
    aiRejectPost,
  };
};
