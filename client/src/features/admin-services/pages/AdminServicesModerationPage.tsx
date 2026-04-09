import { AnimatePresence, motion, type Variants } from 'framer-motion';
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock3,
  Eye,
  Filter,
  Flag,
  MapPin,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { servicesData } from '@/features/services/mock/servicesData';
import type {
  ServiceAvailability,
  ServiceCategory,
  ServiceItem,
} from '@/features/services/types/service.types';
import { getServices } from '@/services/serviceService';
import '../styles/AdminServicesModerationPage.css';

type RiskLevel = 'high' | 'medium' | 'low';
type ModerationTab = 'all' | 'reported' | 'highRisk' | 'unverified';
type SortMode = 'newest' | 'oldest' | 'risk' | 'reports' | 'priceHigh' | 'priceLow';
type StatusFilter = 'all' | 'active' | 'hidden' | 'banned';
type VerificationFilter = 'all' | 'verified' | 'unverified';
type RiskFilter = 'all' | RiskLevel;

type PendingActionKind =
  | 'hide'
  | 'verify'
  | 'flag'
  | 'banProvider'
  | 'dismissReports'
  | 'bulkHide'
  | 'bulkVerify'
  | 'bulkDismissReports';

type ActivityType = 'system' | 'hide' | 'verify' | 'flag' | 'ban' | 'dismiss' | 'bulk';

type ModerationReport = {
  id: string;
  reason: string;
  message: string;
  severity: RiskLevel;
  reporterName: string;
  createdAt: string;
};

type ModerationStatus = 'active' | 'hidden';

type AdminServiceRecord = ServiceItem & {
  moderationStatus: ModerationStatus;
  providerBanned: boolean;
  flagged: boolean;
  reviewed: boolean;
  reportCount: number;
  reports: ModerationReport[];
  riskLevel: RiskLevel;
  riskScore: number;
  riskSignals: string[];
  trustScore: number;
};

type PendingActionState = {
  kind: PendingActionKind;
  targetIds: string[];
  contextId: string | null;
};

type FeedbackState = {
  variant: 'success' | 'error';
  message: string;
} | null;

type ModerationActivity = {
  id: string;
  type: ActivityType;
  label: string;
  timestamp: string;
};

const TAB_LABELS: Record<ModerationTab, string> = {
  all: 'All Services',
  reported: 'Reported',
  highRisk: 'High Risk',
  unverified: 'Unverified',
};

const SORT_LABELS: Record<SortMode, string> = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  risk: 'Highest risk score',
  reports: 'Most reports',
  priceHigh: 'Price high to low',
  priceLow: 'Price low to high',
};

const ACTION_COPY: Record<PendingActionKind, { title: string; description: string; confirmLabel: string }> = {
  hide: {
    title: 'Hide Service',
    description: 'This service will be removed from visible public queue in UI preview mode.',
    confirmLabel: 'Hide service',
  },
  verify: {
    title: 'Verify Provider',
    description: 'Mark this provider as trusted and reduce risk weight in the moderation board.',
    confirmLabel: 'Verify provider',
  },
  flag: {
    title: 'Flag Service',
    description: 'Add a moderation report and escalate this service in the risk queue.',
    confirmLabel: 'Flag service',
  },
  banProvider: {
    title: 'Ban Provider',
    description: 'All services from this provider will be hidden in this UI simulation.',
    confirmLabel: 'Ban provider',
  },
  dismissReports: {
    title: 'Dismiss Reports',
    description: 'Clear all reports and reset escalation weight for this service.',
    confirmLabel: 'Dismiss reports',
  },
  bulkHide: {
    title: 'Bulk Hide Services',
    description: 'Hide selected services from this moderation queue.',
    confirmLabel: 'Hide selected',
  },
  bulkVerify: {
    title: 'Bulk Verify Providers',
    description: 'Verify selected services and lower their risk score.',
    confirmLabel: 'Verify selected',
  },
  bulkDismissReports: {
    title: 'Bulk Dismiss Reports',
    description: 'Clear all reports for selected services.',
    confirmLabel: 'Dismiss selected reports',
  },
};

const REPORT_REASONS = [
  'Misleading service claim',
  'Spam or repetitive posting',
  'Suspicious payment request',
  'Low-quality or incomplete details',
  'Unverified trust signal',
];

const REPORTERS = [
  'Neighbor Watch Team',
  'Community member',
  'Local moderator',
  'Verified resident',
  'Trust patrol',
];

const cardContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.08,
    },
  },
};

const cardItemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.32,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const createId = (prefix: string): string => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

const hashString = (value: string): number => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 10_000;
  }

  return hash;
};

