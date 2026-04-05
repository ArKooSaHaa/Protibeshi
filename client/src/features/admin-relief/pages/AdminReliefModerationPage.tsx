import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
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
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  dismissAdminReliefReports,
  getAdminReliefs,
  removeAdminReliefRequest,
} from '@/services/reliefService.ts';
import '../styles/AdminReliefModerationPage.css';

type RiskLevel = 'high' | 'medium' | 'low';
type ModerationTab = 'all' | 'reported' | 'highRisk';
type SortMode = 'newest' | 'oldest' | 'reports' | 'risk';
type PendingActionKind = 'dismiss' | 'remove' | 'bulkDismiss';
type ActivityType = 'system' | 'dismiss' | 'remove' | 'bulk';

type ApiAdminReliefReporter = {
  id?: number | string;
  name?: string | null;
  username?: string | null;
} | null;

type ApiAdminReliefReport = {
  id?: number | string;
  reason?: string | null;
  message?: string | null;
  severity?: string | null;
  created_at?: string | null;
  reporter?: ApiAdminReliefReporter;
};

type ApiAdminReliefRequester = {
  id?: number | string;
  first_name?: string | null;
  last_name?: string | null;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  profile_picture?: string | null;
  profile_picture_url?: string | null;
  is_banned?: boolean;
  banned_until?: string | null;
};

type ApiAdminReliefItem = {
  id?: number | string;
  title?: string | null;
  type?: string | null;
  description?: string | null;
  urgency?: string | null;
  time_sensitivity?: string | null;
  visibility?: string | null;
  contact_preference?: string | null;
  location?: string | null;
  status?: string | null;
  helpers_count?: number | string | null;
  comment_count?: number | string | null;
  report_count?: number | string | null;
  risk_level?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  reports?: ApiAdminReliefReport[] | null;
  requester?: ApiAdminReliefRequester | null;
  user?: ApiAdminReliefRequester | null;
};

type AdminReliefRecord = {
  id: number;
  title: string;
  type: string;
  description: string;
  urgency: string;
  timeSensitivity: string;
  visibility: string;
  contactPreference: string;
  location: string;
  status: string;
  helpersCount: number;
  commentCount: number;
  reportCount: number;
  riskLevel: RiskLevel;
  riskScore: number;
  riskReasons: string[];
  createdAt: string;
  updatedAt: string;
  requester: {
    id: number;
    name: string;
    username: string;
    email: string;
    avatarUrl: string | null;
    isBanned: boolean;
    bannedUntil: string | null;
  };
  reports: Array<{
    id: number;
    reason: string;
    message: string;
    severity: RiskLevel;
    createdAt: string;
    reporterName: string;
  }>;
};

