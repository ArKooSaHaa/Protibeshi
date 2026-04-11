import { motion } from 'framer-motion';
import { AlertTriangle, Flag, ShoppingBag, UserRound } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BulkActionBar } from '../components/BulkActionBar';
import { AdminListingCard } from '../components/AdminListingCard';
import { AdminListingModal } from '../components/AdminListingModal';
import { ConfirmActionModal } from '../components/ConfirmActionModal';
import { ListingSkeletonGrid } from '../components/ListingSkeletonGrid';
import { NotificationBell } from '../components/NotificationBell';
import type {
  AdminListingReport,
  AdminMarketplaceListing,
  AdminMarketplaceSort,
  AdminMarketplaceStats,
  AdminMarketplaceTab,
  AdminReportReason,
  AdminReportSeverity,
  ConfirmActionState,
} from '../types/adminMarketplace.types';
import { ROUTES } from '@/config/routes.config';
import { useAuthStore } from '@/features/auth/store/authStore';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { banListingSeller, deleteAdminListing, getAdminListings } from '@/services/listingService';
import '../styles/AdminMarketplaceModerationPage.css';

type ApiAdminReporter = {
  id?: number | string;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
};

type ApiAdminReport = {
  id?: number | string;
  reason?: string | null;
  message?: string | null;
  severity?: string | null;
  created_at?: string | null;
  reporter?: ApiAdminReporter | null;
};

type ApiAdminSeller = {
  id?: number | string;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  email?: string | null;
  profile_picture?: string | null;
  profile_picture_url?: string | null;
  created_at?: string | null;
  is_banned?: boolean;
  total_active_listings?: number | string | null;
  total_listings?: number | string | null;
  warning_count?: number | string | null;
};

type ApiAdminListing = {
  id?: number | string;
  title?: string | null;
  price?: number | string | null;
  category?: string | null;
  location?: string | null;
  details?: string | null;
  photo?: string | null;
  photo_url?: string | null;
  is_active?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  status?: string | null;
  report_count?: number | string | null;
  reports?: ApiAdminReport[];
  seller?: ApiAdminSeller | null;
  user?: ApiAdminSeller | null;
};

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1511556820780-d912e42b4980?auto=format&fit=crop&w=1200&q=80',
];

const tabLabels: Record<AdminMarketplaceTab, string> = {
  all: 'All Listings',
  reported: 'Reported Listings',
};

const createId = (prefix: string): string => {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
};

const toSafeNumber = (value: number | string | null | undefined): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeText = (value: string | null | undefined): string => {
  return typeof value === 'string' ? value.trim() : '';
};

const slugify = (value: string): string => {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
};

const buildPhotoUrl = (listing: ApiAdminListing, seed: number): string => {
  const photoUrl = normalizeText(listing.photo_url ?? null);
  const photoPath = normalizeText(listing.photo ?? null);

  const resolvedPhotoUrl = resolveMediaUrl(photoUrl) || resolveMediaUrl(photoPath);
  if (resolvedPhotoUrl) {
    return resolvedPhotoUrl;
  }

  return FALLBACK_IMAGES[seed % FALLBACK_IMAGES.length];
};

const resolveSellerName = (user: ApiAdminSeller | null | undefined): string => {
  if (!user) {
    return 'Unknown Seller';
  }

  const firstName = normalizeText(user.first_name ?? null);
  const lastName = normalizeText(user.last_name ?? null);
  const fullName = `${firstName} ${lastName}`.trim();

  if (fullName) {
    return fullName;
  }

  const username = normalizeText(user.username ?? null);
  if (username) {
    return username;
  }

  const email = normalizeText(user.email ?? null);
  if (email) {
    return email;
  }

  return 'Unknown Seller';
};

