import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { RefreshCw, ShieldCheck } from 'lucide-react';
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
        searchQuery={dashboard.searchQuery}
        activeTab={dashboard.activeTab}
        dateFilter={dashboard.dateFilter}
        locationFilter={dashboard.locationFilter}
        locationOptions={dashboard.locationOptions}
        filteredCount={dashboard.filteredPosts.length}
        allVisibleSelected={dashboard.allVisibleSelected}
        onSearchChange={dashboard.setSearchQuery}
        onTabChange={dashboard.setActiveTab}
        onDateFilterChange={dashboard.setDateFilter}
        onLocationFilterChange={dashboard.setLocationFilter}
        onToggleSelectVisible={dashboard.toggleSelectVisiblePosts}
        onExportReports={dashboard.exportReports}
      />

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
                      onDeletePost={dashboard.openDeleteModalForPost}
                      onOpenReports={dashboard.openReportModal}
                      onOpenFullPost={dashboard.openFullPostModal}
                      onTogglePinned={dashboard.togglePinned}
                      onUpdateNote={dashboard.updateAdminNote}
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
