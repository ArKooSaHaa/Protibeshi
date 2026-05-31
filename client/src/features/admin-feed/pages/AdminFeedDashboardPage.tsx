import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { RefreshCw, ShieldCheck, Store } from 'lucide-react';
import { ActivityLogPanel } from '../components/ActivityLogPanel';
import { AdminBulkActionsBar } from '../components/AdminBulkActionsBar';
import { AdminFilterToolbar } from '../components/AdminFilterToolbar';
import { AdminStatsCards } from '../components/AdminStatsCards';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { FeedEmptyState } from '../components/FeedEmptyState';
import { FeedSkeletonList } from '../components/FeedSkeletonList';
import { FullPostModal } from '../components/FullPostModal';
import { PostModerationCard } from '../components/PostModerationCard';
import { ReportModal } from '../components/ReportModal';
import { ToastStack } from '../components/ToastStack';
import { useAdminFeedDashboard } from '../hooks/useAdminFeedDashboard';
import {
  fetchAdminRestaurants,
  updateAdminRestaurantStatus,
  type AdminRestaurantRecord,
} from '../services/adminRestaurantService';
import '../styles/AdminFeedDashboard.css';

const feedContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.08,
    },
  },
};

const feedItemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const formatSyncTime = (isoDate: string | null): string => {
  if (!isoDate) {
    return 'Not synced yet';
  }

  return new Date(isoDate).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const AdminFeedDashboardPage = () => {
  const dashboard = useAdminFeedDashboard();
  const syncLabel = formatSyncTime(dashboard.lastSyncedAt);
  const [restaurantMode, setRestaurantMode] = useState<'requests' | 'all'>('requests');
  const [isRestaurantPanelMinimized, setIsRestaurantPanelMinimized] = useState(false);
  const [restaurants, setRestaurants] = useState<AdminRestaurantRecord[]>([]);
  const [isRestaurantLoading, setIsRestaurantLoading] = useState(true);
  const [restaurantError, setRestaurantError] = useState<string | null>(null);
  const [updatingRestaurantId, setUpdatingRestaurantId] = useState<number | null>(null);

  const loadRestaurants = useCallback(async (mode: 'requests' | 'all') => {
    setIsRestaurantLoading(true);
    setRestaurantError(null);

    try {
      const items = await fetchAdminRestaurants(mode);
      setRestaurants(items);
    } catch (error) {
      setRestaurantError(
        error instanceof Error ? error.message : 'Could not load restaurant moderation queue.',
      );
      setRestaurants([]);
    } finally {
      setIsRestaurantLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRestaurants(restaurantMode);
  }, [loadRestaurants, restaurantMode]);

  const moderateRestaurant = useCallback(
    async (restaurantId: number, status: 'approved' | 'rejected') => {
      setUpdatingRestaurantId(restaurantId);
      setRestaurantError(null);

      try {
        const updated = await updateAdminRestaurantStatus(restaurantId, status);

        setRestaurants((previous) => {
          if (restaurantMode === 'requests' && status !== 'pending') {
            return previous.filter((item) => item.id !== restaurantId);
          }

          return previous.map((item) => (item.id === restaurantId ? updated : item));
        });
      } catch (error) {
        setRestaurantError(error instanceof Error ? error.message : 'Could not update restaurant status.');
      } finally {
        setUpdatingRestaurantId(null);
      }
    },
    [restaurantMode],
  );

  return (
    <motion.section
      className="afd-page"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <header className="afd-hero">
        <div className="afd-hero-copy">
          <p className="afd-kicker">Admin Moderation Console</p>
          <h1 className="afd-title">Feed Dashboard</h1>
          <p className="afd-subtitle">
            Verify new submissions, review reported content, and keep neighborhood updates trustworthy.
          </p>
        </div>

        <div className="afd-hero-actions">
          <span className="afd-sync-chip">Last Sync: {syncLabel}</span>
          <motion.button
            type="button"
            className={`afd-btn ${dashboard.reviewQueue === 'gemini-approved' ? 'afd-btn-primary' : 'afd-btn-neutral'} afd-ripple-btn`}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              if (dashboard.reviewQueue === 'gemini-approved') {
                dashboard.setReviewQueue('all');
                return;
              }

              dashboard.setReviewQueue('gemini-approved');
              dashboard.setActiveTab('verified');
            }}
          >
            <ShieldCheck size={14} />
            {dashboard.reviewQueue === 'gemini-approved' ? 'Showing Gemini Approved' : 'Gemini Approved'}
          </motion.button>
          <motion.button
            type="button"
            className="afd-btn afd-btn-neutral afd-ripple-btn"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={dashboard.refreshPosts}
            disabled={dashboard.isRefreshing}
          >
            <RefreshCw size={14} className={dashboard.isRefreshing ? 'afd-spin' : ''} />
            {dashboard.isRefreshing ? 'Refreshing...' : 'Refresh Feed'}
          </motion.button>
        </div>
      </header>

      <AdminStatsCards stats={dashboard.stats} />

      <AdminFilterToolbar
        activeTab={dashboard.activeTab}
        onTabChange={dashboard.setActiveTab}
      />

      <section className="afd-restaurant-panel">
        <div className="afd-restaurant-panel-header">
          <div>
            <p className="afd-kicker">Restaurant Moderation</p>
            <h2 className="afd-restaurant-panel-title">Review restaurant submissions</h2>
          </div>

          <div className="afd-restaurant-controls">
            <div className="afd-restaurant-toggle">
              <button
                type="button"
                className={`afd-restaurant-toggle-btn ${restaurantMode === 'requests' ? 'is-active' : ''}`}
                onClick={() => setRestaurantMode('requests')}
              >
                Restaurant Requests
              </button>
              <button
                type="button"
                className={`afd-restaurant-toggle-btn ${restaurantMode === 'all' ? 'is-active' : ''}`}
                onClick={() => setRestaurantMode('all')}
              >
                All Restaurants
              </button>
            </div>

            <button
              type="button"
              className="afd-restaurant-minimize-btn"
              aria-expanded={!isRestaurantPanelMinimized}
              onClick={() => setIsRestaurantPanelMinimized((previous) => !previous)}
            >
              {isRestaurantPanelMinimized ? 'Expand' : 'Minimize'}
            </button>
          </div>
        </div>

        {!isRestaurantPanelMinimized ? (
          <>
            {restaurantError ? <p className="afd-restaurant-error">{restaurantError}</p> : null}

            {isRestaurantLoading ? (
              <p className="afd-restaurant-empty">Loading restaurants...</p>
            ) : restaurants.length === 0 ? (
              <p className="afd-restaurant-empty">
                {restaurantMode === 'requests' ? 'No pending restaurant requests.' : 'No restaurants found.'}
              </p>
            ) : (
              <div className="afd-restaurant-list">
                {restaurants.slice(0, 10).map((restaurant) => (
                  <article key={restaurant.id} className="afd-restaurant-card">
                    <div className="afd-restaurant-main">
                      <div className="afd-restaurant-icon-wrap">
                        <Store size={16} />
                      </div>

                      <div className="afd-restaurant-copy">
                        <h3>{restaurant.name}</h3>
                        <p>
                          {restaurant.category} • {restaurant.location}
                        </p>
                        <span>
                          Status: <strong>{restaurant.status}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="afd-restaurant-actions">
                      <button
                        type="button"
                        className="afd-btn afd-btn-primary"
                        onClick={() => void moderateRestaurant(restaurant.id, 'approved')}
                        disabled={updatingRestaurantId === restaurant.id || restaurant.status === 'approved'}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="afd-btn afd-btn-danger"
                        onClick={() => void moderateRestaurant(restaurant.id, 'rejected')}
                        disabled={updatingRestaurantId === restaurant.id || restaurant.status === 'rejected'}
                      >
                        Reject
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        ) : null}
      </section>

      <AnimatePresence>
        {dashboard.selectedCount > 0 ? (
          <AdminBulkActionsBar
            selectedCount={dashboard.selectedCount}
            onVerifySelected={dashboard.bulkVerify}
            onMarkSafeSelected={dashboard.bulkMarkSafe}
            onDeleteSelected={dashboard.openDeleteModalForBulk}
            onClearSelection={dashboard.clearSelection}
          />
        ) : null}
      </AnimatePresence>

      {dashboard.loadingError ? <div className="afd-error-banner">{dashboard.loadingError}</div> : null}

      <div className="afd-content-grid">
        <div className="afd-feed-column">
          {dashboard.isLoading ? (
            <FeedSkeletonList />
          ) : dashboard.visiblePosts.length === 0 ? (
            <FeedEmptyState />
          ) : (
            <>
              <motion.div
                className="afd-feed-list"
                variants={feedContainerVariants}
                initial="hidden"
                animate="visible"
              >
                {dashboard.visiblePosts.map((post) => (
                  <motion.div key={post.id} variants={feedItemVariants}>
                    <PostModerationCard
                      post={post}
                      isSelected={dashboard.selectedPostIds.includes(post.id)}
                      onToggleSelect={dashboard.toggleSelectPost}
                      onVerifyPost={dashboard.verifyPost}
                      onRunGeminiReview={dashboard.runGeminiReview}
                      onAiRejectPost={dashboard.aiRejectPost}
                      onDeletePost={dashboard.openDeleteModalForPost}
                      onOpenReports={dashboard.openReportModal}
                      onOpenFullPost={dashboard.openFullPostModal}
                      onTogglePinned={dashboard.togglePinned}
                    />
                  </motion.div>
                ))}
              </motion.div>

              <div ref={dashboard.sentinelRef} className="afd-sentinel" aria-hidden="true" />

              {dashboard.isLazyLoading ? <FeedSkeletonList compact /> : null}

              {dashboard.hasMore ? (
                <motion.button
                  type="button"
                  className="afd-load-more-btn afd-ripple-btn"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={dashboard.loadMorePosts}
                >
                  Load more posts
                </motion.button>
              ) : (
                <p className="afd-end-label">
                  <ShieldCheck size={14} /> You have reviewed all posts matching this filter.
                </p>
              )}
            </>
          )}
        </div>

        <ActivityLogPanel items={dashboard.activityLog} />
      </div>

      <ReportModal
        post={dashboard.reportModalPost}
        isOpen={Boolean(dashboard.reportModalPost)}
        onClose={dashboard.closeReportModal}
        onDelete={dashboard.deleteFromReportModal}
        onIgnore={dashboard.ignoreReports}
        onMarkSafe={dashboard.markAsSafe}
      />

      <DeleteConfirmModal
        isOpen={dashboard.deleteModalOpen}
        previewPosts={dashboard.deletePreviewPosts}
        onClose={dashboard.closeDeleteModal}
        onConfirm={dashboard.confirmDelete}
      />

      <FullPostModal
        post={dashboard.fullPostModalPost}
        isOpen={Boolean(dashboard.fullPostModalPost)}
        onClose={dashboard.closeFullPostModal}
      />

      <ToastStack toasts={dashboard.toasts} onDismiss={dashboard.removeToast} />
    </motion.section>
  );
};