const normalizeReportReason = (value: string): AdminReportReason => {
  const normalized = value.toLowerCase();

  if (normalized.includes('fraud') || normalized.includes('scam') || normalized.includes('fake')) {
    return 'Fraud';
  }

  if (normalized.includes('spam')) {
    return 'Spam';
  }

  if (normalized.includes('mislead')) {
    return 'Misleading';
  }

  return 'Inappropriate';
};

const normalizeReportSeverity = (value: string, reason: AdminReportReason): AdminReportSeverity => {
  const normalized = value.toLowerCase();

  if (normalized === 'high' || normalized === 'medium' || normalized === 'low') {
    return normalized;
  }

  if (reason === 'Fraud') {
    return 'high';
  }

  if (reason === 'Misleading') {
    return 'medium';
  }

  return 'low';
};

const buildReportMessage = (reason: AdminReportReason, message: string): string => {
  if (message) {
    return message;
  }

  if (reason === 'Fraud') {
    return 'Suspicious listing activity detected by community reports.';
  }

  if (reason === 'Spam') {
    return 'Repeated posting pattern reported by neighbors.';
  }

  if (reason === 'Misleading') {
    return 'Listing details may not match the provided images or price.';
  }

  return 'Contains content that may violate community guidelines.';
};

const resolveReporterName = (reporter: ApiAdminReporter | null | undefined): string => {
  if (!reporter) {
    return 'Community member';
  }

  const explicitName = normalizeText(reporter.name ?? null);
  if (explicitName) {
    return explicitName;
  }

  const firstName = normalizeText(reporter.first_name ?? null);
  const lastName = normalizeText(reporter.last_name ?? null);
  const fullName = `${firstName} ${lastName}`.trim();

  if (fullName) {
    return fullName;
  }

  const username = normalizeText(reporter.username ?? null);
  if (username) {
    return username;
  }

  return 'Community member';
};

const mapReportToAdminRecord = (report: ApiAdminReport): AdminListingReport => {
  const reasonText = normalizeText(report.reason ?? report.message ?? null);
  const reason = normalizeReportReason(reasonText);
  const severity = normalizeReportSeverity(normalizeText(report.severity ?? null), reason);
  const message = buildReportMessage(reason, normalizeText(report.message ?? null));

  return {
    id: String(report.id ?? createId('report')),
    reporterName: resolveReporterName(report.reporter),
    reason,
    severity,
    message,
    createdAt: normalizeText(report.created_at ?? null) || new Date().toISOString(),
  };
};

const mapListingToAdminRecord = (listing: ApiAdminListing, index: number): AdminMarketplaceListing => {
  const seed = toSafeNumber(listing.id) || index + 1;
  const seller = listing.seller ?? listing.user ?? null;

  const reports = Array.isArray(listing.reports)
    ? listing.reports.map((report) => mapReportToAdminRecord((report || {}) as ApiAdminReport))
    : [];

  const reportCount = Math.max(0, toSafeNumber(listing.report_count ?? reports.length));
  const status: AdminMarketplaceListing['status'] = reportCount > 0 ? 'reported' : 'active';

  const sellerName = resolveSellerName(seller);
  const title = normalizeText(listing.title ?? null) || `Listing #${seed}`;
  const description =
    normalizeText(listing.details ?? null)
      || `${title} is available in ${normalizeText(listing.location ?? null) || 'your area'}.`;
  const category = normalizeText(listing.category ?? null) || 'Other';
  const location = normalizeText(listing.location ?? null) || 'Unknown location';

  const suspiciousKeywords = /(urgent|guaranteed|instant|wire transfer|limited offer)/i;
  const aiTag = suspiciousKeywords.test(`${title} ${description}`) || reports.some((report) => report.severity === 'high')
    ? 'potential_spam'
    : null;

  const sellerId = String(seller?.id ?? `seller-${seed}`);
  const sellerJoinDate =
    normalizeText(seller?.created_at ?? null)
      || new Date(Date.now() - (seed % 900 + 45) * 86_400_000).toISOString();

  const username = normalizeText(seller?.username ?? null) || slugify(sellerName);

  return {
    id: String(listing.id ?? `listing-${seed}`),
    title,
    price: Math.max(0, toSafeNumber(listing.price)),
    location,
    category,
    description,
    image: buildPhotoUrl(listing, seed),
    status,
    reportCount,
    reports,
    createdAt: normalizeText(listing.created_at ?? null) || new Date().toISOString(),
    updatedAt: normalizeText(listing.updated_at ?? null) || new Date().toISOString(),
    seller: {
      id: sellerId,
      name: sellerName,
      username,
      profileImage:
        normalizeText(seller?.profile_picture_url ?? null)
          || normalizeText(seller?.profile_picture ?? null)
          || null,
      totalListings: Math.max(0, toSafeNumber(seller?.total_active_listings ?? seller?.total_listings ?? 0)),
      joinDate: sellerJoinDate,
      isVerified: false,
      isBanned: Boolean(seller?.is_banned),
      warningCount: Math.max(0, toSafeNumber(seller?.warning_count ?? 0)),
    },
    isDeleted: listing.is_active === false,
    aiTag,
  };
};