type PendingActionState = {
  kind: PendingActionKind;
  relief: AdminReliefRecord | null;
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
  all: 'All Requests',
  reported: 'Reported',
  highRisk: 'High Risk',
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

const toRiskLevel = (value: string | null | undefined): RiskLevel | null => {
  const normalized = normalizeText(value).toLowerCase();

  if (normalized === 'high' || normalized === 'medium' || normalized === 'low') {
    return normalized;
  }

  return null;
};

const toTitleCase = (value: string): string => {
  if (!value) {
    return 'Unknown';
  }

  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
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

const resolveRequesterName = (requester: ApiAdminReliefRequester | null | undefined): string => {
  if (!requester) {
    return 'Unknown requester';
  }

  const explicitName = normalizeText(requester.name);
  if (explicitName) {
    return explicitName;
  }

  const fullName = `${normalizeText(requester.first_name)} ${normalizeText(requester.last_name)}`.trim();
  if (fullName) {
    return fullName;
  }

  const username = normalizeText(requester.username);
  if (username) {
    return username;
  }

  const email = normalizeText(requester.email);
  if (email) {
    return email;
  }

  return 'Unknown requester';
};

const deriveRisk = (input: {
  reportCount: number;
  urgency: string;
  title: string;
  description: string;
  reports: Array<{ reason: string; severity: RiskLevel }>;
}): { level: RiskLevel; score: number; reasons: string[] } => {
  let score = 0;
  const reasons: string[] = [];
  const urgency = input.urgency.toLowerCase();
  const text = `${input.title} ${input.description}`.toLowerCase();

  if (input.reportCount >= 4) {
    score += 50;
    reasons.push('Multiple community reports submitted');
  } else if (input.reportCount >= 2) {
    score += 34;
    reasons.push('Repeated community reports');
  } else if (input.reportCount >= 1) {
    score += 18;
    reasons.push('At least one report requires review');
  }

  if (urgency === 'critical' || urgency === 'urgent') {
    score += 8;
    reasons.push('High urgency wording may need verification');
  }

  if (/(send money|wire transfer|cash only|bkash first|payment first)/i.test(text)) {
    score += 24;
    reasons.push('Potential payment solicitation pattern');
  }

  if (input.reports.some((report) => report.severity === 'high')) {
    score += 20;
    reasons.push('High-severity report reason detected');
  }

  if (reasons.length === 0) {
    reasons.push('No major risk indicators detected');
  }

  const level: RiskLevel = score >= 52 ? 'high' : score >= 28 ? 'medium' : 'low';

  return {
    level,
    score,
    reasons,
  };
};

const normalizeReliefItem = (raw: ApiAdminReliefItem, index: number): AdminReliefRecord => {
  const requester = raw.requester ?? raw.user ?? null;
  const requesterName = resolveRequesterName(requester);

  const reports = (Array.isArray(raw.reports) ? raw.reports : []).map((report, reportIndex) => {
    const reason = normalizeText(report.reason) || 'Reported by community member';
    const severity = toRiskLevel(report.severity) || 'low';

    return {
      id: Math.max(1, toSafeNumber(report.id) || reportIndex + 1),
      reason,
      message: normalizeText(report.message) || reason,
      severity,
      createdAt: normalizeText(report.created_at) || new Date().toISOString(),
      reporterName: normalizeText(report.reporter?.name)
        || normalizeText(report.reporter?.username)
        || 'Community member',
    };
  });

  const reportCount = Math.max(0, toSafeNumber(raw.report_count) || reports.length);
  const normalizedUrgency = normalizeText(raw.urgency) || 'normal';
  const normalizedType = normalizeText(raw.type) || 'General';
  const normalizedStatus = normalizeText(raw.status) || 'open';

  const derivedRisk = deriveRisk({
    reportCount,
    urgency: normalizedUrgency,
    title: normalizeText(raw.title) || `Relief request #${index + 1}`,
    description: normalizeText(raw.description),
    reports,
  });

  const apiRisk = toRiskLevel(raw.risk_level);

  return {
    id: Math.max(1, toSafeNumber(raw.id) || index + 1),
    title: normalizeText(raw.title) || `Relief request #${index + 1}`,
    type: normalizedType,
    description: normalizeText(raw.description) || 'No description provided.',
    urgency: normalizedUrgency,
    timeSensitivity: normalizeText(raw.time_sensitivity) || 'Not specified',
    visibility: normalizeText(raw.visibility) || 'public',
    contactPreference: normalizeText(raw.contact_preference) || 'in_app',
    location: normalizeText(raw.location) || 'Unknown location',
    status: normalizedStatus,
    helpersCount: Math.max(0, toSafeNumber(raw.helpers_count)),
    commentCount: Math.max(0, toSafeNumber(raw.comment_count)),
    reportCount,
    riskLevel: apiRisk || derivedRisk.level,
    riskScore: derivedRisk.score,
    riskReasons: derivedRisk.reasons,
    createdAt: normalizeText(raw.created_at) || new Date().toISOString(),
    updatedAt: normalizeText(raw.updated_at) || new Date().toISOString(),
    requester: {
      id: Math.max(1, toSafeNumber(requester?.id) || index + 1),
      name: requesterName,
      username: normalizeText(requester?.username) || requesterName.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      email: normalizeText(requester?.email) || 'No email provided',
      avatarUrl: normalizeText(requester?.profile_picture_url ?? requester?.profile_picture) || null,
      isBanned: Boolean(requester?.is_banned),
      bannedUntil: normalizeText(requester?.banned_until) || null,
    },
    reports,
  };
};

const getActivityIcon = (type: ActivityType) => {
  if (type === 'dismiss') {
    return <CheckCircle2 size={14} />;
  }

  if (type === 'remove') {
    return <Trash2 size={14} />;
  }

  if (type === 'bulk') {
    return <Filter size={14} />;
  }

  return <ShieldCheck size={14} />;
};

export const AdminReliefModerationPage = () => {
  const [reliefs, setReliefs] = useState<AdminReliefRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [activityFeed, setActivityFeed] = useState<ModerationActivity[]>([]);

  const [activeTab, setActiveTab] = useState<ModerationTab>('all');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const [activeReliefId, setActiveReliefId] = useState<number | null>(null);
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
    }, 4200);

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
    ].slice(0, 20));
  }, []);

  const fetchReliefs = useCallback(async (isManualRefresh: boolean = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setErrorMessage(null);

    try {
      const rawReliefs = await getAdminReliefs();
      const normalized = rawReliefs.map((item: ApiAdminReliefItem, index: number) =>
        normalizeReliefItem(item, index));

      setReliefs(normalized);
      setLastSyncedAt(new Date().toISOString());
      addActivity('system', `Loaded ${normalized.length} relief requests for moderation.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load admin relief moderation queue.';
      setErrorMessage(message);
      showFeedback('error', message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [addActivity, showFeedback]);

  useEffect(() => {
    void fetchReliefs(false);
  }, [fetchReliefs]);

  useEffect(() => {
    if (activeReliefId === null) {
      return;
    }

    const exists = reliefs.some((relief) => relief.id === activeReliefId);
    if (!exists) {
      setActiveReliefId(null);
    }
  }, [activeReliefId, reliefs]);

  const urgencyOptions = useMemo(() => {
    return Array.from(new Set(reliefs.map((relief) => toTitleCase(relief.urgency)))).sort((a, b) => a.localeCompare(b));
  }, [reliefs]);

  const statusOptions = useMemo(() => {
    return Array.from(new Set(reliefs.map((relief) => toTitleCase(relief.status)))).sort((a, b) => a.localeCompare(b));
  }, [reliefs]);

  const stats = useMemo(() => {
    const total = reliefs.length;
    const reported = reliefs.filter((relief) => relief.reportCount > 0).length;
    const highRisk = reliefs.filter((relief) => relief.riskLevel === 'high').length;
    const criticalUrgency = reliefs.filter((relief) => relief.urgency.toLowerCase() === 'critical').length;
    const completed = reliefs.filter((relief) => relief.status.toLowerCase() === 'completed').length;

    return {
      total,
      reported,
      highRisk,
      criticalUrgency,
      completed,
    };
  }, [reliefs]);

  const tabCounts = useMemo(() => {
    return {
      all: reliefs.length,
      reported: reliefs.filter((relief) => relief.reportCount > 0).length,
      highRisk: reliefs.filter((relief) => relief.riskLevel === 'high').length,
    };
  }, [reliefs]);

  const filteredReliefs = useMemo(() => {
    let data = [...reliefs];

    if (activeTab === 'reported') {
      data = data.filter((relief) => relief.reportCount > 0);
    }

    if (activeTab === 'highRisk') {
      data = data.filter((relief) => relief.riskLevel === 'high');
    }

    const normalizedQuery = searchTerm.trim().toLowerCase();
    if (normalizedQuery) {
      data = data.filter((relief) => {
        const searchable = [
          relief.title,
          relief.type,
          relief.description,
          relief.location,
          relief.requester.name,
          relief.requester.username,
          relief.requester.email,
        ].join(' ').toLowerCase();

        return searchable.includes(normalizedQuery);
      });
    }

    if (urgencyFilter !== 'all') {
      data = data.filter((relief) => toTitleCase(relief.urgency) === urgencyFilter);
    }

    if (statusFilter !== 'all') {
      data = data.filter((relief) => toTitleCase(relief.status) === statusFilter);
    }

    return data.sort((left, right) => {
      if (sortMode === 'newest') {
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      }

      if (sortMode === 'oldest') {
        return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
      }

      if (sortMode === 'reports') {
        return right.reportCount - left.reportCount;
      }

      return right.riskScore - left.riskScore;
    });
  }, [
    activeTab,
    reliefs,
    searchTerm,
    urgencyFilter,
    statusFilter,
    sortMode,
  ]);

  const activeRelief = useMemo(() => {
    if (activeReliefId === null) {
      return null;
    }

    return reliefs.find((relief) => relief.id === activeReliefId) ?? null;
  }, [activeReliefId, reliefs]);

  const toggleSelection = useCallback((reliefId: number) => {
    setSelectedIds((previous) => {
      if (previous.includes(reliefId)) {
        return previous.filter((id) => id !== reliefId);
      }

      return [...previous, reliefId];
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const openActionModal = useCallback((kind: PendingActionKind, relief: AdminReliefRecord | null) => {
    setPendingAction({ kind, relief });
    setActionReason('');
  }, []);

  const closeActionModal = useCallback(() => {
    if (isActionSubmitting) {
      return;
    }

    setPendingAction(null);
    setActionReason('');
  }, [isActionSubmitting]);

  const applyDismissResult = useCallback((targetId: number) => {
    setReliefs((previous) => previous.map((relief) => {
      if (relief.id !== targetId) {
        return relief;
      }

      const derived = deriveRisk({
        reportCount: 0,
        urgency: relief.urgency,
        title: relief.title,
        description: relief.description,
        reports: [],
      });

      return {
        ...relief,
        reportCount: 0,
        reports: [],
        riskLevel: derived.level,
        riskScore: derived.score,
        riskReasons: derived.reasons,
      };
    }));
  }, []);

  const confirmPendingAction = useCallback(async () => {
    if (!pendingAction) {
      return;
    }

    setIsActionSubmitting(true);

    try {
      if (pendingAction.kind === 'dismiss' && pendingAction.relief) {
        const response = await dismissAdminReliefReports(pendingAction.relief.id);

        applyDismissResult(pendingAction.relief.id);
        setSelectedIds((previous) => previous.filter((id) => id !== pendingAction.relief?.id));

        addActivity('dismiss', `Cleared reports for “${pendingAction.relief.title}”.`);
        showFeedback('success', response.message);
      }

      if (pendingAction.kind === 'bulkDismiss') {
        if (selectedIds.length === 0) {
          setPendingAction(null);
          setIsActionSubmitting(false);
          return;
        }

        const ids = [...selectedIds];
        const results = await Promise.allSettled(ids.map((id) => dismissAdminReliefReports(id)));

        const successfulIds: number[] = [];
        let failedCount = 0;

        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            successfulIds.push(ids[index]);
          } else {
            failedCount += 1;
          }
        });

        successfulIds.forEach((id) => applyDismissResult(id));
        setSelectedIds((previous) => previous.filter((id) => !successfulIds.includes(id)));

        if (successfulIds.length > 0) {
          addActivity('bulk', `Bulk dismissed reports for ${successfulIds.length} relief request(s).`);
        }

        if (failedCount > 0) {
          showFeedback('error', `${failedCount} request(s) failed while dismissing reports.`);
        } else {
          showFeedback('success', `${successfulIds.length} request(s) cleared successfully.`);
        }
      }

      if (pendingAction.kind === 'remove' && pendingAction.relief) {
        const trimmedReason = actionReason.trim();
        if (trimmedReason.length < 3) {
          showFeedback('error', 'Please provide at least 3 characters as a moderation reason.');
          setIsActionSubmitting(false);
          return;
        }

        const response = await removeAdminReliefRequest(pendingAction.relief.id, trimmedReason);

        setReliefs((previous) => previous.filter((relief) => relief.id !== pendingAction.relief?.id));
        setSelectedIds((previous) => previous.filter((id) => id !== pendingAction.relief?.id));

        addActivity('remove', `Removed relief request “${pendingAction.relief.title}” from board.`);
        showFeedback('success', response.message);
      }

      setPendingAction(null);
      setActionReason('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Moderation action failed.';
      showFeedback('error', message);
    } finally {
      setIsActionSubmitting(false);
    }
  }, [
    actionReason,
    addActivity,
    applyDismissResult,
    pendingAction,
    selectedIds,
    showFeedback,
  ]);

  const selectedCount = selectedIds.length;

  return (
    <motion.section
      className="arb-page"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <header className="arb-hero">
        <div>
          <p className="arb-kicker">Admin Moderation Console</p>
          <h1>Relief Reports Dashboard</h1>
          <p>
            Review reported relief requests, investigate risky patterns, and take moderation actions with clear audit
            intent.
          </p>
        </div>

        <div className="arb-hero-actions">
          <span className="arb-sync-chip">
            <Clock3 size={14} /> Last Sync: {lastSyncedAt ? formatSince(lastSyncedAt) : 'Not synced'}
          </span>
          <button
            type="button"
            className="arb-btn arb-btn-primary"
            onClick={() => void fetchReliefs(true)}
            disabled={isRefreshing}
          >
            <RefreshCw size={14} className={isRefreshing ? 'arb-spin' : ''} />
            {isRefreshing ? 'Refreshing' : 'Refresh'}
          </button>
        </div>
      </header>

      <section className="arb-stats-grid">
        <article className="arb-stat-card">
          <p>
            <Eye size={14} /> Total Requests
          </p>
          <h3>{stats.total}</h3>
          <span>{stats.completed} completed</span>
        </article>

        <article className="arb-stat-card arb-stat-card-alert">
          <p>
            <Flag size={14} /> Reported
          </p>
          <h3>{stats.reported}</h3>
          <span>Need moderation review</span>
        </article>

        <article className="arb-stat-card arb-stat-card-danger">
          <p>
            <ShieldAlert size={14} /> High Risk
          </p>
          <h3>{stats.highRisk}</h3>
          <span>Prioritize investigation</span>
        </article>

        <article className="arb-stat-card">
          <p>
            <AlertTriangle size={14} /> Critical Urgency
          </p>
          <h3>{stats.criticalUrgency}</h3>
          <span>Requests marked as critical</span>
        </article>
      </section>

      <section className="arb-control-panel">
        <div className="arb-search-box">
          <Search size={16} />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by title, requester, location, or description"
          />
        </div>

        <div className="arb-filters-row">
          <label>
            <span>Sort</span>
            <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="reports">Most reports</option>
              <option value="risk">Highest risk score</option>
            </select>
          </label>

          <label>
            <span>Urgency</span>
            <select value={urgencyFilter} onChange={(event) => setUrgencyFilter(event.target.value)}>
              <option value="all">All</option>
              {urgencyOptions.map((urgency) => (
                <option key={urgency} value={urgency}>
                  {urgency}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="arb-tabs">
          {(Object.keys(TAB_LABELS) as ModerationTab[]).map((tabKey) => (
            <button
              key={tabKey}
              type="button"
              className={`arb-tab-btn ${activeTab === tabKey ? 'arb-tab-btn-active' : ''}`}
              onClick={() => setActiveTab(tabKey)}
            >
              <span>{TAB_LABELS[tabKey]}</span>
              <strong>{tabCounts[tabKey]}</strong>
            </button>
          ))}
        </div>
      </section>

      {selectedCount > 0 ? (
        <section className="arb-bulk-bar">
          <p>{selectedCount} request(s) selected for moderation action.</p>
          <div className="arb-bulk-actions">
            <button
              type="button"
              className="arb-btn arb-btn-soft"
              onClick={() => openActionModal('bulkDismiss', null)}
            >
              <CheckCircle2 size={14} /> Dismiss Reports
            </button>
            <button type="button" className="arb-btn arb-btn-ghost" onClick={clearSelection}>
              Clear
            </button>
          </div>
        </section>
      ) : null}

      {feedback ? (
        <div className={`arb-feedback arb-feedback-${feedback.variant}`}>{feedback.message}</div>
      ) : null}

      {errorMessage ? <div className="arb-error-banner">{errorMessage}</div> : null}

      <div className="arb-content-layout">
        <section className="arb-list-area">
          {isLoading ? (
            <div className="arb-skeleton-grid">
              {Array.from({ length: 6 }).map((_, index) => (
                <article key={`relief-skeleton-${index}`} className="arb-skeleton-card" />
              ))}
            </div>
          ) : filteredReliefs.length === 0 ? (
            <div className="arb-empty-state">
              <h3>No requests match these filters</h3>
              <p>Adjust query and filter options to broaden the moderation queue.</p>
            </div>
          ) : (
            <div className="arb-reliefs-grid">
              {filteredReliefs.map((relief) => {
                const isSelected = selectedIds.includes(relief.id);
                const urgencyLabel = toTitleCase(relief.urgency);
                const statusLabel = toTitleCase(relief.status);

                return (
                  <article key={relief.id} className="arb-card">
                    <div className="arb-card-header">
                      <label className="arb-select-chip" htmlFor={`relief-${relief.id}-select`}>
                        <input
                          id={`relief-${relief.id}-select`}
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelection(relief.id)}
                        />
                        Select
                      </label>

                      <span className={`arb-risk-pill arb-risk-${relief.riskLevel}`}>
                        {relief.riskLevel.toUpperCase()} · {relief.riskScore}
                      </span>
                    </div>

                    <div className="arb-card-body">
                      <h3>{relief.title}</h3>
                      <p className="arb-card-desc">{relief.description}</p>

                      <div className="arb-meta-row">
                        <span>
                          <Flag size={13} /> {urgencyLabel}
                        </span>
                        <span>
                          <ShieldCheck size={13} /> {statusLabel}
                        </span>
                        <span>
                          <MapPin size={13} /> {relief.location}
                        </span>
                      </div>

                      <div className="arb-chip-row">
                        <span className="arb-chip">Type: {toTitleCase(relief.type)}</span>
                        <span className="arb-chip">Helpers: {relief.helpersCount}</span>
                        <span className="arb-chip">Comments: {relief.commentCount}</span>
                      </div>

                      <div className="arb-requester-row">
                        <div className="arb-requester-avatar" aria-hidden="true">
                          {relief.requester.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p>{relief.requester.name}</p>
                          <span>@{relief.requester.username}</span>
                        </div>
                        {relief.requester.isBanned ? (
                          <span className="arb-banned-chip">Restricted</span>
                        ) : (
                          <span className="arb-clean-chip">Active</span>
                        )}
                      </div>

                      {relief.reportCount > 0 ? (
                        <p className="arb-report-count">
                          {relief.reportCount} report{relief.reportCount === 1 ? '' : 's'} filed
                        </p>
                      ) : (
                        <p className="arb-report-clear">No active reports</p>
                      )}

                      <ul className="arb-risk-reasons">
                        {(relief.reportCount > 0
                          ? relief.reports.map((report) => report.reason)
                          : relief.riskReasons
                        ).slice(0, 2).map((reason) => (
                          <li key={`${relief.id}-${reason}`}>{reason}</li>
                        ))}
                      </ul>

                      <div className="arb-card-footer">
                        <span className="arb-age-pill">
                          <Clock3 size={13} /> {formatSince(relief.createdAt)}
                        </span>

                        <div className="arb-card-actions">
                          <button
                            type="button"
                            className="arb-btn arb-btn-soft"
                            onClick={() => openActionModal('dismiss', relief)}
                            disabled={relief.reportCount === 0}
                          >
                            <CheckCircle2 size={14} /> Dismiss
                          </button>
                          <button
                            type="button"
                            className="arb-btn arb-btn-danger-outline"
                            onClick={() => openActionModal('remove', relief)}
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                          <button
                            type="button"
                            className="arb-btn arb-btn-ghost"
                            onClick={() => setActiveReliefId(relief.id)}
                          >
                            <Eye size={14} /> Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <aside className="arb-activity-panel">
          <header>
            <h3>Moderation Timeline</h3>
            <p>Recent report moderation actions for relief board.</p>
          </header>

          <ul>
            {activityFeed.length === 0 ? (
              <li className="arb-activity-empty">No moderation activity yet.</li>
            ) : (
              activityFeed.map((activity) => (
                <li key={activity.id}>
                  <span className="arb-activity-icon">{getActivityIcon(activity.type)}</span>
                  <div>
                    <p>{activity.label}</p>
                    <small>{formatSince(activity.timestamp)}</small>
                  </div>
                </li>
              ))
            )}
          </ul>

          <div className="arb-policy-box">
            <h4>Review Guidance</h4>
            <p>
              Confirm report context, urgency, and requester profile before removing a relief request. Use dismiss when
              reports are invalid or resolved.
            </p>
          </div>

          <div className="arb-quick-summary">
            <span>{stats.reported} requests currently flagged</span>
            <span>{stats.highRisk} requests in high-risk lane</span>
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {activeRelief ? (
          <motion.div
            className="arb-drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveReliefId(null)}
          >
            <motion.aside
              className="arb-drawer"
              initial={{ x: 420 }}
              animate={{ x: 0 }}
              exit={{ x: 420 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              onClick={(event) => event.stopPropagation()}
            >
              <header>
                <div>
                  <h3>{activeRelief.title}</h3>
                  <p>{toTitleCase(activeRelief.type)} · {toTitleCase(activeRelief.urgency)}</p>
                </div>
                <button type="button" onClick={() => setActiveReliefId(null)}>
                  <X size={16} />
                </button>
              </header>

              <div className="arb-drawer-risk">
                <p>
                  Risk Score <strong>{activeRelief.riskScore}</strong>
                </p>
                <span className={`arb-risk-pill arb-risk-${activeRelief.riskLevel}`}>
                  {activeRelief.riskLevel.toUpperCase()}
                </span>
              </div>

              <div className="arb-drawer-grid">
                <div>
                  <span>Status</span>
                  <strong>{toTitleCase(activeRelief.status)}</strong>
                </div>
                <div>
                  <span>Visibility</span>
                  <strong>{toTitleCase(activeRelief.visibility)}</strong>
                </div>
                <div>
                  <span>Helpers</span>
                  <strong>{activeRelief.helpersCount}</strong>
                </div>
                <div>
                  <span>Comments</span>
                  <strong>{activeRelief.commentCount}</strong>
                </div>
              </div>

              <div className="arb-drawer-section">
                <h4>Description</h4>
                <p>{activeRelief.description}</p>
              </div>

              <div className="arb-drawer-section">
                <h4>Requester</h4>
                <p className="arb-drawer-requester">
                  <UserRound size={14} /> {activeRelief.requester.name}
                </p>
                <small>{activeRelief.requester.email}</small>
              </div>

              <div className="arb-drawer-section">
                <h4>Reports</h4>
                {activeRelief.reportCount === 0 ? (
                  <p className="arb-drawer-empty">No active reports on this request.</p>
                ) : (
                  <ul className="arb-report-list">
                    {activeRelief.reports.map((report) => (
                      <li key={`${activeRelief.id}-${report.id}`}>
                        <div>
                          <strong>{report.reason}</strong>
                          <small>{report.reporterName} · {formatSince(report.createdAt)}</small>
                        </div>
                        <span className={`arb-risk-pill arb-risk-${report.severity}`}>
                          {report.severity.toUpperCase()}
                        </span>
                        <p>{report.message}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="arb-drawer-actions">
                <button
                  type="button"
                  className="arb-btn arb-btn-soft"
                  onClick={() => openActionModal('dismiss', activeRelief)}
                  disabled={activeRelief.reportCount === 0}
                >
                  <CheckCircle2 size={14} /> Dismiss Reports
                </button>
                <button type="button" className="arb-btn arb-btn-danger-outline" onClick={() => openActionModal('remove', activeRelief)}>
                  <Trash2 size={14} /> Remove Request
                </button>
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {pendingAction ? (
          <motion.div
            className="arb-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeActionModal}
          >
            <motion.div
              className="arb-modal"
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.96 }}
              onClick={(event) => event.stopPropagation()}
            >
              <h3>
                {pendingAction.kind === 'dismiss' ? 'Dismiss reports for this relief request?' : null}
                {pendingAction.kind === 'bulkDismiss' ? 'Dismiss reports for selected requests?' : null}
                {pendingAction.kind === 'remove' ? 'Remove this relief request from the board?' : null}
              </h3>
              <p>
                {pendingAction.kind === 'dismiss'
                  ? 'Use this action when reports are invalid, duplicate, or already resolved.'
                  : null}
                {pendingAction.kind === 'bulkDismiss'
                  ? 'This clears report records for all selected requests in one operation.'
                  : null}
                {pendingAction.kind === 'remove'
                  ? 'This permanently removes the relief request from public and admin views.'
                  : null}
              </p>

              <label htmlFor="relief-moderation-reason">
                {pendingAction.kind === 'remove' ? 'Moderation Reason (Required)' : 'Internal Note (Optional)'}
              </label>
              <textarea
                id="relief-moderation-reason"
                value={actionReason}
                onChange={(event) => setActionReason(event.target.value)}
                placeholder={pendingAction.kind === 'remove'
                  ? 'Explain why this request is being removed'
                  : 'Optional internal context for this moderation action'}
                rows={4}
                maxLength={500}
              />

              {pendingAction.kind === 'remove' ? (
                <p className="arb-modal-note">
                  This reason is sent to the requester as the official moderation explanation.
                </p>
              ) : (
                <p className="arb-modal-note">
                  Dismiss clears report records while keeping the original relief request available.
                </p>
              )}

              <div className="arb-modal-actions">
                <button
                  type="button"
                  className="arb-btn arb-btn-ghost"
                  onClick={closeActionModal}
                  disabled={isActionSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="arb-btn arb-btn-danger"
                  onClick={() => void confirmPendingAction()}
                  disabled={isActionSubmitting || (pendingAction.kind === 'remove' && actionReason.trim().length < 3)}
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
