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
import { getListings } from '@/services/listingService';
import '../styles/AdminMarketplaceModerationPage.css';

type ApiListingUser = {
  id?: number | string;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  profile_picture?: string | null;
  profile_picture_url?: string | null;
  created_at?: string | null;
};

type ApiListing = {
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
  user?: ApiListingUser | null;
};

const BACKEND_ORIGIN = 'http://127.0.0.1:8000';

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1511556820780-d912e42b4980?auto=format&fit=crop&w=1200&q=80',
];

const REPORT_REASONS: AdminReportReason[] = ['Spam', 'Fraud', 'Misleading', 'Inappropriate'];

const REPORTER_NAMES = [
  'Mahin Rahman',
  'Asha Akter',
  'Tariq Hasan',
  'Nusrat Jahan',
  'Rakib Ahmed',
  'Tanisha Noor',
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

const buildPhotoUrl = (listing: ApiListing, seed: number): string => {
  const photoUrl = normalizeText(listing.photo_url ?? null);
  if (photoUrl) {
    return photoUrl;
  }

  const photoPath = normalizeText(listing.photo ?? null);
  if (photoPath) {
    if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
      return photoPath;
    }

    if (photoPath.startsWith('/')) {
      return `${BACKEND_ORIGIN}${photoPath}`;
    }

    return `${BACKEND_ORIGIN}/storage/${photoPath}`;
  }

  return FALLBACK_IMAGES[seed % FALLBACK_IMAGES.length];
};

const resolveSellerName = (user: ApiListingUser | null | undefined): string => {
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

  return 'Unknown Seller';
};

const buildMockReports = (seed: number, reportCount: number): AdminListingReport[] => {
  const reports: AdminListingReport[] = [];

  for (let index = 0; index < reportCount; index += 1) {
    const reason = REPORT_REASONS[(seed + index) % REPORT_REASONS.length];
    const severity: AdminReportSeverity =
      reason === 'Fraud' || reportCount >= 4 ? 'high' : reason === 'Misleading' ? 'medium' : 'low';

    reports.push({
      id: createId('report'),
      reporterName: REPORTER_NAMES[(seed + index) % REPORTER_NAMES.length],
      reason,
      severity,
      message:
        reason === 'Fraud'
          ? 'Suspicious pricing and repeated repost pattern detected.'
          : reason === 'Spam'
            ? 'Repeatedly posted with near-identical content.'
            : reason === 'Misleading'
              ? 'Photos and description appear inconsistent.'
              : 'Contains content that violates community guidelines.',
      createdAt: new Date(Date.now() - (seed + index + 1) * 36_000_00).toISOString(),
    });
  }

  return reports;
};

const mapListingToAdminRecord = (listing: ApiListing, index: number): AdminMarketplaceListing => {
  const seed = toSafeNumber(listing.id) || index + 1;
  const reportCountSeed = seed % 4 === 0 || seed % 7 === 0 ? (seed % 3) + 1 : 0;
  const reports = buildMockReports(seed, reportCountSeed);
  const status: AdminMarketplaceListing['status'] = reportCountSeed > 0 ? 'reported' : 'active';
  const sellerName = resolveSellerName(listing.user);
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

  const sellerId = String(listing.user?.id ?? `seller-${seed}`);
  const sellerJoinDate =
    normalizeText(listing.user?.created_at ?? null)
      || new Date(Date.now() - (seed % 900 + 45) * 86_400_000).toISOString();

  const username = normalizeText(listing.user?.username ?? null) || slugify(sellerName);

  return {
    id: String(listing.id ?? `listing-${seed}`),
    title,
    price: Math.max(0, toSafeNumber(listing.price)),
    location,
    category,
    description,
    image: buildPhotoUrl(listing, seed),
    status,
    reportCount: reports.length,
    reports,
    createdAt: normalizeText(listing.created_at ?? null) || new Date().toISOString(),
    updatedAt: normalizeText(listing.updated_at ?? null) || new Date().toISOString(),
    seller: {
      id: sellerId,
      name: sellerName,
      username,
      profileImage:
        normalizeText(listing.user?.profile_picture_url ?? null)
          || normalizeText(listing.user?.profile_picture ?? null)
          || null,
      totalListings: (seed % 9) + 1,
      joinDate: sellerJoinDate,
      isVerified: seed % 2 === 0,
      isBanned: false,
      warningCount: 0,
    },
    isDeleted: false,
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
        const apiListings = await getListings();
        if (!active) {
          return;
        }

        const mapped = apiListings.map((listing, index) =>
          mapListingToAdminRecord((listing || {}) as ApiListing, index),
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

  const confirmModerationAction = useCallback(() => {
    if (!confirmAction) {
      return;
    }

    setIsConfirmSubmitting(true);

    const { type, listingIds, sellerId } = confirmAction;

    if (type === 'delete' || type === 'bulk-delete') {
      updateListings((previous) =>
        previous.map((listing) => {
          if (!listingIds.includes(listing.id)) {
            return listing;
          }

          return {
            ...listing,
            isDeleted: true,
          };
        }),
      );

    }

    if (type === 'ban' && sellerId) {
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

    setSelectedListingIds((previous) => previous.filter((id) => !listingIds.includes(id)));

    if (activeListingId && listingIds.includes(activeListingId)) {
      setActiveListingId(null);
    }

    setConfirmAction(null);
    setIsConfirmSubmitting(false);
  }, [activeListingId, confirmAction, updateListings]);

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