const toSafeNumber = (value: unknown, fallback: number = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

const toRiskLevel = (score: number): RiskLevel => {
  if (score >= 62) {
    return 'high';
  }

  if (score >= 34) {
    return 'medium';
  }

  return 'low';
};

const formatCurrency = (value: number): string => {
  return `BDT ${Math.max(0, value).toLocaleString()}`;
};

const formatSince = (isoDate: string | null): string => {
  if (!isoDate) {
    return 'Not synced';
  }

  const timestamp = new Date(isoDate).getTime();
  if (Number.isNaN(timestamp)) {
    return 'Unknown';
  }

  const diffHours = Math.floor((Date.now() - timestamp) / 3_600_000);

  if (diffHours < 1) {
    return 'Just now';
  }

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const buildProviderKey = (service: Pick<ServiceItem, 'ownerId' | 'providerName'>): string => {
  if (service.ownerId !== null && service.ownerId !== undefined) {
    return `owner-${service.ownerId}`;
  }

  return `name-${service.providerName.trim().toLowerCase()}`;
};

const computeModerationMetrics = (input: {
  title: string;
  shortDescription: string;
  price: number;
  verified: boolean;
  experience: number;
  reviews: number;
  availability: ServiceAvailability;
  distance: number;
  reportCount: number;
  flagged: boolean;
  providerBanned: boolean;
  moderationStatus: ModerationStatus;
}): {
  riskScore: number;
  riskLevel: RiskLevel;
  riskSignals: string[];
  trustScore: number;
} => {
  let score = 0;
  const signals: string[] = [];
  const text = `${input.title} ${input.shortDescription}`;

  if (input.reportCount > 0) {
    score += Math.min(44, input.reportCount * 12);
    signals.push(`${input.reportCount} community report(s) in queue`);
  }

  if (!input.verified) {
    score += 18;
    signals.push('Provider profile is not verified');
  }

  if (input.price <= 250) {
    score += 20;
    signals.push('Unusually low price point');
  } else if (input.price <= 500) {
    score += 10;
    signals.push('Below-market price pattern');
  }

  if (input.experience <= 1) {
    score += 12;
    signals.push('Low experience profile');
  }

  if (input.reviews <= 2) {
    score += 8;
    signals.push('Very limited social proof');
  }

  if (/(urgent|cash only|advance payment|wire transfer|dm now|bkash first)/i.test(text)) {
    score += 24;
    signals.push('Suspicious urgency or payment language');
  }

  if (input.availability === 'Available today' && !input.verified) {
    score += 6;
    signals.push('Instant availability from unverified profile');
  }

  if (input.distance > 3_000) {
    score += 4;
    signals.push('Distance appears unusually high for local service');
  }

  if (input.flagged) {
    score += 12;
    signals.push('Manually escalated by moderator');
  }

  if (input.providerBanned) {
    score += 18;
    signals.push('Provider currently banned');
  }

  if (input.moderationStatus === 'hidden') {
    score += 4;
  }

  if (signals.length === 0) {
    signals.push('No major trust risk indicators detected');
  }

  const riskScore = clamp(score, 0, 99);
  const riskLevel = toRiskLevel(riskScore);
  const trustScore = clamp(
    100 - riskScore + (input.verified ? 10 : 0) + Math.min(Math.round(input.reviews * 0.3), 12) + Math.min(Math.round(input.experience * 1.5), 10),
    5,
    99,
  );

  return {
    riskScore,
    riskLevel,
    riskSignals: signals,
    trustScore,
  };
};

const buildSyntheticReports = (
  service: ServiceItem,
  reportCount: number,
  seed: number,
  baseSeverity: RiskLevel,
): ModerationReport[] => {
  if (reportCount <= 0) {
    return [];
  }

  return Array.from({ length: reportCount }).map((_, index) => {
    const reason = REPORT_REASONS[(seed + index) % REPORT_REASONS.length];
    const severity: RiskLevel = index === 0
      ? baseSeverity
      : (baseSeverity === 'high' ? 'medium' : baseSeverity);

    return {
      id: `${service.id}-report-${index + 1}`,
      reason,
      message: `Auto-generated moderation note: ${reason.toLowerCase()} for review queue simulation.`,
      severity,
      reporterName: REPORTERS[(seed + index * 2) % REPORTERS.length],
      createdAt: new Date(Date.now() - (index + 1) * 3_600_000).toISOString(),
    };
  });
};

const normalizeToAdminRecord = (service: ServiceItem, index: number): AdminServiceRecord => {
  const safeId = `${service.id || `svc-${index + 1}`}`;
  const seed = hashString(`${safeId}-${service.providerName}-${service.title}`);
  const text = `${service.title} ${service.shortDescription}`;

  let reportCount = 0;

  if (seed % 5 === 0) {
    reportCount += 1;
  }

  if (!service.verified && seed % 3 === 0) {
    reportCount += 1;
  }

  if (service.price < 300) {
    reportCount += 1;
  }

  if (/(urgent|cash only|advance|wire|bkash first|dm)/i.test(text)) {
    reportCount += 2;
  }

  reportCount = clamp(reportCount, 0, 4);

  const baseMetrics = computeModerationMetrics({
    title: service.title,
    shortDescription: service.shortDescription,
    price: service.price,
    verified: service.verified,
    experience: service.experience,
    reviews: service.reviews,
    availability: service.availability,
    distance: service.distance,
    reportCount,
    flagged: false,
    providerBanned: false,
    moderationStatus: 'active',
  });

  const reports = buildSyntheticReports(service, reportCount, seed, baseMetrics.riskLevel);

  return {
    ...service,
    id: safeId,
    moderationStatus: 'active',
    providerBanned: false,
    flagged: false,
    reviewed: false,
    reportCount,
    reports,
    riskLevel: baseMetrics.riskLevel,
    riskScore: baseMetrics.riskScore,
    riskSignals: baseMetrics.riskSignals,
    trustScore: baseMetrics.trustScore,
  };
};

const applyMetrics = (record: AdminServiceRecord): AdminServiceRecord => {
  const metrics = computeModerationMetrics({
    title: record.title,
    shortDescription: record.shortDescription,
    price: record.price,
    verified: record.verified,
    experience: record.experience,
    reviews: record.reviews,
    availability: record.availability,
    distance: record.distance,
    reportCount: record.reportCount,
    flagged: record.flagged,
    providerBanned: record.providerBanned,
    moderationStatus: record.moderationStatus,
  });

  return {
    ...record,
    riskScore: metrics.riskScore,
    riskLevel: metrics.riskLevel,
    riskSignals: metrics.riskSignals,
    trustScore: metrics.trustScore,
  };
};

const getActivityIcon = (type: ActivityType) => {
  if (type === 'hide') {
    return <Trash2 size={14} />;
  }

  if (type === 'verify') {
    return <ShieldCheck size={14} />;
  }

  if (type === 'flag') {
    return <Flag size={14} />;
  }

  if (type === 'ban') {
    return <Ban size={14} />;
  }

  if (type === 'dismiss') {
    return <CheckCircle2 size={14} />;
  }

  if (type === 'bulk') {
    return <Sparkles size={14} />;
  }

  return <Eye size={14} />;
};

export const AdminServicesModerationPage = () => {
  const [services, setServices] = useState<AdminServiceRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activityFeed, setActivityFeed] = useState<ModerationActivity[]>([]);

  const [activeTab, setActiveTab] = useState<ModerationTab>('all');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ServiceCategory>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | ServiceAvailability>('all');
  const [verificationFilter, setVerificationFilter] = useState<VerificationFilter>('all');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingActionState | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);

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

  const showFeedback = useCallback((variant: 'success' | 'error', message: string) => {
    setFeedback({ variant, message });
  }, []);

  useEffect(() => {
    if (!feedback) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setFeedback(null);
    }, 3_800);

    return () => {
      window.clearTimeout(timer);
    };
  }, [feedback]);

  const fetchModerationQueue = useCallback(async (isManualRefresh: boolean = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setErrorMessage(null);

    try {
      const remote = await getServices();
      const source = remote.length > 0 ? remote : servicesData;
      const normalized = source.map((service, index) => normalizeToAdminRecord(service, index));

      setServices(normalized);
      setLastSyncedAt(new Date().toISOString());
      addActivity('system', `Loaded ${normalized.length} services into moderation queue.`);
    } catch (error) {
      const fallback = servicesData.map((service, index) => normalizeToAdminRecord(service, index));
      const message = error instanceof Error ? error.message : 'Failed to fetch services moderation queue.';

      setServices(fallback);
      setErrorMessage(`${message} Showing local preview data.`);
      setLastSyncedAt(new Date().toISOString());
      addActivity('system', 'API unavailable. Loaded local preview dataset for UI moderation.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [addActivity]);

  useEffect(() => {
    void fetchModerationQueue(false);
  }, [fetchModerationQueue]);

  useEffect(() => {
    if (activeServiceId === null) {
      return;
    }

    const exists = services.some((service) => service.id === activeServiceId);
    if (!exists) {
      setActiveServiceId(null);
    }
  }, [activeServiceId, services]);

  const categories = useMemo(() => {
    return Array.from(new Set(services.map((service) => service.category))).sort((left, right) => left.localeCompare(right));
  }, [services]);

  const availabilityOptions = useMemo(() => {
    return Array.from(new Set(services.map((service) => service.availability))).sort((left, right) => left.localeCompare(right));
  }, [services]);

  const stats = useMemo(() => {
    const total = services.length;
    const reported = services.filter((service) => service.reportCount > 0).length;
    const highRisk = services.filter((service) => service.riskLevel === 'high').length;
    const unverified = services.filter((service) => !service.verified).length;
    const hidden = services.filter((service) => service.moderationStatus === 'hidden').length;
    const averagePrice = total > 0
      ? Math.round(services.reduce((sum, service) => sum + service.price, 0) / total)
      : 0;

    return {
      total,
      reported,
      highRisk,
      unverified,
      hidden,
      averagePrice,
    };
  }, [services]);

  const tabCounts = useMemo(() => {
    return {
      all: services.length,
      reported: services.filter((service) => service.reportCount > 0).length,
      highRisk: services.filter((service) => service.riskLevel === 'high').length,
      unverified: services.filter((service) => !service.verified).length,
    };
  }, [services]);

  const riskBreakdown = useMemo(() => {
    return {
      high: services.filter((service) => service.riskLevel === 'high').length,
      medium: services.filter((service) => service.riskLevel === 'medium').length,
      low: services.filter((service) => service.riskLevel === 'low').length,
    };
  }, [services]);

  const filteredServices = useMemo(() => {
    let queue = [...services];

    if (activeTab === 'reported') {
      queue = queue.filter((service) => service.reportCount > 0);
    }

    if (activeTab === 'highRisk') {
      queue = queue.filter((service) => service.riskLevel === 'high');
    }

    if (activeTab === 'unverified') {
      queue = queue.filter((service) => !service.verified);
    }

    const normalizedQuery = searchTerm.trim().toLowerCase();
    if (normalizedQuery) {
      queue = queue.filter((service) => {
        const searchable = [
          service.title,
          service.providerName,
          service.category,
          service.location,
          service.shortDescription,
        ]
          .join(' ')
          .toLowerCase();

        return searchable.includes(normalizedQuery);
      });
    }

    if (categoryFilter !== 'all') {
      queue = queue.filter((service) => service.category === categoryFilter);
    }

    if (availabilityFilter !== 'all') {
      queue = queue.filter((service) => service.availability === availabilityFilter);
    }

    if (verificationFilter === 'verified') {
      queue = queue.filter((service) => service.verified);
    }

    if (verificationFilter === 'unverified') {
      queue = queue.filter((service) => !service.verified);
    }

    if (riskFilter !== 'all') {
      queue = queue.filter((service) => service.riskLevel === riskFilter);
    }

    if (statusFilter === 'active') {
      queue = queue.filter((service) => service.moderationStatus === 'active');
    }

    if (statusFilter === 'hidden') {
      queue = queue.filter((service) => service.moderationStatus === 'hidden');
    }

    if (statusFilter === 'banned') {
      queue = queue.filter((service) => service.providerBanned);
    }

    return queue.sort((left, right) => {
      if (sortMode === 'newest') {
        return right.createdAt - left.createdAt;
      }

      if (sortMode === 'oldest') {
        return left.createdAt - right.createdAt;
      }

      if (sortMode === 'risk') {
        return right.riskScore - left.riskScore;
      }

      if (sortMode === 'reports') {
        return right.reportCount - left.reportCount;
      }

      if (sortMode === 'priceHigh') {
        return right.price - left.price;
      }

      return left.price - right.price;
    });
  }, [
    activeTab,
    availabilityFilter,
    categoryFilter,
    riskFilter,
    searchTerm,
    services,
    sortMode,
    statusFilter,
    verificationFilter,
  ]);

  const activeService = useMemo(() => {
    if (!activeServiceId) {
      return null;
    }

    return services.find((service) => service.id === activeServiceId) ?? null;
  }, [activeServiceId, services]);

  const selectedCount = selectedIds.length;

  const toggleSelection = useCallback((serviceId: string) => {
    setSelectedIds((previous) => {
      if (previous.includes(serviceId)) {
        return previous.filter((id) => id !== serviceId);
      }

      return [...previous, serviceId];
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const openActionModal = useCallback((kind: PendingActionKind, targetIds: string[], contextId: string | null = null) => {
    setPendingAction({
      kind,
      targetIds,
      contextId,
    });
    setActionReason('');
  }, []);

  const closeActionModal = useCallback(() => {
    if (isActionSubmitting) {
      return;
    }

    setPendingAction(null);
    setActionReason('');
  }, [isActionSubmitting]);

  const applyAction = useCallback((kind: PendingActionKind, targetIds: string[], reason: string) => {
    const targetSet = new Set(targetIds);

    setServices((previous) => {
      return previous.map((service) => {
        if (!targetSet.has(service.id)) {
          return service;
        }

        let next: AdminServiceRecord = service;

        if (kind === 'hide' || kind === 'bulkHide') {
          next = {
            ...next,
            moderationStatus: 'hidden',
            reviewed: true,
          };
        }

        if (kind === 'verify' || kind === 'bulkVerify') {
          next = {
            ...next,
            verified: true,
            reviewed: true,
            flagged: false,
          };
        }

        if (kind === 'flag') {
          const report: ModerationReport = {
            id: `${service.id}-manual-${Date.now()}`,
            reason: reason || 'Moderator escalation',
            message: reason || 'Escalated for manual review',
            severity: 'high',
            reporterName: 'Admin moderator',
            createdAt: new Date().toISOString(),
          };

          next = {
            ...next,
            flagged: true,
            reportCount: service.reportCount + 1,
            reports: [report, ...service.reports].slice(0, 8),
            reviewed: true,
          };
        }

        if (kind === 'dismissReports' || kind === 'bulkDismissReports') {
          next = {
            ...next,
            reportCount: 0,
            reports: [],
            flagged: false,
            reviewed: true,
          };
        }

        if (kind === 'banProvider') {
          next = {
            ...next,
            providerBanned: true,
            moderationStatus: 'hidden',
            reviewed: true,
          };
        }

        return applyMetrics(next);
      });
    });
  }, []);

  const confirmAction = useCallback(async () => {
    if (!pendingAction) {
      return;
    }

    const reason = actionReason.trim();
    const needsReason = pendingAction.kind === 'hide'
      || pendingAction.kind === 'bulkHide'
      || pendingAction.kind === 'flag'
      || pendingAction.kind === 'banProvider';

    if (needsReason && reason.length < 3) {
      showFeedback('error', 'Please provide at least 3 characters for moderation reason.');
      return;
    }

    let resolvedIds = [...pendingAction.targetIds];

    if (pendingAction.kind === 'banProvider' && pendingAction.contextId) {
      const targetService = services.find((service) => service.id === pendingAction.contextId) ?? null;

      if (targetService) {
        const providerKey = buildProviderKey(targetService);
        resolvedIds = services
          .filter((service) => buildProviderKey(service) === providerKey)
          .map((service) => service.id);
      }
    }

    if (resolvedIds.length === 0) {
      setPendingAction(null);
      setActionReason('');
      return;
    }

    setIsActionSubmitting(true);

    await new Promise((resolve) => {
      window.setTimeout(resolve, 360);
    });

    applyAction(pendingAction.kind, resolvedIds, reason);

    setSelectedIds((previous) => previous.filter((id) => !resolvedIds.includes(id)));

    const count = resolvedIds.length;

    if (pendingAction.kind === 'hide' || pendingAction.kind === 'bulkHide') {
      addActivity(count > 1 ? 'bulk' : 'hide', `Hidden ${count} service listing(s) from public queue.`);
      showFeedback('success', `${count} service listing(s) hidden.`);
    }

    if (pendingAction.kind === 'verify' || pendingAction.kind === 'bulkVerify') {
      addActivity(count > 1 ? 'bulk' : 'verify', `Verified ${count} provider profile(s).`);
      showFeedback('success', `${count} provider profile(s) verified.`);
    }

    if (pendingAction.kind === 'flag') {
      addActivity('flag', 'Escalated selected service with a manual moderation report.');
      showFeedback('success', 'Service flagged for manual escalation.');
    }

    if (pendingAction.kind === 'banProvider') {
      addActivity('ban', `Banned provider and hid ${count} linked service listing(s).`);
      showFeedback('success', `Provider banned in UI preview. ${count} linked listing(s) hidden.`);
    }

    if (pendingAction.kind === 'dismissReports' || pendingAction.kind === 'bulkDismissReports') {
      addActivity(count > 1 ? 'bulk' : 'dismiss', `Dismissed reports for ${count} service listing(s).`);
      showFeedback('success', `Reports cleared for ${count} service listing(s).`);
    }

    setPendingAction(null);
    setActionReason('');
    setIsActionSubmitting(false);
  }, [
    actionReason,
    addActivity,
    applyAction,
    pendingAction,
    services,
    showFeedback,
  ]);

  const modalCopy = pendingAction ? ACTION_COPY[pendingAction.kind] : null;

  return (
    <motion.section
      className="asp-page"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34 }}
    >
      <header className="asp-hero">
        <div className="asp-hero-copy">
          <p className="asp-kicker">Admin Moderation Console</p>
          <h1>Service Trust Studio</h1>
          <p>
            Audit neighborhood service listings, enforce provider trust policy, and keep discovery safe with a
            risk-aware moderation queue.
          </p>
        </div>

        <div className="asp-hero-actions">
          <span className="asp-sync-chip">
            <Clock3 size={14} /> Last Sync: {formatSince(lastSyncedAt)}
          </span>
          <button
            type="button"
            className="asp-btn asp-btn-primary"
            onClick={() => void fetchModerationQueue(true)}
            disabled={isRefreshing}
          >
            <RefreshCw size={14} className={isRefreshing ? 'asp-spin' : ''} />
            {isRefreshing ? 'Refreshing' : 'Refresh Queue'}
          </button>
        </div>
      </header>

      <section className="asp-stats-grid" aria-label="Service moderation stats">
        <article className="asp-stat-card">
          <p>
            <Eye size={14} /> Total Services
          </p>
          <h3>{stats.total}</h3>
          <span>{formatCurrency(stats.averagePrice)} average price</span>
        </article>

        <article className="asp-stat-card asp-stat-card-alert">
          <p>
            <AlertTriangle size={14} /> Reported Queue
          </p>
          <h3>{stats.reported}</h3>
          <span>Community reports</span>
        </article>

        <article className="asp-stat-card asp-stat-card-danger">
          <p>
            <ShieldAlert size={14} /> High Risk
          </p>
          <h3>{stats.highRisk}</h3>
          <span>Needs immediate review</span>
        </article>

        <article className="asp-stat-card">
          <p>
            <UserRound size={14} /> Unverified Providers
          </p>
          <h3>{stats.unverified}</h3>
          <span>Trust gap</span>
        </article>

        <article className="asp-stat-card">
          <p>
            <Ban size={14} /> Hidden Listings
          </p>
          <h3>{stats.hidden}</h3>
          <span>Removed from queue</span>
        </article>
      </section>

      <section className="asp-control-panel" aria-label="Service moderation controls">
        <div className="asp-search-box">
          <Search size={16} />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by title, provider, category, or location"
          />
        </div>

        <div className="asp-filters-row">
          <label>
            <span>Sort</span>
            <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
              {(Object.keys(SORT_LABELS) as SortMode[]).map((mode) => (
                <option key={mode} value={mode}>
                  {SORT_LABELS[mode]}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Category</span>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value as 'all' | ServiceCategory)}
            >
              <option value="all">All</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Availability</span>
            <select
              value={availabilityFilter}
              onChange={(event) => setAvailabilityFilter(event.target.value as 'all' | ServiceAvailability)}
            >
              <option value="all">All</option>
              {availabilityOptions.map((availability) => (
                <option key={availability} value={availability}>
                  {availability}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Provider</span>
            <select
              value={verificationFilter}
              onChange={(event) => setVerificationFilter(event.target.value as VerificationFilter)}
            >
              <option value="all">All</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </label>

          <label>
            <span>Risk</span>
            <select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value as RiskFilter)}>
              <option value="all">All</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>

          <label>
            <span>Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="hidden">Hidden</option>
              <option value="banned">Banned</option>
            </select>
          </label>
        </div>

        <div className="asp-tabs" role="tablist" aria-label="Service moderation tabs">
          {(Object.keys(TAB_LABELS) as ModerationTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              className={`asp-tab ${activeTab === tab ? 'asp-tab-active' : ''}`}
              onClick={() => setActiveTab(tab)}
              aria-selected={activeTab === tab}
            >
              <span>{TAB_LABELS[tab]}</span>
              <strong>{tabCounts[tab]}</strong>
            </button>
          ))}
        </div>
      </section>

      <AnimatePresence>
        {selectedCount > 0 ? (
          <motion.section
            className="asp-bulk-bar"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <p>{selectedCount} service listing(s) selected.</p>
            <div className="asp-bulk-actions">
              <button
                type="button"
                className="asp-btn asp-btn-subtle"
                onClick={() => openActionModal('bulkVerify', selectedIds)}
              >
                <ShieldCheck size={14} /> Verify Selected
              </button>
              <button
                type="button"
                className="asp-btn asp-btn-danger"
                onClick={() => openActionModal('bulkHide', selectedIds)}
              >
                <Trash2 size={14} /> Hide Selected
              </button>
              <button
                type="button"
                className="asp-btn asp-btn-subtle"
                onClick={() => openActionModal('bulkDismissReports', selectedIds)}
              >
                <CheckCircle2 size={14} /> Dismiss Reports
              </button>
              <button type="button" className="asp-btn asp-btn-ghost" onClick={clearSelection}>
                Clear
              </button>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {feedback ? (
          <motion.div
            className={`asp-feedback asp-feedback-${feedback.variant}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {feedback.message}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {errorMessage ? <div className="asp-error-banner">{errorMessage}</div> : null}

      <div className="asp-layout">
        <section className="asp-queue" aria-label="Service moderation queue">
          {isLoading ? (
            <div className="asp-skeleton-grid">
              {Array.from({ length: 6 }).map((_, index) => (
                <article key={`service-skeleton-${index}`} className="asp-skeleton-card" />
              ))}
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="asp-empty-state">
              <h3>No services match these filters</h3>
              <p>Broaden search and filters to repopulate the moderation queue.</p>
            </div>
          ) : (
            <motion.div
              className="asp-cards"
              variants={cardContainerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredServices.map((service) => {
                const isSelected = selectedIds.includes(service.id);

                return (
                  <motion.article
                    key={service.id}
                    className={`asp-card ${service.moderationStatus === 'hidden' ? 'asp-card-hidden' : ''}`}
                    variants={cardItemVariants}
                  >
                    <div className="asp-card-top">
                      <label className="asp-select" htmlFor={`service-${service.id}`}>
                        <input
                          id={`service-${service.id}`}
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelection(service.id)}
                        />
                        Select
                      </label>

                      <div className="asp-card-pills">
                        {service.reportCount > 0 ? (
                          <span className="asp-status-pill asp-status-pill-report">
                            <Flag size={12} /> {service.reportCount} report(s)
                          </span>
                        ) : null}

                        {service.providerBanned ? (
                          <span className="asp-status-pill asp-status-pill-ban">
                            <Ban size={12} /> Banned
                          </span>
                        ) : null}

                        <span className={`asp-risk-pill asp-risk-${service.riskLevel}`}>
                          {service.riskLevel.toUpperCase()} · {service.riskScore}
                        </span>
                      </div>
                    </div>

                    <div className="asp-card-main">
                      <h3>{service.title}</h3>
                      <p>{service.shortDescription}</p>

                      <div className="asp-card-meta">
                        <span className="asp-chip">{service.category}</span>
                        <span className="asp-chip">{formatCurrency(service.price)} / {service.priceUnit}</span>
                        <span className="asp-chip">{service.availability}</span>
                        <span className="asp-chip">
                          <MapPin size={12} /> {service.location || 'Unknown'}
                        </span>
                      </div>

                      <div className="asp-provider">
                        <img
                          className="asp-provider-avatar"
                          src={service.avatar}
                          alt={service.providerName}
                          loading="lazy"
                        />
                        <div className="asp-provider-meta">
                          <p>{service.providerName}</p>
                          <span>{service.experience}y exp · {service.reviews} reviews · {service.responseTime}</span>
                        </div>
                        {service.verified ? (
                          <span className="asp-verified-chip">
                            <ShieldCheck size={13} /> Verified
                          </span>
                        ) : (
                          <span className="asp-unverified-chip">
                            <AlertTriangle size={13} /> Unverified
                          </span>
                        )}
                      </div>

                      <div className="asp-trust">
                        <div className="asp-trust-row">
                          <span>Trust score</span>
                          <strong>{service.trustScore}</strong>
                        </div>
                        <div className="asp-progress-track" role="presentation">
                          <span style={{ width: `${service.trustScore}%` }} />
                        </div>
                      </div>

                      <div className="asp-signal-list">
                        {service.riskSignals.slice(0, 2).map((signal) => (
                          <span key={`${service.id}-${signal}`} className="asp-signal">
                            <ShieldAlert size={12} /> {signal}
                          </span>
                        ))}
                      </div>

                      <div className="asp-card-actions">
                        <div className="asp-card-action-row">
                          <button type="button" className="asp-btn asp-btn-subtle" onClick={() => setActiveServiceId(service.id)}>
                            <Eye size={14} /> Review
                          </button>
                          <button
                            type="button"
                            className="asp-btn asp-btn-subtle"
                            onClick={() => openActionModal('verify', [service.id], service.id)}
                            disabled={service.verified && !service.flagged}
                          >
                            <ShieldCheck size={14} /> Verify
                          </button>
                          <button
                            type="button"
                            className="asp-btn asp-btn-danger"
                            onClick={() => openActionModal('hide', [service.id], service.id)}
                            disabled={service.moderationStatus === 'hidden'}
                          >
                            <Trash2 size={14} /> Hide
                          </button>
                        </div>

                        <div className="asp-card-action-row">
                          <button
                            type="button"
                            className="asp-link-btn"
                            onClick={() => openActionModal('flag', [service.id], service.id)}
                          >
                            <Flag size={14} /> Flag
                          </button>
                          <button
                            type="button"
                            className="asp-link-btn"
                            onClick={() => openActionModal('dismissReports', [service.id], service.id)}
                            disabled={service.reportCount === 0}
                          >
                            <CheckCircle2 size={14} /> Dismiss reports
                          </button>
                          <button
                            type="button"
                            className="asp-link-btn asp-link-btn-danger"
                            onClick={() => openActionModal('banProvider', [service.id], service.id)}
                            disabled={service.providerBanned}
                          >
                            <Ban size={14} /> Ban provider
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </motion.div>
          )}
        </section>

        <aside className="asp-insights" aria-label="Service moderation insights">
          <article className="asp-insight-card">
            <h3>
              <Filter size={15} /> Risk Distribution
            </h3>
            <div className="asp-health-row">
              <span>High</span>
              <strong>{riskBreakdown.high}</strong>
            </div>
            <div className="asp-health-row">
              <span>Medium</span>
              <strong>{riskBreakdown.medium}</strong>
            </div>
            <div className="asp-health-row">
              <span>Low</span>
              <strong>{riskBreakdown.low}</strong>
            </div>
          </article>

          <article className="asp-insight-card">
            <h3>
              <Sparkles size={15} /> Moderation Activity
            </h3>

            {activityFeed.length === 0 ? (
              <p className="asp-empty-activity">No activity logged yet.</p>
            ) : (
              <ul className="asp-activity-list">
                {activityFeed.map((item) => (
                  <li key={item.id} className="asp-activity-item">
                    <span className={`asp-activity-icon asp-activity-${item.type}`}>
                      {getActivityIcon(item.type)}
                    </span>
                    <div className="asp-activity-copy">
                      <p>{item.label}</p>
                      <time dateTime={item.timestamp}>{formatSince(item.timestamp)}</time>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </aside>
      </div>

      <AnimatePresence>
        {activeService ? (
          <motion.div
            className="asp-drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveServiceId(null)}
          >
            <motion.section
              className="asp-drawer"
              initial={{ x: 36, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 28, opacity: 0 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              onClick={(event) => event.stopPropagation()}
              aria-label="Service moderation details"
            >
              <header className="asp-drawer-header">
                <div>
                  <p className="asp-kicker">Service Review</p>
                  <h3>{activeService.title}</h3>
                </div>
                <button
                  type="button"
                  className="asp-close-btn"
                  onClick={() => setActiveServiceId(null)}
                  aria-label="Close details"
                >
                  <X size={18} />
                </button>
              </header>

              <div className="asp-drawer-content">
                <div className="asp-drawer-grid">
                  <article className="asp-detail-block">
                    <h4>Moderation Snapshot</h4>
                    <p>{activeService.fullDescription || activeService.shortDescription}</p>

                    <div className="asp-detail-meta">
                      <span>
                        <ShieldAlert size={13} /> Risk: {activeService.riskLevel.toUpperCase()} ({activeService.riskScore})
                      </span>
                      <span>
                        <ShieldCheck size={13} /> Trust score: {activeService.trustScore}
                      </span>
                      <span>
                        <MapPin size={13} /> {activeService.location || 'Unknown location'}
                      </span>
                    </div>

                    <div className="asp-signal-list">
                      {activeService.riskSignals.map((signal) => (
                        <span key={`drawer-${activeService.id}-${signal}`} className="asp-signal">
                          <AlertTriangle size={12} /> {signal}
                        </span>
                      ))}
                    </div>
                  </article>

                  <article className="asp-detail-block">
                    <h4>Provider Profile</h4>
                    <div className="asp-provider">
                      <img
                        className="asp-provider-avatar"
                        src={activeService.avatar}
                        alt={activeService.providerName}
                        loading="lazy"
                      />
                      <div className="asp-provider-meta">
                        <p>{activeService.providerName}</p>
                        <span>{activeService.experience} years experience · {activeService.reviews} reviews</span>
                      </div>
                    </div>
                    <p className="asp-detail-line">Category: {activeService.category}</p>
                    <p className="asp-detail-line">Pricing: {formatCurrency(activeService.price)} / {activeService.priceUnit}</p>
                    <p className="asp-detail-line">Availability: {activeService.availability}</p>
                    <p className="asp-detail-line">Service radius: {toSafeNumber(activeService.radius)} meters</p>
                    <p className="asp-detail-line">Created: {new Date(activeService.createdAt).toLocaleDateString()}</p>
                  </article>

                  <article className="asp-detail-block">
                    <h4>Community Reports</h4>
                    {activeService.reportCount === 0 ? (
                      <p>No active reports in queue.</p>
                    ) : (
                      <ul className="asp-report-list">
                        {activeService.reports.map((report) => (
                          <li key={report.id} className="asp-report-item">
                            <div>
                              <strong>{report.reason}</strong>
                              <p>{report.message}</p>
                            </div>
                            <span className={`asp-risk-pill asp-risk-${report.severity}`}>{report.severity}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                </div>

                <footer className="asp-drawer-actions">
                  <button
                    type="button"
                    className="asp-btn asp-btn-subtle"
                    onClick={() => openActionModal('verify', [activeService.id], activeService.id)}
                  >
                    <ShieldCheck size={14} /> Verify
                  </button>
                  <button
                    type="button"
                    className="asp-btn asp-btn-subtle"
                    onClick={() => openActionModal('dismissReports', [activeService.id], activeService.id)}
                    disabled={activeService.reportCount === 0}
                  >
                    <CheckCircle2 size={14} /> Dismiss reports
                  </button>
                  <button
                    type="button"
                    className="asp-btn asp-btn-danger"
                    onClick={() => openActionModal('hide', [activeService.id], activeService.id)}
                    disabled={activeService.moderationStatus === 'hidden'}
                  >
                    <Trash2 size={14} /> Hide service
                  </button>
                </footer>
              </div>
            </motion.section>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {pendingAction && modalCopy ? (
          <motion.div
            className="asp-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeActionModal}
          >
            <motion.section
              className="asp-modal"
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={(event) => event.stopPropagation()}
              aria-label="Confirm moderation action"
            >
              <header className="asp-modal-header">
                <h3>{modalCopy.title}</h3>
                <button
                  type="button"
                  className="asp-close-btn"
                  onClick={closeActionModal}
                  aria-label="Close action modal"
                >
                  <X size={16} />
                </button>
              </header>

              <div className="asp-modal-body">
                <p>{modalCopy.description}</p>
                <p className="asp-helper-text">
                  Target items: {pendingAction.targetIds.length}
                </p>

                {pendingAction.kind === 'hide'
                || pendingAction.kind === 'bulkHide'
                || pendingAction.kind === 'flag'
                || pendingAction.kind === 'banProvider' ? (
                  <label>
                    <span>Moderation reason</span>
                    <textarea
                      value={actionReason}
                      onChange={(event) => setActionReason(event.target.value)}
                      rows={4}
                      placeholder="Provide a clear action reason for audit trail"
                    />
                  </label>
                  ) : null}
              </div>

              <footer className="asp-modal-actions">
                <button type="button" className="asp-btn asp-btn-ghost" onClick={closeActionModal}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="asp-btn asp-btn-primary"
                  onClick={() => void confirmAction()}
                  disabled={isActionSubmitting}
                >
                  {isActionSubmitting ? 'Applying...' : modalCopy.confirmLabel}
                </button>
              </footer>
            </motion.section>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.section>
  );
};
