import { motion } from 'framer-motion';
import { AlertTriangle, Flag, ShoppingBag, UserRound } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BulkActionBar } from '../components/BulkActionBar';
import { FilterBar } from '../components/FilterBar';
import { AdminListingCard } from '../components/AdminListingCard';
import { AdminListingModal } from '../components/AdminListingModal';
import { ConfirmActionModal } from '../components/ConfirmActionModal';
import { ListingSkeletonGrid } from '../components/ListingSkeletonGrid';
import { NotificationBell } from '../components/NotificationBell';
import type {
  ActivityTone,
  AdminListingReport,
  AdminListingStatus,
  AdminMarketplaceActivity,
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

const statusRotation: AdminListingStatus[] = [
  'approved',
  'pending',
  'reported',
  'approved',
  'pending',
  'rejected',
  'approved',
  'reported',
];

const tabLabels: Record<AdminMarketplaceTab, string> = {
  all: 'All Listings',
  pending: 'Pending Approval',
  reported: 'Reported Listings',
  approved: 'Approved',
  rejected: 'Rejected',
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

const resolveListingStatus = (listing: ApiListing, seed: number): AdminListingStatus => {
  if (listing.is_active === false) {
    return 'rejected';
  }

  return statusRotation[seed % statusRotation.length];
};

const mapListingToAdminRecord = (listing: ApiListing, index: number): AdminMarketplaceListing => {
  const seed = toSafeNumber(listing.id) || index + 1;
  const status = resolveListingStatus(listing, seed);
  const reportCountSeed = status === 'reported' ? (seed % 4) + 1 : 0;
  const reports = buildMockReports(seed, reportCountSeed);
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

const buildActivityEntry = (message: string, tone: ActivityTone): AdminMarketplaceActivity => {
  return {
    id: createId('activity'),
    message,
    tone,
    createdAt: new Date().toISOString(),
  };
};

const formatActivityTime = (isoDate: string): string => {
  return new Date(isoDate).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AdminListingStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [sortBy, setSortBy] = useState<AdminMarketplaceSort>('latest');
  const [severityFilter, setSeverityFilter] = useState<'all' | AdminReportSeverity>('all');

  const [selectedListingIds, setSelectedListingIds] = useState<string[]>([]);
  const [activeListingId, setActiveListingId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmActionState | null>(null);
  const [isConfirmSubmitting, setIsConfirmSubmitting] = useState(false);

  const [activityLog, setActivityLog] = useState<AdminMarketplaceActivity[]>([]);

  const appendActivity = useCallback((message: string, tone: ActivityTone) => {
    setActivityLog((previous) => [buildActivityEntry(message, tone), ...previous].slice(0, 18));
  }, []);

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
        appendActivity(`Loaded ${mapped.length} marketplace listings for moderation.`, 'info');
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
  }, [appendActivity]);

  const activeListings = useMemo(() => {
    return listings.filter((listing) => !listing.isDeleted);
  }, [listings]);

  const stats = useMemo<AdminMarketplaceStats>(() => {
    const pendingListings = activeListings.filter((listing) => listing.status === 'pending').length;
    const reportedListings = activeListings.filter((listing) => listing.status === 'reported').length;
    const approvedListings = activeListings.filter((listing) => listing.status === 'approved').length;
    const rejectedListings = activeListings.filter((listing) => listing.status === 'rejected').length;
    const activeUsers = new Set(
      activeListings.filter((listing) => !listing.seller.isBanned).map((listing) => listing.seller.id),
    ).size;

    return {
      totalListings: activeListings.length,
      pendingListings,
      reportedListings,
      approvedListings,
      rejectedListings,
      activeUsers,
    };
  }, [activeListings]);

  const tabCounts = useMemo(() => {
    return {
      all: stats.totalListings,
      pending: stats.pendingListings,
      reported: stats.reportedListings,
      approved: stats.approvedListings,
      rejected: stats.rejectedListings,
    } as const;
  }, [stats]);

  const categoryOptions = useMemo(() => {
    return Array.from(new Set(activeListings.map((listing) => listing.category))).sort((left, right) =>
      left.localeCompare(right),
    );
  }, [activeListings]);

  const locationOptions = useMemo(() => {
    return Array.from(new Set(activeListings.map((listing) => listing.location))).sort((left, right) =>
      left.localeCompare(right),
    );
  }, [activeListings]);

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

      if (statusFilter !== 'all' && listing.status !== statusFilter) {
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
    statusFilter,
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

    if (activeTab === 'pending') {
      return 'All listings reviewed. No pending approvals left.';
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

  const approveListings = useCallback(
    (listingIds: string[]) => {
      updateListings((previous) =>
        previous.map((listing) => {
          if (!listingIds.includes(listing.id)) {
            return listing;
          }

          return {
            ...listing,
            status: 'approved',
            reports: [],
            reportCount: 0,
          };
        }),
      );

      const count = listingIds.length;
      appendActivity(
        count === 1
          ? `Approved listing ${listingIds[0]}.`
          : `Approved ${count} selected listings.`,
        'success',
      );

      setSelectedListingIds((previous) => previous.filter((id) => !listingIds.includes(id)));
    },
    [appendActivity, updateListings],
  );

  const warnSeller = useCallback(
    (sellerId: string) => {
      updateListings((previous) =>
        previous.map((listing) => {
          if (listing.seller.id !== sellerId) {
            return listing;
          }

          return {
            ...listing,
            seller: {
              ...listing.seller,
              warningCount: listing.seller.warningCount + 1,
            },
          };
        }),
      );

      const sellerName = listings.find((listing) => listing.seller.id === sellerId)?.seller.name || 'Seller';
      appendActivity(`Warning sent to ${sellerName}.`, 'warning');
    },
    [appendActivity, listings, updateListings],
  );

  const requestDelete = useCallback((listingId: string) => {
    setConfirmAction({
      type: 'delete',
      listingIds: [listingId],
    });
  }, []);

  const requestReject = useCallback((listingId: string) => {
    setConfirmAction({
      type: 'reject',
      listingIds: [listingId],
    });
  }, []);

  const requestBanUser = useCallback(
    (sellerId: string) => {
      const sellerListingIds = listings
        .filter((listing) => listing.seller.id === sellerId)
        .map((listing) => listing.id);

      setConfirmAction({
        type: 'ban',
        listingIds: sellerListingIds,
        sellerId,
      });
    },
    [listings],
  );

  const requestBulkDelete = useCallback(() => {
    if (selectedListingIds.length === 0) {
      return;
    }

    setConfirmAction({
      type: 'bulk-delete',
      listingIds: selectedListingIds,
    });
  }, [selectedListingIds]);

  const requestBulkReject = useCallback(() => {
    if (selectedListingIds.length === 0) {
      return;
    }

    setConfirmAction({
      type: 'bulk-reject',
      listingIds: selectedListingIds,
    });
  }, [selectedListingIds]);

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

      appendActivity(
        listingIds.length === 1
          ? `Deleted listing ${listingIds[0]}.`
          : `Deleted ${listingIds.length} selected listings.`,
        'danger',
      );
    }

    if (type === 'reject' || type === 'bulk-reject') {
      updateListings((previous) =>
        previous.map((listing) => {
          if (!listingIds.includes(listing.id)) {
            return listing;
          }

          return {
            ...listing,
            status: 'rejected',
          };
        }),
      );

      appendActivity(
        listingIds.length === 1
          ? `Rejected listing ${listingIds[0]}.`
          : `Rejected ${listingIds.length} selected listings.`,
        'warning',
      );
    }

    if (type === 'ban' && sellerId) {
      const sellerName = listings.find((listing) => listing.seller.id === sellerId)?.seller.name || 'Seller';

      updateListings((previous) =>
        previous.map((listing) => {
          if (listing.seller.id !== sellerId) {
            return listing;
          }

          return {
            ...listing,
            status: 'rejected',
            seller: {
              ...listing.seller,
              isBanned: true,
            },
          };
        }),
      );

      appendActivity(`Banned ${sellerName} and restricted related listings.`, 'danger');
    }

    setSelectedListingIds((previous) => previous.filter((id) => !listingIds.includes(id)));

    if (activeListingId && listingIds.includes(activeListingId)) {
      setActiveListingId(null);
    }

    setConfirmAction(null);
    setIsConfirmSubmitting(false);
  }, [activeListingId, appendActivity, confirmAction, listings, updateListings]);

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

  const toneClass: Record<ActivityTone, string> = {
    info: 'amp-log-dot-info',
    success: 'amp-log-dot-success',
    warning: 'amp-log-dot-warning',
    danger: 'amp-log-dot-danger',
  };

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
          <p>Manage listings, reports, and approvals</p>
        </div>

        <div className="amp-header-right">
          <NotificationBell
            pendingCount={stats.pendingListings}
            reportedCount={stats.reportedListings}
          />
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
            <AlertTriangle size={15} />
            Pending approvals
          </p>
          <h3>{stats.pendingListings}</h3>
        </article>
        <article className="amp-analytics-card">
          <p>
            <Flag size={15} />
            Reported posts
          </p>
          <h3>{stats.reportedListings}</h3>
        </article>
        <article className="amp-analytics-card">
          <p>
            <UserRound size={15} />
            Active users
          </p>
          <h3>{stats.activeUsers}</h3>
        </article>
      </section>

      <FilterBar
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        locationFilter={locationFilter}
        onLocationFilterChange={setLocationFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        categoryOptions={categoryOptions}
        locationOptions={locationOptions}
        showSeverityFilter={activeTab === 'reported'}
        severityFilter={severityFilter}
        onSeverityFilterChange={setSeverityFilter}
      />

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
          onApproveSelected={() => approveListings(selectedListingIds)}
          onRejectSelected={requestBulkReject}
          onDeleteSelected={requestBulkDelete}
          onClear={clearSelection}
        />
      ) : null}

      {loadingError ? <div className="amp-error-banner">{loadingError}</div> : null}

      {activeTab === 'reported' ? (
        <section className="amp-reported-banner" aria-label="Reported listing panel">
          <p>
            <Flag size={15} />
            Report management panel: prioritize high severity listings and review reports before approval.
          </p>
          <span>Sorted by: {sortBy === 'most_reported' ? 'Most reported first' : 'Custom order'}</span>
        </section>
      ) : null}

      <div className="amp-main-grid">
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
                  onApprove={(listingId) => approveListings([listingId])}
                  onReject={requestReject}
                  onWarnUser={warnSeller}
                  onBanUser={requestBanUser}
                />
              ))}
            </div>
          )}
        </div>

        <aside className="amp-activity-panel" aria-label="Admin activity log">
          <div className="amp-activity-head">
            <h3>Activity Log</h3>
            <p>Admin moderation actions</p>
          </div>

          <div className="amp-activity-body">
            {activityLog.length === 0 ? (
              <p className="amp-activity-empty">No actions recorded yet.</p>
            ) : (
              <ul className="amp-activity-list">
                {activityLog.map((item) => (
                  <li key={item.id} className="amp-activity-item">
                    <span className={`amp-log-dot ${toneClass[item.tone]}`} />
                    <div>
                      <p>{item.message}</p>
                      <span>{formatActivityTime(item.createdAt)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      <AdminListingModal
        listing={selectedListing}
        isOpen={Boolean(selectedListing)}
        isAdmin={isAdmin}
        onClose={closeListingDetails}
        onApprove={(listingId) => approveListings([listingId])}
        onReject={requestReject}
        onDelete={requestDelete}
        onWarnUser={warnSeller}
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
