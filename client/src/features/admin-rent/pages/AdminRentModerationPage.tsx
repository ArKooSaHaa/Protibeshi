import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Ban,
  Bath,
  BedDouble,
  Clock3,
  Eye,
  Filter,
  MapPin,
  RefreshCw,
  Ruler,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  banRentListingOwner,
  getAdminRentListings,
  hideAdminRentListing,
} from '@/services/rentService';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import '../styles/AdminRentModerationPage.css';

type ApiAdminRentSeller = {
  id?: number | string;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  email?: string | null;
  profile_picture?: string | null;
  profile_picture_url?: string | null;
  created_at?: string | null;
  is_banned?: boolean;
  total_active_rent_listings?: number | string | null;
};

type ApiAdminRentReport = {
  id?: number | string;
  reason?: string | null;
  message?: string | null;
  severity?: string | null;
  created_at?: string | null;
  reporter?: {
    id?: number | string;
    name?: string | null;
    username?: string | null;
  } | null;
};

type ApiAdminRentListing = {
  id?: number | string;
  title?: string | null;
  location?: string | null;
  price?: number | string | null;
  deposit?: number | string | null;
  distance?: number | string | null;
  beds?: number | string | null;
  baths?: number | string | null;
  size_sqft?: number | string | null;
  type?: string | null;
  furnishing?: string | null;
  availability?: string | null;
  badge?: string | null;
  verified_landlord?: boolean;
  photo?: string | null;
  photo_url?: string | null;
  created_at?: string | null;
  seller?: ApiAdminRentSeller | null;
  user?: ApiAdminRentSeller | null;
  report_count?: number | string | null;
  reports?: ApiAdminRentReport[] | null;
};

type RiskLevel = 'high' | 'medium' | 'low';
type ModerationTab = 'all' | 'reports';
type SortMode = 'newest' | 'oldest' | 'risk' | 'priceHigh' | 'priceLow';
type PendingActionKind = 'hide' | 'ban' | 'bulkHide';
type ActivityType = 'system' | 'hide' | 'ban' | 'bulk';

type ModerationActivity = {
  id: string;
  type: ActivityType;
  label: string;
  timestamp: string;
};

type PendingActionState = {
  kind: PendingActionKind;
  listing: AdminRentListingRecord | null;
};

type AdminRentListingRecord = {
  id: number;
  title: string;
  location: string;
  price: number;
  deposit: number;
  distance: number;
  beds: number;
  baths: number;
  sizeSqft: number;
  type: string;
  furnishing: string;
  availability: string;
  badge: string;
  verifiedLandlord: boolean;
  imageUrl: string | null;
  createdAt: string;
  seller: {
    id: number;
    name: string;
    username: string;
    email: string;
    profileImage: string | null;
    isBanned: boolean;
    totalActiveRentListings: number;
  };
  riskLevel: RiskLevel;
  riskScore: number;
  riskReasons: string[];
  reportCount: number;
  reports: Array<{
    id: number;
    reason: string;
    message: string;
    severity: RiskLevel;
    createdAt: string;
    reporterName: string;
  }>;
};

type FeedbackState = {
  variant: 'success' | 'error';
  message: string;
} | null;

const FALLBACK_IMAGE = 'https://placehold.co/960x640/e2e8f0/334155?text=Rent+Listing';