const getHighestSeverity = (listing: AdminMarketplaceListing): AdminReportSeverity | null => {
  if (listing.reports.length === 0) {
    return null;
  }

  if (listing.reports.some((report) => report.severity === 'high')) {
    return 'high';
  }

  if (listing.reports.some((report) => report.severity === 'medium')) {
    return 'medium';
  }

  return 'low';
};

const sortListings = (listings: AdminMarketplaceListing[], sortBy: AdminMarketplaceSort): AdminMarketplaceListing[] => {
  return [...listings].sort((left, right) => {
    if (sortBy === 'most_reported') {
      if (right.reportCount !== left.reportCount) {
        return right.reportCount - left.reportCount;
      }
    }

    const leftTime = new Date(left.createdAt).getTime();
    const rightTime = new Date(right.createdAt).getTime();

    if (sortBy === 'oldest') {
      return leftTime - rightTime;
    }

    return rightTime - leftTime;
  });
};

export const AdminMarketplaceModerationPage = () => {
  const navigate = useNavigate();
  const role = useAuthStore((state) => state.role);
  const isAdmin = role === 'admin';

  const [listings, setListings] = useState<AdminMarketplaceListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<AdminMarketplaceTab>('all');
  const searchQuery = '';
  const categoryFilter = 'all';
  const locationFilter = 'all';
  const [sortBy, setSortBy] = useState<AdminMarketplaceSort>('latest');
  const severityFilter: 'all' | AdminReportSeverity = 'all';

  const [selectedListingIds, setSelectedListingIds] = useState<string[]>([]);
  const [activeListingId, setActiveListingId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmActionState | null>(null);
  const [isConfirmSubmitting, setIsConfirmSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    const loadListings = async () => {
      setIsLoading(true);
      setLoadingError(null);

      try {
        const apiListings = await getAdminListings();
        if (!active) {
          return;
        }

        const mapped = apiListings.map((listing, index) =>
          mapListingToAdminRecord((listing || {}) as ApiAdminListing, index),
        );

        setListings(mapped);
      } catch (error) {
        if (!active) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Could not load marketplace listings.';
        setLoadingError(message);
        setListings([]);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadListings();

    return () => {
      active = false;
    };
  }, []);

  const activeListings = useMemo(() => {
    return listings.filter((listing) => !listing.isDeleted);
  }, [listings]);

  const stats = useMemo<AdminMarketplaceStats>(() => {
    const reportedListings = activeListings.filter((listing) => listing.status === 'reported').length;
    const totalReports = activeListings.reduce((count, listing) => count + listing.reportCount, 0);
    const activeUsers = new Set(
      activeListings.filter((listing) => !listing.seller.isBanned).map((listing) => listing.seller.id),
    ).size;

    return {
      totalListings: activeListings.length,
      reportedListings,
      totalReports,
      activeUsers,
    };
  }, [activeListings]);

  const tabCounts = useMemo(() => {
    return {
      all: stats.totalListings,
      reported: stats.reportedListings,
    } as const;
  }, [stats]);

  const filteredListings = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    let next = activeListings.filter((listing) => {
      const matchesSearch =
        normalizedSearch.length === 0
        || listing.title.toLowerCase().includes(normalizedSearch)
        || listing.seller.name.toLowerCase().includes(normalizedSearch)
        || listing.location.toLowerCase().includes(normalizedSearch)
        || listing.category.toLowerCase().includes(normalizedSearch);

      if (!matchesSearch) {
        return false;
      }

      if (activeTab !== 'all' && listing.status !== activeTab) {
        return false;
      }

      if (categoryFilter !== 'all' && listing.category !== categoryFilter) {
        return false;
      }

      if (locationFilter !== 'all' && listing.location !== locationFilter) {
        return false;
      }

      if (activeTab === 'reported' && severityFilter !== 'all') {
        return getHighestSeverity(listing) === severityFilter;
      }

      return true;
    });

    next = sortListings(next, sortBy);

    return next;
  }, [
    activeListings,
    activeTab,
    categoryFilter,
    locationFilter,
    searchQuery,
    severityFilter,
    sortBy,
  ]);

  const allFilteredSelected = useMemo(() => {
    if (filteredListings.length === 0) {
      return false;
    }

    return filteredListings.every((listing) => selectedListingIds.includes(listing.id));
  }, [filteredListings, selectedListingIds]);

  const selectedListing = useMemo(() => {
    if (!activeListingId) {
      return null;
    }

    return listings.find((listing) => listing.id === activeListingId) ?? null;
  }, [activeListingId, listings]);

  const emptyStateMessage = useMemo(() => {
    if (activeTab === 'reported') {
      return 'No reported listings. Great news.';
    }

    return 'No listings match this filter right now.';
  }, [activeTab]);

  const clearSelection = useCallback(() => {
    setSelectedListingIds([]);
  }, []);

  const toggleSelectListing = useCallback((listingId: string) => {
    setSelectedListingIds((previous) => {
      if (previous.includes(listingId)) {
        return previous.filter((id) => id !== listingId);
      }

      return [...previous, listingId];
    });
  }, []);

  const toggleSelectAllFiltered = useCallback(() => {
    const filteredIds = filteredListings.map((listing) => listing.id);

    setSelectedListingIds((previous) => {
      const alreadySelected = filteredIds.every((id) => previous.includes(id));

      if (alreadySelected) {
        return previous.filter((id) => !filteredIds.includes(id));
      }

      const merged = new Set(previous);
      filteredIds.forEach((id) => merged.add(id));
      return Array.from(merged);
    });
  }, [filteredListings]);

  const updateListings = useCallback(
    (updater: (previous: AdminMarketplaceListing[]) => AdminMarketplaceListing[]) => {
      setListings((previous) => updater(previous));
    },
    [],
  );

  const requestDelete = useCallback((listingId: string) => {
    setConfirmAction({
      type: 'delete',
      listingIds: [listingId],
    });
  }, []);

  const requestBulkDelete = useCallback(() => {
    if (selectedListingIds.length === 0) {
      return;
    }

    setConfirmAction({
      type: 'bulk-delete',
      listingIds: selectedListingIds,
    });
  }, [selectedListingIds]);

  const requestBanUser = useCallback(
    (sellerId: string) => {
      const sellerListingIds = listings
        .filter((listing) => listing.seller.id === sellerId && !listing.isDeleted)
        .map((listing) => listing.id);

      if (sellerListingIds.length === 0) {
        return;
      }

      setConfirmAction({
        type: 'ban',
        listingIds: sellerListingIds,
        sellerId,
      });
    },
    [listings],
  );

  const confirmModerationAction = useCallback(async (reason: string) => {
    if (!confirmAction || isConfirmSubmitting) {
      return;
    }

    const trimmedReason = typeof reason === 'string' ? reason.trim() : '';
    if (!trimmedReason) {
      setLoadingError('Please provide a moderation message before confirming this action.');
      return;
    }

    setIsConfirmSubmitting(true);
    setLoadingError(null);

    const { type, listingIds, sellerId } = confirmAction;
    let processedListingIds: string[] = [];
    let actionError: string | null = null;

    try {
      if (type === 'delete' || type === 'bulk-delete') {
        const parsedListingIds = listingIds
          .map((id) => ({
            raw: id,
            numeric: Number(id),
          }))
          .filter((item) => Number.isFinite(item.numeric) && item.numeric > 0);

        if (parsedListingIds.length === 0) {
          throw new Error('No valid listings were selected for deletion.');
        }

        const deleteResults = await Promise.allSettled(
          parsedListingIds.map((item) => deleteAdminListing(item.numeric, trimmedReason)),
        );

        processedListingIds = deleteResults
          .map((result, index) => (result.status === 'fulfilled' ? parsedListingIds[index].raw : null))
          .filter((value): value is string => Boolean(value));

        if (processedListingIds.length > 0) {
          updateListings((previous) =>
            previous.map((listing) => {
              if (!processedListingIds.includes(listing.id)) {
                return listing;
              }

              return {
                ...listing,
                isDeleted: true,
              };
            }),
          );
        }

        const failedCount = deleteResults.length - processedListingIds.length;
        if (failedCount > 0) {
          actionError = `${failedCount} moderation action(s) failed. Please retry.`;
        }
      }

      if (type === 'ban' && sellerId) {
        const listingIdForBan = listingIds
          .map((id) => Number(id))
          .find((id) => Number.isFinite(id) && id > 0);

        if (!listingIdForBan) {
          throw new Error('Unable to ban this user because no valid listing was found.');
        }

        await banListingSeller(listingIdForBan, trimmedReason);
        processedListingIds = listingIds;

        updateListings((previous) =>
          previous.map((listing) => {
            if (listing.seller.id !== sellerId) {
              return listing;
            }

            return {
              ...listing,
              isDeleted: true,
              seller: {
                ...listing.seller,
                isBanned: true,
              },
            };
          }),
        );
      }
    } catch (error) {
      actionError = error instanceof Error ? error.message : 'Failed to complete moderation action.';
    }

    if (processedListingIds.length > 0) {
      setSelectedListingIds((previous) => previous.filter((id) => !processedListingIds.includes(id)));

      if (activeListingId && processedListingIds.includes(activeListingId)) {
        setActiveListingId(null);
      }
    }

    if (actionError) {
      setLoadingError(actionError);
    }

    setConfirmAction(null);
    setIsConfirmSubmitting(false);
  }, [activeListingId, confirmAction, isConfirmSubmitting, updateListings]);

  const closeConfirmModal = useCallback(() => {
    if (isConfirmSubmitting) {
      return;
    }

    setConfirmAction(null);
  }, [isConfirmSubmitting]);

  const openListingDetails = useCallback((listingId: string) => {
    setActiveListingId(listingId);
  }, []);

  const closeListingDetails = useCallback(() => {
    setActiveListingId(null);
  }, []);

  const openReports = useCallback((listingId: string) => {
    setActiveListingId(listingId);
    setActiveTab('reported');
    setSortBy('most_reported');
  }, []);

  if (!isAdmin) {
    return (
      <section className="amp-access-denied" aria-label="Admin access only">
        <h1>Admin access required</h1>
        <p>This workspace is only available for admin role simulation.</p>
        <button type="button" className="amp-btn amp-btn-primary" onClick={() => navigate(ROUTES.MARKETPLACE)}>
          Go to Marketplace
        </button>
      </section>
    );
  }

  return (
    <motion.section
      className="amp-page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32 }}
    >
      <header className="amp-header">
        <div>
          <p className="amp-kicker">Admin Workspace</p>
          <h1>Marketplace Moderation</h1>
          <p>Manage listings, reports, and removals</p>
        </div>

        <div className="amp-header-right">
          <NotificationBell reportedCount={stats.reportedListings} />
        </div>
      </header>

      <section className="amp-analytics-grid" aria-label="Marketplace moderation analytics">
        <article className="amp-analytics-card">
          <p>
            <ShoppingBag size={15} />
            Total listings
          </p>
          <h3>{stats.totalListings}</h3>
        </article>
        <article className="amp-analytics-card">
          <p>
            <Flag size={15} />
            Reported listings
          </p>
          <h3>{stats.reportedListings}</h3>
        </article>
        <article className="amp-analytics-card">
          <p>
            <AlertTriangle size={15} />
            Total reports
          </p>
          <h3>{stats.totalReports}</h3>
        </article>
        <article className="amp-analytics-card">
          <p>
            <UserRound size={15} />
            Active users
          </p>
          <h3>{stats.activeUsers}</h3>
        </article>
      </section>

      <section className="amp-tabs" aria-label="Listing status tabs">
        {(Object.keys(tabLabels) as AdminMarketplaceTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            className={`amp-tab-btn ${activeTab === tab ? 'amp-tab-btn-active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            <span>{tabLabels[tab]}</span>
            <strong>{tabCounts[tab]}</strong>
          </button>
        ))}
      </section>

      {selectedListingIds.length > 0 ? (
        <BulkActionBar
          selectedCount={selectedListingIds.length}
          onDeleteSelected={requestBulkDelete}
          onClear={clearSelection}
        />
      ) : null}

      {loadingError ? <div className="amp-error-banner">{loadingError}</div> : null}

      {activeTab === 'reported' ? (
        <section className="amp-reported-banner" aria-label="Reported listing panel">
          <p>
            <Flag size={15} />
            Report management panel: prioritize high severity listings and review reports before removal.
          </p>
          <span>Sorted by: {sortBy === 'most_reported' ? 'Most reported first' : 'Custom order'}</span>
        </section>
      ) : null}

      <div className="amp-grid-column">
        <div className="amp-grid-topline">
          <label className="amp-select-all">
            <input type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAllFiltered} />
            <span>Select visible</span>
          </label>
          <p>{filteredListings.length} listing(s) shown</p>
        </div>

        {isLoading ? (
          <ListingSkeletonGrid />
        ) : filteredListings.length === 0 ? (
          <div className="amp-empty-state">
            <h3>{emptyStateMessage}</h3>
            <p>Adjust search or filters to review more listings.</p>
          </div>
        ) : (
          <div className="amp-card-grid">
            {filteredListings.map((listing) => (
              <AdminListingCard
                key={listing.id}
                listing={listing}
                isSelected={selectedListingIds.includes(listing.id)}
                isAdmin={isAdmin}
                onToggleSelect={toggleSelectListing}
                onViewDetails={openListingDetails}
                onDelete={requestDelete}
                onOpenReports={openReports}
              />
            ))}
          </div>
        )}
      </div>

      <AdminListingModal
        listing={selectedListing}
        isOpen={Boolean(selectedListing)}
        isAdmin={isAdmin}
        onClose={closeListingDetails}
        onDelete={requestDelete}
        onBanUser={requestBanUser}
      />

      <ConfirmActionModal
        isOpen={Boolean(confirmAction)}
        actionType={confirmAction?.type ?? null}
        affectedCount={confirmAction?.listingIds.length ?? 0}
        isSubmitting={isConfirmSubmitting}
        onCancel={closeConfirmModal}
        onConfirm={confirmModerationAction}
      />
    </motion.section>
  );
};