const TAB_LABELS: Record<ModerationTab, string> = {
  all: 'All Listings',
  reports: 'Reports',
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

const toRiskLevel = (value: string | null | undefined): RiskLevel => {
  const normalized = normalizeText(value).toLowerCase();

  if (normalized === 'high' || normalized === 'medium' || normalized === 'low') {
    return normalized;
  }

  return 'low';
};

const formatCurrency = (value: number): string => {
  return `৳${Math.max(0, value).toLocaleString()}`;
};

const formatSince = (isoDate: string): string => {
  const timestamp = new Date(isoDate).getTime();
  if (Number.isNaN(timestamp)) {
    return 'Unknown';
  }

  const diffMs = Date.now() - timestamp;
  const diffHours = Math.max(0, Math.floor(diffMs / 3_600_000));

  if (diffHours < 1) {
    return 'Just now';
  }

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const days = Math.floor(diffHours / 24);
  return `${days}d ago`;
};

const resolveSellerName = (seller: ApiAdminRentSeller | null | undefined): string => {
  if (!seller) {
    return 'Unknown owner';
  }

  const fullName = `${normalizeText(seller.first_name)} ${normalizeText(seller.last_name)}`.trim();
  if (fullName) {
    return fullName;
  }

  const username = normalizeText(seller.username);
  if (username) {
    return username;
  }

  const email = normalizeText(seller.email);
  if (email) {
    return email;
  }

  return 'Unknown owner';
};

const resolveImageUrl = (listing: ApiAdminRentListing): string => {
  const resolvedPhotoUrl =
    resolveMediaUrl(normalizeText(listing.photo_url)) || resolveMediaUrl(normalizeText(listing.photo));

  return resolvedPhotoUrl || FALLBACK_IMAGE;
};

const assessRisk = (input: {
  title: string;
  location: string;
  price: number;
  beds: number;
  sizeSqft: number;
  verifiedLandlord: boolean;
  imageUrl: string | null;
  sellerActiveListings: number;
  availability: string;
}): { level: RiskLevel; score: number; reasons: string[] } => {
  let score = 0;
  const reasons: string[] = [];

  const combinedText = `${input.title} ${input.location}`;

  if (/(urgent|cash only|wire transfer|advance payment|dm now|no documents)/i.test(combinedText)) {
    score += 38;
    reasons.push('Suspicious urgency/payment language');
  }

  if (!input.verifiedLandlord) {
    score += 18;
    reasons.push('Landlord profile not verified');
  }

  if (!input.imageUrl || input.imageUrl === FALLBACK_IMAGE) {
    score += 18;
    reasons.push('No authentic listing photo');
  }

  if (input.price > 0 && input.price < 3000) {
    score += 16;
    reasons.push('Unusually low rent amount');
  }

  if (input.sizeSqft > 0 && input.price > 0 && input.price / input.sizeSqft < 18) {
    score += 12;
    reasons.push('Price-to-size ratio looks unrealistic');
  }

  if (input.beds >= 3 && input.price > 0 && input.price < 7000) {
    score += 10;
    reasons.push('Large unit listed below expected range');
  }

  if (input.sellerActiveListings >= 9) {
    score += 10;
    reasons.push('Owner has unusually high active inventory');
  }

  if (normalizeText(input.availability).toLowerCase() === 'now') {
    score += 4;
    reasons.push('Immediate move-in claim');
  }

  const level: RiskLevel = score >= 55 ? 'high' : score >= 30 ? 'medium' : 'low';

  if (reasons.length === 0) {
    reasons.push('No major risk indicators detected');
  }

  return {
    level,
    score,
    reasons,
  };
};

const normalizeAdminRentListing = (
  raw: ApiAdminRentListing,
  index: number,
): AdminRentListingRecord => {
  const seller = raw.seller ?? raw.user ?? null;
  const sellerName = resolveSellerName(seller);
  const sellerId = Math.max(1, toSafeNumber(seller?.id) || index + 1);
  const sellerUsername = normalizeText(seller?.username) || sellerName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const rawReports = Array.isArray(raw.reports) ? raw.reports : [];
  const normalizedReports = rawReports.map((report, reportIndex) => {
    const reason = normalizeText(report.reason) || 'Reported by community member';

    return {
      id: Math.max(1, toSafeNumber(report.id) || reportIndex + 1),
      reason,
      message: normalizeText(report.message) || reason,
      severity: toRiskLevel(report.severity),
      createdAt: normalizeText(report.created_at) || new Date().toISOString(),
      reporterName: normalizeText(report.reporter?.name)
        || normalizeText(report.reporter?.username)
        || 'Community member',
    };
  });
  const reportCount = Math.max(0, toSafeNumber(raw.report_count));

  const record: AdminRentListingRecord = {
    id: Math.max(1, toSafeNumber(raw.id) || index + 1),
    title: normalizeText(raw.title) || `Untitled listing #${index + 1}`,
    location: normalizeText(raw.location) || 'Unknown location',
    price: Math.max(0, toSafeNumber(raw.price)),
    deposit: Math.max(0, toSafeNumber(raw.deposit)),
    distance: Math.max(0, toSafeNumber(raw.distance)),
    beds: Math.max(0, toSafeNumber(raw.beds)),
    baths: Math.max(0, toSafeNumber(raw.baths)),
    sizeSqft: Math.max(0, toSafeNumber(raw.size_sqft)),
    type: normalizeText(raw.type) || 'Unknown type',
    furnishing: normalizeText(raw.furnishing) || 'Not specified',
    availability: normalizeText(raw.availability) || 'Not specified',
    badge: normalizeText(raw.badge),
    verifiedLandlord: Boolean(raw.verified_landlord),
    imageUrl: resolveImageUrl(raw),
    createdAt: normalizeText(raw.created_at) || new Date().toISOString(),
    seller: {
      id: sellerId,
      name: sellerName,
      username: sellerUsername,
      email: normalizeText(seller?.email) || 'No email',
      profileImage: normalizeText(seller?.profile_picture_url ?? seller?.profile_picture) || null,
      isBanned: Boolean(seller?.is_banned),
      totalActiveRentListings: Math.max(0, toSafeNumber(seller?.total_active_rent_listings)),
    },
    riskLevel: 'low',
    riskScore: 0,
    riskReasons: [],
    reportCount: reportCount > 0 ? reportCount : normalizedReports.length,
    reports: normalizedReports,
  };

  const risk = assessRisk({
    title: record.title,
    location: record.location,
    price: record.price,
    beds: record.beds,
    sizeSqft: record.sizeSqft,
    verifiedLandlord: record.verifiedLandlord,
    imageUrl: record.imageUrl,
    sellerActiveListings: record.seller.totalActiveRentListings,
    availability: record.availability,
  });

  return {
    ...record,
    riskLevel: risk.level,
    riskScore: risk.score,
    riskReasons: risk.reasons,
  };
};

const isRecentListing = (createdAt: string): boolean => {
  const createdAtMs = new Date(createdAt).getTime();
  if (Number.isNaN(createdAtMs)) {
    return false;
  }

  return Date.now() - createdAtMs <= 2 * 86_400_000;
};

const getActivityIcon = (type: ActivityType) => {
  if (type === 'hide') {
    return <Trash2 size={14} />;
  }

  if (type === 'ban') {
    return <Ban size={14} />;
  }

  if (type === 'bulk') {
    return <Filter size={14} />;
  }

  return <ShieldCheck size={14} />;
};

export const AdminRentModerationPage = () => {
  const [listings, setListings] = useState<AdminRentListingRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [activityFeed, setActivityFeed] = useState<ModerationActivity[]>([]);
  const [activeTab, setActiveTab] = useState<ModerationTab>('all');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [activeListingId, setActiveListingId] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingActionState | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);

  const showFeedback = useCallback((variant: 'success' | 'error', message: string) => {
    setFeedback({ variant, message });
  }, []);

  useEffect(() => {
    if (!feedback) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setFeedback(null);
    }, 3800);

    return () => {
      window.clearTimeout(timer);
    };
  }, [feedback]);

  const addActivity = useCallback((type: ActivityType, label: string) => {
    setActivityFeed((previous) => [
      {
        id: createId('activity'),
        type,
        label,
        timestamp: new Date().toISOString(),
      },
      ...previous,
    ].slice(0, 18));
  }, []);

  const fetchListings = useCallback(async (isManualRefresh: boolean = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setErrorMessage(null);

    try {
      const rawListings = await getAdminRentListings();
      const normalized = rawListings.map((item: ApiAdminRentListing, index: number) =>
        normalizeAdminRentListing(item, index));

      setListings(normalized);
      setLastSyncedAt(new Date().toISOString());
      addActivity('system', `Loaded ${normalized.length} active rent listings for moderation.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load admin rent listings.';
      setErrorMessage(message);
      showFeedback('error', message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [addActivity, showFeedback]);

  useEffect(() => {
    void fetchListings(false);
  }, [fetchListings]);

  useEffect(() => {
    if (activeListingId === null) {
      return;
    }

    const exists = listings.some((listing) => listing.id === activeListingId);
    if (!exists) {
      setActiveListingId(null);
    }
  }, [activeListingId, listings]);

  const allPropertyTypes = useMemo(() => {
    return Array.from(new Set(listings.map((listing) => listing.type).filter((value) => value && value !== 'Unknown type')))
      .sort((a, b) => a.localeCompare(b));
  }, [listings]);

  const allAvailability = useMemo(() => {
    return Array.from(new Set(listings.map((listing) => listing.availability).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b));
  }, [listings]);

  const stats = useMemo(() => {
    const total = listings.length;
    const reported = listings.filter((listing) => listing.reportCount > 0).length;
    const highRisk = listings.filter((listing) => listing.riskLevel === 'high').length;
    const unverified = listings.filter((listing) => !listing.verifiedLandlord).length;
    const recent = listings.filter((listing) => isRecentListing(listing.createdAt)).length;
    const averagePrice = total > 0
      ? Math.round(listings.reduce((sum, listing) => sum + listing.price, 0) / total)
      : 0;

    return {
      total,
      reported,
      highRisk,
      unverified,
      recent,
      averagePrice,
    };
  }, [listings]);

  const tabCounts = useMemo(() => {
    return {
      all: listings.length,
      reports: listings.filter((listing) => listing.reportCount > 0).length,
    };
  }, [listings]);

  const filteredListings = useMemo(() => {
    let data = [...listings];

    if (activeTab === 'reports') {
      data = data.filter((listing) => listing.reportCount > 0);
    }

    const normalizedQuery = searchTerm.trim().toLowerCase();
    if (normalizedQuery) {
      data = data.filter((listing) => {
        const searchable = [
          listing.title,
          listing.location,
          listing.type,
          listing.availability,
          listing.seller.name,
          listing.seller.username,
          listing.seller.email,
        ]
          .join(' ')
          .toLowerCase();

        return searchable.includes(normalizedQuery);
      });
    }

    if (availabilityFilter !== 'all') {
      data = data.filter((listing) => listing.availability === availabilityFilter);
    }

    if (typeFilter !== 'all') {
      data = data.filter((listing) => listing.type === typeFilter);
    }

    return data.sort((left, right) => {
      if (sortMode === 'newest') {
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      }

      if (sortMode === 'oldest') {
        return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
      }

      if (sortMode === 'priceHigh') {
        return right.price - left.price;
      }

      if (sortMode === 'priceLow') {
        return left.price - right.price;
      }

      return right.riskScore - left.riskScore;
    });
  }, [
    activeTab,
    availabilityFilter,
    listings,
    searchTerm,
    sortMode,
    typeFilter,
  ]);

  const activeListing = useMemo(() => {
    if (activeListingId === null) {
      return null;
    }

    return listings.find((listing) => listing.id === activeListingId) ?? null;
  }, [activeListingId, listings]);

  const toggleListingSelection = useCallback((listingId: number) => {
    setSelectedIds((previous) => {
      if (previous.includes(listingId)) {
        return previous.filter((id) => id !== listingId);
      }

      return [...previous, listingId];
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const openActionModal = useCallback((kind: PendingActionKind, listing: AdminRentListingRecord | null) => {
    setPendingAction({ kind, listing });
    setActionReason('');
  }, []);

  const closeActionModal = useCallback(() => {
    if (isActionSubmitting) {
      return;
    }

    setPendingAction(null);
    setActionReason('');
  }, [isActionSubmitting]);

  const confirmPendingAction = useCallback(async () => {
    if (!pendingAction) {
      return;
    }

    const trimmedReason = actionReason.trim();
    if (!trimmedReason) {
      showFeedback('error', 'Please provide a moderation message before confirming this action.');
      return;
    }

    setIsActionSubmitting(true);

    try {
      if (pendingAction.kind === 'hide' && pendingAction.listing) {
        const response = await hideAdminRentListing(pendingAction.listing.id, trimmedReason);

        setListings((previous) => previous.filter((listing) => listing.id !== pendingAction.listing?.id));
        setSelectedIds((previous) => previous.filter((id) => id !== pendingAction.listing?.id));

        addActivity('hide', `Hidden listing “${pendingAction.listing.title}” from rent feed.`);
        showFeedback('success', response.message);
      }

      if (pendingAction.kind === 'ban' && pendingAction.listing) {
        const response = await banRentListingOwner(pendingAction.listing.id, trimmedReason);
        const sellerId = pendingAction.listing.seller.id;

        setListings((previous) => previous.filter((listing) => listing.seller.id !== sellerId));
        setSelectedIds((previous) => previous.filter((id) => {
          const listing = listings.find((entry) => entry.id === id);
          return listing ? listing.seller.id !== sellerId : true;
        }));

        addActivity(
          'ban',
          `Banned landlord ${pendingAction.listing.seller.name}. Removed ${response.affectedListings} active listing(s).`,
        );
        showFeedback('success', response.message);
      }

      if (pendingAction.kind === 'bulkHide') {
        const listingIds = [...selectedIds];
        if (listingIds.length === 0) {
          setPendingAction(null);
          setIsActionSubmitting(false);
          return;
        }

        const results = await Promise.allSettled(
          listingIds.map((listingId) => hideAdminRentListing(listingId, trimmedReason)),
        );

        const successfulIds: number[] = [];
        let failedCount = 0;

        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            successfulIds.push(listingIds[index]);
          } else {
            failedCount += 1;
          }
        });

        if (successfulIds.length > 0) {
          setListings((previous) => previous.filter((listing) => !successfulIds.includes(listing.id)));
          setSelectedIds((previous) => previous.filter((id) => !successfulIds.includes(id)));
          addActivity('bulk', `Bulk hid ${successfulIds.length} listing(s) from rent feed.`);
        }

        if (failedCount > 0) {
          showFeedback('error', `${failedCount} listing(s) failed during bulk hide.`);
        } else {
          showFeedback('success', `${successfulIds.length} listing(s) hidden successfully.`);
        }
      }

      setPendingAction(null);
      setActionReason('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Moderation action failed.';
      showFeedback('error', message);
    } finally {
      setIsActionSubmitting(false);
    }
  }, [actionReason, addActivity, listings, pendingAction, selectedIds, showFeedback]);

  const selectedCount = selectedIds.length;

  return (
    <motion.section
      className="arp-page"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32 }}
    >
      <header className="arp-hero">
        <div className="arp-hero-copy">
          <p className="arp-kicker">Admin Moderation Console</p>
          <h1>Rent Intelligence Board</h1>
          <p>
            Monitor suspicious rent activity, enforce landlord trust rules, and keep neighborhood housing posts
            reliable in real time.
          </p>
        </div>

        <div className="arp-hero-actions">
          <span className="arp-sync-chip">
            <Clock3 size={14} /> Last Sync: {lastSyncedAt ? formatSince(lastSyncedAt) : 'Not synced'}
          </span>
          <button
            type="button"
            className="arp-btn arp-btn-primary"
            onClick={() => void fetchListings(true)}
            disabled={isRefreshing}
          >
            <RefreshCw size={14} className={isRefreshing ? 'arp-spin' : ''} />
            {isRefreshing ? 'Refreshing' : 'Refresh'}
          </button>
        </div>
      </header>

      <section className="arp-stats-grid">
        <article className="arp-stat-card">
          <p>
            <Eye size={14} /> Active Listings
          </p>
          <h3>{stats.total}</h3>
        </article>

        <article className="arp-stat-card arp-stat-card-danger">
          <p>
            <ShieldAlert size={14} /> High Risk
          </p>
          <h3>{stats.highRisk}</h3>
        </article>

        <article className="arp-stat-card">
          <p>
            <AlertTriangle size={14} /> Unverified Landlords
          </p>
          <h3>{stats.unverified}</h3>
        </article>

        <article className="arp-stat-card">
          <p>
            <ShieldCheck size={14} /> Reported Listings
          </p>
          <h3>{stats.reported}</h3>
          <span>Avg Rent {formatCurrency(stats.averagePrice)}</span>
        </article>
      </section>

      <section className="arp-control-panel">
        <div className="arp-search-box">
          <Search size={16} />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by listing, owner, location, email"
          />
        </div>

        <div className="arp-filters-row">
          <label>
            <span>Sort</span>
            <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="risk">Risk score</option>
              <option value="priceHigh">Price high to low</option>
              <option value="priceLow">Price low to high</option>
            </select>
          </label>

          <label>
            <span>Availability</span>
            <select value={availabilityFilter} onChange={(event) => setAvailabilityFilter(event.target.value)}>
              <option value="all">All</option>
              {allAvailability.map((availability) => (
                <option key={availability} value={availability}>
                  {availability}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Property Type</span>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="all">All</option>
              {allPropertyTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="arp-tabs">
          {(Object.keys(TAB_LABELS) as ModerationTab[]).map((tabKey) => (
            <button
              key={tabKey}
              type="button"
              className={`arp-tab-btn ${activeTab === tabKey ? 'arp-tab-btn-active' : ''}`}
              onClick={() => setActiveTab(tabKey)}
            >
              <span>{TAB_LABELS[tabKey]}</span>
              <strong>{tabCounts[tabKey]}</strong>
            </button>
          ))}
        </div>
      </section>

      {selectedCount > 0 ? (
        <section className="arp-bulk-bar">
          <p>{selectedCount} listing(s) selected for action.</p>
          <div className="arp-bulk-actions">
            <button
              type="button"
              className="arp-btn arp-btn-danger-outline"
              onClick={() => openActionModal('bulkHide', null)}
            >
              <Trash2 size={14} /> Hide Selected
            </button>
            <button type="button" className="arp-btn arp-btn-ghost" onClick={clearSelection}>
              Clear
            </button>
          </div>
        </section>
      ) : null}

      {feedback ? (
        <div className={`arp-feedback arp-feedback-${feedback.variant}`}>{feedback.message}</div>
      ) : null}

      {errorMessage ? <div className="arp-error-banner">{errorMessage}</div> : null}

      <div className="arp-content-layout">
        <section className="arp-list-area">
          {isLoading ? (
            <div className="arp-skeleton-grid">
              {Array.from({ length: 6 }).map((_, index) => (
                <article key={`skeleton-${index}`} className="arp-skeleton-card" />
              ))}
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="arp-empty-state">
              <h3>No listings match this moderation filter</h3>
              <p>Adjust search or filter values to broaden the queue.</p>
            </div>
          ) : (
            <div className="arp-listings-grid">
              {filteredListings.map((listing) => {
                const isSelected = selectedIds.includes(listing.id);
                const moderationReasons = listing.reportCount > 0
                  ? listing.reports.map((report) => report.reason)
                  : listing.riskReasons;

                return (
                  <article key={listing.id} className="arp-card">
                    <div className="arp-card-media">
                      <img src={listing.imageUrl ?? FALLBACK_IMAGE} alt={listing.title} />

                      <div className="arp-card-overlay-top">
                        <label className="arp-select-chip" htmlFor={`select-${listing.id}`}>
                          <input
                            id={`select-${listing.id}`}
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleListingSelection(listing.id)}
                          />
                          Select
                        </label>

                        <span className={`arp-risk-pill arp-risk-${listing.riskLevel}`}>
                          {listing.riskLevel.toUpperCase()} · {listing.riskScore}
                        </span>
                      </div>
                    </div>

                    <div className="arp-card-body">
                      <div className="arp-card-price-row">
                        <h3>{formatCurrency(listing.price)}</h3>
                        <span className="arp-age-pill">
                          <Clock3 size={13} /> {formatSince(listing.createdAt)}
                        </span>
                      </div>

                      <h4>{listing.title}</h4>

                      <p className="arp-location-row">
                        <MapPin size={14} /> {listing.location}
                      </p>

                      <div className="arp-meta-grid">
                        <span>
                          <BedDouble size={13} /> {listing.beds || 0} Bed
                        </span>
                        <span>
                          <Bath size={13} /> {listing.baths || 0} Bath
                        </span>
                        <span>
                          <Ruler size={13} /> {listing.sizeSqft || 0} sq ft
                        </span>
                        <span>
                          <MapPin size={13} /> {listing.distance || 0}m away
                        </span>
                      </div>

                      <div className="arp-seller-row">
                        <div className="arp-seller-avatar" aria-hidden="true">
                          {listing.seller.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p>{listing.seller.name}</p>
                          <span>@{listing.seller.username}</span>
                        </div>
                        {listing.verifiedLandlord ? (
                          <span className="arp-verified-chip">
                            <ShieldCheck size={12} /> Verified
                          </span>
                        ) : (
                          <span className="arp-unverified-chip">
                            <ShieldAlert size={12} /> Unverified
                          </span>
                        )}
                      </div>

                      {listing.reportCount > 0 ? (
                        <p className="arp-report-count">
                          {listing.reportCount} report{listing.reportCount === 1 ? '' : 's'} issued
                        </p>
                      ) : null}

                      <ul className="arp-risk-reasons">
                        {moderationReasons.slice(0, 2).map((reason) => (
                          <li key={`${listing.id}-${reason}`}>{reason}</li>
                        ))}
                      </ul>

                      <div className="arp-card-actions">
                        <button
                          type="button"
                          className="arp-btn arp-btn-danger-outline"
                          onClick={() => openActionModal('hide', listing)}
                        >
                          <Trash2 size={14} /> Hide
                        </button>

                        <button
                          type="button"
                          className="arp-btn arp-btn-warning"
                          onClick={() => openActionModal('ban', listing)}
                        >
                          <Ban size={14} /> Ban
                        </button>

                        <button
                          type="button"
                          className="arp-btn arp-btn-ghost"
                          onClick={() => setActiveListingId(listing.id)}
                        >
                          <Eye size={14} /> Details
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <aside className="arp-activity-panel">
          <header>
            <h3>Moderation Timeline</h3>
            <p>Recent admin actions and queue events.</p>
          </header>

          <ul>
            {activityFeed.length === 0 ? (
              <li className="arp-activity-empty">No moderation activity yet.</li>
            ) : (
              activityFeed.map((activity) => (
                <li key={activity.id}>
                  <span className="arp-activity-icon">{getActivityIcon(activity.type)}</span>
                  <div>
                    <p>{activity.label}</p>
                    <small>{formatSince(activity.timestamp)}</small>
                  </div>
                </li>
              ))
            )}
          </ul>

          <div className="arp-policy-box">
            <h4>Auto-Risk Policy Signals</h4>
            <p>Urgency language, unrealistic pricing, missing photos, and high-volume landlords are scored automatically.</p>
          </div>

          <div className="arp-quick-summary">
            <span>{stats.recent} fresh listings in last 48h</span>
            <span>{stats.reported} listings have issued reports</span>
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {activeListing ? (
          <motion.div
            className="arp-drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveListingId(null)}
          >
            <motion.aside
              className="arp-drawer"
              initial={{ x: 420 }}
              animate={{ x: 0 }}
              exit={{ x: 420 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              onClick={(event) => event.stopPropagation()}
            >
              <header>
                <h3>{activeListing.title}</h3>
                <button type="button" onClick={() => setActiveListingId(null)}>
                  <X size={16} />
                </button>
              </header>

              <img src={activeListing.imageUrl ?? FALLBACK_IMAGE} alt={activeListing.title} />

              <div className="arp-drawer-grid">
                <div>
                  <span>Rent</span>
                  <strong>{formatCurrency(activeListing.price)}</strong>
                </div>
                <div>
                  <span>Deposit</span>
                  <strong>{formatCurrency(activeListing.deposit)}</strong>
                </div>
                <div>
                  <span>Type</span>
                  <strong>{activeListing.type}</strong>
                </div>
                <div>
                  <span>Availability</span>
                  <strong>{activeListing.availability}</strong>
                </div>
              </div>

              <div className="arp-drawer-risk">
                <p>
                  Risk Score <strong>{activeListing.riskScore}</strong>
                </p>
                <span className={`arp-risk-pill arp-risk-${activeListing.riskLevel}`}>
                  {activeListing.riskLevel.toUpperCase()}
                </span>
              </div>

              <ul>
                {(activeListing.reportCount > 0
                  ? activeListing.reports.map((report) => report.reason)
                  : activeListing.riskReasons
                ).map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>

              <div className="arp-drawer-owner">
                <h4>Landlord</h4>
                <p>{activeListing.seller.name}</p>
                <span>{activeListing.seller.email}</span>
              </div>

              <div className="arp-drawer-actions">
                <button type="button" className="arp-btn arp-btn-danger-outline" onClick={() => openActionModal('hide', activeListing)}>
                  <Trash2 size={14} /> Hide Listing
                </button>
                <button type="button" className="arp-btn arp-btn-warning" onClick={() => openActionModal('ban', activeListing)}>
                  <Ban size={14} /> Ban Landlord
                </button>
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {pendingAction ? (
          <motion.div
            className="arp-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeActionModal}
          >
            <motion.div
              className="arp-modal"
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.96 }}
              onClick={(event) => event.stopPropagation()}
            >
              <h3>
                {pendingAction.kind === 'hide' ? 'Hide listing from public rent feed?' : null}
                {pendingAction.kind === 'ban' ? 'Ban landlord and remove active rent listings?' : null}
                {pendingAction.kind === 'bulkHide' ? 'Hide all selected listings?' : null}
              </h3>
              <p>
                {pendingAction.kind === 'hide' ? 'This listing will no longer appear in the public rent page.' : null}
                {pendingAction.kind === 'ban' ? 'This action blocks posting for 7 days and removes active rent listings.' : null}
                {pendingAction.kind === 'bulkHide'
                  ? 'Bulk hide will remove all selected items from the public rent feed.'
                  : null}
              </p>

              <label htmlFor="moderation-reason">Moderation Message (Required)</label>
              <textarea
                id="moderation-reason"
                value={actionReason}
                onChange={(event) => setActionReason(event.target.value)}
                placeholder="Explain why this moderation action is being taken"
                rows={4}
                maxLength={500}
              />
              <p className="arp-modal-note">This message will be sent to the user as the official moderation reason.</p>

              <div className="arp-modal-actions">
                <button type="button" className="arp-btn arp-btn-ghost" onClick={closeActionModal} disabled={isActionSubmitting}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="arp-btn arp-btn-danger"
                  onClick={() => void confirmPendingAction()}
                  disabled={isActionSubmitting || actionReason.trim().length === 0}
                >
                  {isActionSubmitting ? 'Applying...' : 'Confirm Action'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.section>
  );
};
