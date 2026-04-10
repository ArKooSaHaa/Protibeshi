import { AnimatePresence, motion, type Variants } from 'framer-motion';
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
  Sparkles,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ENV } from '@/config/env';
import { complaintsData } from '@/features/complaints/mock/complaintsData';
import type {
  ComplaintCategory,
  ComplaintItem,
  ComplaintPriority,
  ComplaintStatus,
  ComplaintVisibility,
} from '@/features/complaints/types/complaint.types';
import {
  bulkUpdateAdminComplaintStatus,
  getAdminComplaintDetails,
  getAdminComplaints,
  updateAdminComplaintStatus,
} from '@/services/complaintService';
import '../styles/AdminComplaintsModerationPage.css';

type RiskLevel = 'high' | 'medium' | 'low';
type QueueTab = 'all' | 'urgent' | 'private' | 'unresolved';
type SortMode = 'newest' | 'oldest' | 'priority' | 'distance' | 'risk';
type StatusFilter = 'all' | ComplaintStatus;
type PriorityFilter = 'all' | ComplaintPriority;
type VisibilityFilter = 'all' | ComplaintVisibility;
type ActionKind = 'underReview' | 'inProgress' | 'resolved' | 'rejected' | 'bulkResolved' | 'bulkRejected';
type ActivityType = 'system' | 'status' | 'resolve' | 'reject' | 'bulk';

type AdminComplaintRecord = ComplaintItem & {
  riskScore: number;
  riskLevel: RiskLevel;
  riskSignals: string[];
  flagged: boolean;
  internalNotes: string[];
  assignedTo: string | null;
};

type PendingAction = {
  kind: ActionKind;
  targetIds: string[];
};

type ActivityLog = {
  id: string;
  type: ActivityType;
  label: string;
  timestamp: string;
};

type NormalizedComplaint = ComplaintItem & {
  internalNotes?: string[];
  assignedTo?: string | null;
};

type QueuePagination = {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
  from: number;
  to: number;
};

type FeedbackState = {
  variant: 'success' | 'error';
  message: string;
} | null;

const TABS: Record<QueueTab, string> = {
  all: 'All Cases',
  urgent: 'Urgent',
  private: 'Only Admins',
  unresolved: 'Unresolved',
};

const SORT_LABELS: Record<SortMode, string> = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  priority: 'Highest priority',
  distance: 'Closest first',
  risk: 'Highest risk first',
};

const STATUS_OPTIONS: ComplaintStatus[] = ['Pending', 'Under Review', 'In Progress', 'Resolved', 'Rejected'];
const PRIORITY_OPTIONS: ComplaintPriority[] = ['Low', 'Medium', 'High', 'Urgent'];
const CATEGORY_OPTIONS: ComplaintCategory[] = [
  'Garbage',
  'Water supply',
  'Electricity',
  'Road damage',
  'Noise',
  'Safety',
  'Illegal activity',
  'Other',
];
const VISIBILITY_OPTIONS: ComplaintVisibility[] = ['Public', 'Only admins'];

const PRIORITY_WEIGHT: Record<ComplaintPriority, number> = {
  Low: 1,
  Medium: 2,
  High: 3,
  Urgent: 4,
};

const STATUS_WEIGHT: Record<ComplaintStatus, number> = {
  Pending: 3,
  'Under Review': 2,
  'In Progress': 2,
  Resolved: 0,
  Rejected: 1,
};

const ACTION_LABELS: Record<ActionKind, { title: string; description: string; confirm: string }> = {
  underReview: {
    title: 'Mark Under Review',
    description: 'Move this complaint into active triage so team members can process it.',
    confirm: 'Mark under review',
  },
  inProgress: {
    title: 'Mark In Progress',
    description: 'Indicates that mitigation or field work has started for this case.',
    confirm: 'Mark in progress',
  },
  resolved: {
    title: 'Resolve Complaint',
    description: 'Close this complaint as solved and attach a short resolution note.',
    confirm: 'Resolve complaint',
  },
  rejected: {
    title: 'Reject Complaint',
    description: 'Reject this complaint and store a reason for moderation records.',
    confirm: 'Reject complaint',
  },
  bulkResolved: {
    title: 'Bulk Resolve Complaints',
    description: 'Resolve selected complaints in one operation.',
    confirm: 'Resolve selected',
  },
  bulkRejected: {
    title: 'Bulk Reject Complaints',
    description: 'Reject selected complaints in one operation.',
    confirm: 'Reject selected',
  },
};

const cardContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.08 },
  },
};

const cardItemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.2, 1, 0.3, 1] } },
};

const createId = (prefix: string): string => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

const toSafeNumber = (value: unknown, fallback: number = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toRiskLevel = (score: number): RiskLevel => {
  if (score >= 80) return 'high';
  if (score >= 55) return 'medium';
  return 'low';
};

const toApiStatusFilter = (value: StatusFilter): string | undefined => {
  if (value === 'all') {
    return undefined;
  }

  return value.toLowerCase().replace(/\s+/g, '_');
};

const toApiPriorityFilter = (value: PriorityFilter): string | undefined => {
  if (value === 'all') {
    return undefined;
  }

  return value.toLowerCase();
};

const toApiCategoryFilter = (value: 'all' | ComplaintCategory): string | undefined => {
  if (value === 'all') {
    return undefined;
  }

  return value.toLowerCase();
};

const toApiVisibilityFilter = (value: VisibilityFilter): string | undefined => {
  if (value === 'all') {
    return undefined;
  }

  return value === 'Only admins' ? 'private' : 'public';
};

const toApiTab = (value: QueueTab): string | undefined => {
  if (value === 'all') {
    return undefined;
  }

  return value;
};

const toApiSort = (value: SortMode): string => {
  if (value === 'risk') {
    return 'newest';
  }

  return value;
};

const parseQueuePagination = (
  payload: unknown,
  fallbackPage: number,
  fallbackPerPage: number,
  fallbackTotal: number,
): QueuePagination => {
  if (!payload || typeof payload !== 'object') {
    return {
      currentPage: fallbackPage,
      lastPage: 1,
      perPage: fallbackPerPage,
      total: fallbackTotal,
      from: fallbackTotal > 0 ? 1 : 0,
      to: fallbackTotal,
    };
  }

  const maybeObject = payload as { pagination?: Record<string, unknown> };
  const raw = maybeObject.pagination;

  if (!raw || typeof raw !== 'object') {
    return {
      currentPage: fallbackPage,
      lastPage: 1,
      perPage: fallbackPerPage,
      total: fallbackTotal,
      from: fallbackTotal > 0 ? 1 : 0,
      to: fallbackTotal,
    };
  }

  const currentPage = Math.max(1, toSafeNumber(raw.current_page, fallbackPage));
  const lastPage = Math.max(1, toSafeNumber(raw.last_page, 1));
  const perPage = Math.max(1, toSafeNumber(raw.per_page, fallbackPerPage));
  const total = Math.max(0, toSafeNumber(raw.total, fallbackTotal));
  const from = Math.max(0, toSafeNumber(raw.from, total > 0 ? 1 : 0));
  const to = Math.max(0, toSafeNumber(raw.to, total));

  return {
    currentPage,
    lastPage,
    perPage,
    total,
    from,
    to,
  };
};

const resolvePhotoUrl = (value: unknown): string | null => {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    if (typeof window !== 'undefined' && window.location.port === '5173') {
      return `${ENV.API_BASE_URL}${trimmed}`;
    }

    return trimmed;
  }

  return `${ENV.API_BASE_URL}/storage/${trimmed.replace(/^storage\//, '')}`;
};

const normalizeCategory = (value: unknown): ComplaintCategory => {
  const normalized = String(value || '').trim().toLowerCase().replace(/_/g, ' ');
  const found = CATEGORY_OPTIONS.find((item) => item.toLowerCase() === normalized);
  return found || 'Other';
};

const normalizeStatus = (value: unknown): ComplaintStatus => {
  const normalized = String(value || '').trim().toLowerCase().replace(/_/g, ' ');

  if (normalized === 'pending') return 'Pending';
  if (normalized === 'under review') return 'Under Review';
  if (normalized === 'in progress') return 'In Progress';
  if (normalized === 'resolved') return 'Resolved';
  if (normalized === 'rejected') return 'Rejected';

  return 'Pending';
};

const normalizePriority = (value: unknown): ComplaintPriority => {
  const normalized = String(value || '').trim().toLowerCase();

  if (normalized === 'low') return 'Low';
  if (normalized === 'medium') return 'Medium';
  if (normalized === 'high') return 'High';
  if (normalized === 'urgent') return 'Urgent';

  return 'Medium';
};

const normalizeVisibility = (value: unknown): ComplaintVisibility => {
  const normalized = String(value || '').trim().toLowerCase().replace(/_/g, ' ');

  if (normalized === 'private' || normalized === 'only admins' || normalized === 'admins only') {
    return 'Only admins';
  }

  return 'Public';
};

const normalizeComplaint = (raw: Record<string, unknown>, index: number): NormalizedComplaint => {
  const complaintCode = String(raw.complaint_code || raw.id || `CMP-${Date.now()}-${index + 1}`);
  const createdAt = typeof raw.created_at === 'string' && raw.created_at
    ? raw.created_at
    : new Date().toISOString();
  const user = raw.user && typeof raw.user === 'object' ? raw.user as Record<string, unknown> : null;
  const rawUpdates = Array.isArray(raw.updates) ? raw.updates : [];
  const normalizedUpdates: ComplaintItem['updates'] = [];

  rawUpdates.forEach((entry) => {
    if (!entry || typeof entry !== 'object') {
      return;
    }

    const candidate = entry as Record<string, unknown>;
    const stage = typeof candidate.stage === 'string' && candidate.stage.trim()
      ? candidate.stage.trim()
      : 'Status update';
    const date = typeof candidate.date === 'string' && candidate.date.trim()
      ? candidate.date.trim()
      : createdAt;
    const note = typeof candidate.note === 'string' && candidate.note.trim()
      ? candidate.note.trim()
      : undefined;

    normalizedUpdates.push(note ? { stage, date, note } : { stage, date });
  });

  const rawInternalNotes = Array.isArray(raw.internal_notes)
    ? raw.internal_notes
    : (Array.isArray(raw.internalNotes) ? raw.internalNotes : []);

  const internalNotes = rawInternalNotes
    .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
    .map((entry) => entry.trim());

  const assignedTo = typeof raw.assigned_to === 'string' && raw.assigned_to.trim()
    ? raw.assigned_to.trim()
    : (typeof raw.assignedTo === 'string' && raw.assignedTo.trim() ? raw.assignedTo.trim() : null);

  return {
    id: complaintCode,
    recordId: toSafeNumber(raw.id, NaN),
    userId: user ? toSafeNumber(user.id, NaN) : undefined,
    title: String(raw.title || 'Untitled complaint'),
    category: normalizeCategory(raw.category),
    description: String(raw.description || ''),
    priority: normalizePriority(raw.priority),
    status: normalizeStatus(raw.status),
    createdAt,
    distance: toSafeNumber(raw.distance, 0),
    upvotes: 0,
    comments: 0,
    reportedBy: user && typeof user.name === 'string' && user.name.trim() ? user.name.trim() : 'Anonymous',
    verified: false,
    visibility: normalizeVisibility(raw.visibility),
    location: String(raw.location || 'Not specified'),
    photoUrl: resolvePhotoUrl(raw.photo),
    photoPath: typeof raw.photo === 'string' ? raw.photo : null,
    updates: normalizedUpdates.length > 0 ? normalizedUpdates : [
      {
        stage: 'Reported',
        date: createdAt,
      },
    ],
    attachments: [],
    internalNotes,
    assignedTo,
  };
};

const extractComplaintsFromResponse = (payload: unknown): NormalizedComplaint[] => {
  if (Array.isArray(payload)) {
    return payload.map((item, index) => normalizeComplaint(item as Record<string, unknown>, index));
  }

  if (payload && typeof payload === 'object') {
    const maybeObject = payload as { complaints?: unknown[] };

    if (Array.isArray(maybeObject.complaints)) {
      return maybeObject.complaints.map((item, index) => normalizeComplaint(item as Record<string, unknown>, index));
    }
  }

  return [];
};

const extractComplaintFromResponse = (payload: unknown): NormalizedComplaint | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const maybeObject = payload as { complaint?: unknown };
  if (!maybeObject.complaint || typeof maybeObject.complaint !== 'object') {
    return null;
  }

  return normalizeComplaint(maybeObject.complaint as Record<string, unknown>, 0);
};

const dedupeById = (items: NormalizedComplaint[]): NormalizedComplaint[] => {
  const map = new Map<string, NormalizedComplaint>();

  items.forEach((item) => {
    if (!map.has(item.id)) {
      map.set(item.id, item);
      return;
    }

    const existing = map.get(item.id);

    if (!existing) {
      map.set(item.id, item);
      return;
    }

    map.set(item.id, {
      ...existing,
      ...item,
      updates: item.updates.length ? item.updates : existing.updates,
      attachments: item.attachments && item.attachments.length ? item.attachments : existing.attachments,
      photoUrl: item.photoUrl || existing.photoUrl,
      internalNotes: item.internalNotes && item.internalNotes.length ? item.internalNotes : existing.internalNotes,
      assignedTo: item.assignedTo || existing.assignedTo,
    });
  });

  return Array.from(map.values());
};

const computeRisk = (item: ComplaintItem): { score: number; level: RiskLevel; signals: string[] } => {
  let score = PRIORITY_WEIGHT[item.priority] * 16 + STATUS_WEIGHT[item.status] * 10;
  const signals: string[] = [];

  if (item.priority === 'Urgent' || item.priority === 'High') {
    signals.push('High priority complaint');
  }

  if (item.status === 'Pending') {
    score += 14;
    signals.push('Pending triage');
  }

  if (item.visibility === 'Only admins') {
    score += 8;
    signals.push('Admin-only sensitivity');
  }

  if ((item.updates?.length ?? 0) <= 1) {
    score += 6;
    signals.push('No progress updates');
  }

  if ((item.description || '').length > 180) {
    score += 5;
    signals.push('Long detail report');
  }

  if (item.distance <= 200 && item.distance > 0) {
    score += 4;
    signals.push('Very close to community center');
  }

  score = Math.max(12, Math.min(96, score));

  return {
    score,
    level: toRiskLevel(score),
    signals: signals.slice(0, 4),
  };
};

const toAdminRecord = (item: ComplaintItem & { internalNotes?: string[]; assignedTo?: string | null }, index: number): AdminComplaintRecord => {
  const risk = computeRisk(item);

  return {
    ...item,
    id: item.id || `CMP-${index + 1}`,
    riskScore: risk.score,
    riskLevel: risk.level,
    riskSignals: risk.signals,
    flagged: item.priority === 'Urgent' || item.visibility === 'Only admins',
    internalNotes: item.internalNotes ?? [],
    assignedTo: item.assignedTo ?? null,
  };
};

const formatSince = (isoDate: string): string => {
  const timestamp = new Date(isoDate).getTime();

  if (!Number.isFinite(timestamp)) {
    return 'Unknown';
  }

  const diffMs = Date.now() - timestamp;
  const diffHours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

export const AdminComplaintsModerationPage = () => {
  const [complaints, setComplaints] = useState<AdminComplaintRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [tab, setTab] = useState<QueueTab>('all');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ComplaintCategory>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [serverPage, setServerPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  const [pagination, setPagination] = useState<QueuePagination>({
    currentPage: 1,
    lastPage: 1,
    perPage: 12,
    total: 0,
    from: 0,
    to: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [activeComplaintId, setActiveComplaintId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const showFeedback = useCallback((variant: 'success' | 'error', message: string) => {
    setFeedback({ variant, message });

    window.setTimeout(() => {
      setFeedback((current) => (current?.message === message ? null : current));
    }, 3200);
  }, []);

  const addActivity = useCallback((type: ActivityType, label: string) => {
    setActivities((previous) => [
      {
        id: createId('activity'),
        type,
        label,
        timestamp: new Date().toISOString(),
      },
      ...previous,
    ].slice(0, 8));
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
      setServerPage(1);
    }, 320);

    return () => {
      window.clearTimeout(handle);
    };
  }, [searchTerm]);

  const fetchQueue = useCallback(async (manualRefresh: boolean) => {
    if (manualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setErrorMessage(null);

    try {
      const remote = await getAdminComplaints(undefined, {
        page: serverPage,
        perPage,
        search: debouncedSearchTerm || undefined,
        status: toApiStatusFilter(statusFilter),
        priority: toApiPriorityFilter(priorityFilter),
        category: toApiCategoryFilter(categoryFilter),
        visibility: toApiVisibilityFilter(visibilityFilter),
        tab: toApiTab(tab),
        sort: toApiSort(sortMode),
      });

      const remoteComplaints = extractComplaintsFromResponse(remote);

      const normalized = dedupeById(remoteComplaints).map(toAdminRecord);
      const nextPagination = parseQueuePagination(remote, serverPage, perPage, normalized.length);

      setComplaints(normalized);
      setPagination(nextPagination);
      setSelectedIds((previous) => previous.filter((id) => normalized.some((item) => item.id === id)));
      setLastSyncedAt(new Date().toISOString());

      if (manualRefresh) {
        addActivity('system', `Synced ${normalized.length} complaints from server page ${nextPagination.currentPage}.`);
      }
    } catch (error) {
      const fallback = complaintsData.map(toAdminRecord);
      const message = error instanceof Error ? error.message : 'Failed to fetch admin complaints moderation queue.';

      setComplaints(fallback);
      setPagination({
        currentPage: 1,
        lastPage: 1,
        perPage: fallback.length || perPage,
        total: fallback.length,
        from: fallback.length > 0 ? 1 : 0,
        to: fallback.length,
      });
      setErrorMessage(`${message} Loaded preview moderation dataset.`);
      setLastSyncedAt(new Date().toISOString());
      addActivity('system', 'Admin complaints API unavailable. Loaded local preview moderation dataset.');
      showFeedback('error', message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [
    addActivity,
    categoryFilter,
    debouncedSearchTerm,
    perPage,
    priorityFilter,
    serverPage,
    showFeedback,
    sortMode,
    statusFilter,
    tab,
    visibilityFilter,
  ]);

  const mergeUpdatedComplaints = useCallback((updatedItems: NormalizedComplaint[]) => {
    if (updatedItems.length === 0) {
      return;
    }

    const updatedByRecordId = new Map<number, AdminComplaintRecord>();
    updatedItems.forEach((item, index) => {
      if (Number.isFinite(item.recordId)) {
        updatedByRecordId.set(Number(item.recordId), toAdminRecord(item, index));
      }
    });

    if (updatedByRecordId.size === 0) {
      return;
    }

    setComplaints((previous) => previous.map((item) => {
      if (!Number.isFinite(item.recordId)) {
        return item;
      }

      const updated = updatedByRecordId.get(Number(item.recordId));
      return updated ? { ...item, ...updated } : item;
    }));
  }, []);

  const openComplaintDetails = useCallback(async (item: AdminComplaintRecord) => {
    setActiveComplaintId(item.id);

    if (!Number.isFinite(item.recordId)) {
      return;
    }

    setIsDetailsLoading(true);

    try {
      const response = await getAdminComplaintDetails(Number(item.recordId));
      const detailedComplaint = extractComplaintFromResponse(response);

      if (detailedComplaint) {
        mergeUpdatedComplaints([detailedComplaint]);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch complaint details.';
      showFeedback('error', message);
    } finally {
      setIsDetailsLoading(false);
    }
  }, [mergeUpdatedComplaints, showFeedback]);

  useEffect(() => {
    void fetchQueue(false);
  }, [fetchQueue]);

  const visibleComplaints = useMemo(() => {
    if (sortMode !== 'risk') {
      return complaints;
    }

    return [...complaints].sort((a, b) => b.riskScore - a.riskScore);
  }, [complaints, sortMode]);

  const stats = useMemo(() => {
    const total = pagination.total || complaints.length;
    const unresolved = complaints.filter((item) => item.status !== 'Resolved' && item.status !== 'Rejected').length;
    const urgent = complaints.filter((item) => item.priority === 'Urgent').length;
    const privateCases = complaints.filter((item) => item.visibility === 'Only admins').length;
    const avgRisk = total > 0
      ? Math.round(complaints.reduce((sum, item) => sum + item.riskScore, 0) / total)
      : 0;

    return {
      total,
      unresolved,
      urgent,
      privateCases,
      avgRisk,
    };
  }, [complaints, pagination.total]);

  const activeComplaint = useMemo(() => {
    return complaints.find((item) => item.id === activeComplaintId) ?? null;
  }, [activeComplaintId, complaints]);

  const toggleSelect = (id: string) => {
    setSelectedIds((previous) => (
      previous.includes(id)
        ? previous.filter((value) => value !== id)
        : [...previous, id]
    ));
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = visibleComplaints.map((item) => item.id);

    if (visibleIds.length === 0) {
      return;
    }

    const allSelected = visibleIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((previous) => previous.filter((id) => !visibleIds.includes(id)));
      return;
    }

    setSelectedIds((previous) => Array.from(new Set([...previous, ...visibleIds])));
  };

  const openActionModal = (kind: ActionKind, targetIds: string[]) => {
    if (targetIds.length === 0) {
      showFeedback('error', 'Select at least one complaint first.');
      return;
    }

    setPendingAction({ kind, targetIds });
    setActionNote('');
  };

  const closeActionModal = () => {
    if (isActionSubmitting) {
      return;
    }

    setPendingAction(null);
    setActionNote('');
  };

  const resolveActionStatus = (kind: ActionKind): ComplaintStatus => {
    if (kind === 'underReview') return 'Under Review';
    if (kind === 'inProgress') return 'In Progress';
    if (kind === 'resolved' || kind === 'bulkResolved') return 'Resolved';

    return 'Rejected';
  };

  const resolveActionApiStatus = (kind: ActionKind): string => {
    if (kind === 'underReview') return 'under_review';
    if (kind === 'inProgress') return 'in_progress';
    if (kind === 'resolved' || kind === 'bulkResolved') return 'resolved';

    return 'rejected';
  };

  const confirmAction = async () => {
    if (!pendingAction) {
      return;
    }

    const note = actionNote.trim();
    const needsNote = pendingAction.kind === 'resolved'
      || pendingAction.kind === 'rejected'
      || pendingAction.kind === 'bulkResolved'
      || pendingAction.kind === 'bulkRejected';

    if (needsNote && note.length < 3) {
      showFeedback('error', 'Please provide at least 3 characters in the moderation note.');
      return;
    }

    const nextStatus = resolveActionStatus(pendingAction.kind);
    const nextApiStatus = resolveActionApiStatus(pendingAction.kind);
    const targetIds = pendingAction.targetIds;
    const targetRecordIds = complaints
      .filter((item) => targetIds.includes(item.id))
      .map((item) => Number(item.recordId))
      .filter((value) => Number.isFinite(value) && value > 0);

    if (targetRecordIds.length === 0) {
      showFeedback('error', 'Unable to map selected complaints to backend records. Please refresh and try again.');
      return;
    }

    setIsActionSubmitting(true);

    try {
      if (targetRecordIds.length > 1) {
        const bulkResult = await bulkUpdateAdminComplaintStatus(
          targetRecordIds,
          {
            status: nextApiStatus,
            note,
          },
        );

        const updatedComplaints = extractComplaintsFromResponse(bulkResult);

        if (updatedComplaints.length > 0) {
          mergeUpdatedComplaints(updatedComplaints);
        }
      } else {
        const singleResult = await updateAdminComplaintStatus(
          targetRecordIds[0],
          {
            status: nextApiStatus,
            note,
          },
        );

        const updatedComplaint = extractComplaintFromResponse(singleResult);

        if (updatedComplaint) {
          mergeUpdatedComplaints([updatedComplaint]);
        }
      }

      setSelectedIds((previous) => previous.filter((id) => !targetIds.includes(id)));

      const count = targetIds.length;

      if (nextStatus === 'Resolved') {
        addActivity(count > 1 ? 'bulk' : 'resolve', `Resolved ${count} complaint case(s).`);
        showFeedback('success', `${count} complaint case(s) resolved.`);
      } else if (nextStatus === 'Rejected') {
        addActivity(count > 1 ? 'bulk' : 'reject', `Rejected ${count} complaint case(s).`);
        showFeedback('success', `${count} complaint case(s) rejected.`);
      } else {
        addActivity('status', `Moved ${count} complaint case(s) to ${nextStatus}.`);
        showFeedback('success', `${count} complaint case(s) moved to ${nextStatus}.`);
      }

      setPendingAction(null);
      setActionNote('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update complaint moderation status.';
      showFeedback('error', message);
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const allVisibleSelected = visibleComplaints.length > 0
    && visibleComplaints.every((item) => selectedIds.includes(item.id));

  const hasPreviousPage = pagination.currentPage > 1;
  const hasNextPage = pagination.currentPage < pagination.lastPage;

  return (
    <div className="acp-page">
      <motion.section
        className="acp-hero"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
      >
        <div className="acp-hero-copy">
          <p className="acp-kicker">Admin complaints command desk</p>
          <h1>Neighborhood complaints moderation board</h1>
          <p>
            Review civic complaints, triage urgent reports, track private-sensitive cases, and update
            complaint status with transparent moderation notes.
          </p>
        </div>

        <div className="acp-hero-actions">
          <span className="acp-sync-chip">
            <Clock3 size={13} />
            {lastSyncedAt ? `Synced ${formatSince(lastSyncedAt)}` : 'Not synced yet'}
          </span>

          <button
            type="button"
            className="acp-btn acp-btn-primary"
            onClick={() => void fetchQueue(true)}
            disabled={isRefreshing}
          >
            <RefreshCw size={14} className={isRefreshing ? 'acp-spin' : ''} />
            Refresh queue
          </button>
        </div>
      </motion.section>

      <section className="acp-stats-grid">
        <article className="acp-stat-card">
          <p><Sparkles size={14} /> Total complaints</p>
          <h3>{stats.total}</h3>
          <span>Cases in moderation queue</span>
        </article>

        <article className="acp-stat-card acp-stat-warning">
          <p><AlertTriangle size={14} /> Unresolved</p>
          <h3>{stats.unresolved}</h3>
          <span>Pending, under review, or in progress</span>
        </article>

        <article className="acp-stat-card acp-stat-danger">
          <p><ShieldAlert size={14} /> Urgent</p>
          <h3>{stats.urgent}</h3>
          <span>Urgent priority complaints</span>
        </article>

        <article className="acp-stat-card acp-stat-neutral">
          <p><ShieldCheck size={14} /> Private</p>
          <h3>{stats.privateCases}</h3>
          <span>Only admins visibility</span>
        </article>

        <article className="acp-stat-card acp-stat-info">
          <p><Flag size={14} /> Avg risk</p>
          <h3>{stats.avgRisk}</h3>
          <span>Moderation risk index</span>
        </article>
      </section>

      <section className="acp-control-panel">
        <div className="acp-control-row">
          <label className="acp-search-box">
            <Search size={16} />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by code, title, location, or reporter"
            />
          </label>

          <div className="acp-inline-filters">
            <label>
              <span>Status</span>
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as StatusFilter);
                  setServerPage(1);
                }}
              >
                <option value="all">All</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Priority</span>
              <select
                value={priorityFilter}
                onChange={(event) => {
                  setPriorityFilter(event.target.value as PriorityFilter);
                  setServerPage(1);
                }}
              >
                <option value="all">All</option>
                {PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Category</span>
              <select
                value={categoryFilter}
                onChange={(event) => {
                  setCategoryFilter(event.target.value as 'all' | ComplaintCategory);
                  setServerPage(1);
                }}
              >
                <option value="all">All</option>
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Visibility</span>
              <select
                value={visibilityFilter}
                onChange={(event) => {
                  setVisibilityFilter(event.target.value as VisibilityFilter);
                  setServerPage(1);
                }}
              >
                <option value="all">All</option>
                {VISIBILITY_OPTIONS.map((visibility) => (
                  <option key={visibility} value={visibility}>{visibility}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Sort</span>
              <select
                value={sortMode}
                onChange={(event) => {
                  setSortMode(event.target.value as SortMode);
                  setServerPage(1);
                }}
              >
                {Object.entries(SORT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="acp-tab-row">
          <div className="acp-tab-list">
            {(Object.keys(TABS) as QueueTab[]).map((item) => (
              <button
                key={item}
                type="button"
                className={`acp-tab ${tab === item ? 'acp-tab-active' : ''}`}
                onClick={() => {
                  setTab(item);
                  setServerPage(1);
                }}
              >
                {TABS[item]}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="acp-btn acp-btn-ghost"
            onClick={toggleSelectAllVisible}
          >
            <Filter size={14} />
            {allVisibleSelected ? 'Clear visible' : 'Select visible'}
          </button>
        </div>
      </section>

      {selectedIds.length > 0 && (
        <motion.section
          className="acp-bulk-bar"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
        >
          <p>{selectedIds.length} complaints selected</p>
          <div className="acp-bulk-actions">
            <button
              type="button"
              className="acp-btn acp-btn-subtle"
              onClick={() => openActionModal('bulkResolved', selectedIds)}
            >
              <CheckCircle2 size={14} /> Resolve selected
            </button>
            <button
              type="button"
              className="acp-btn acp-btn-danger"
              onClick={() => openActionModal('bulkRejected', selectedIds)}
            >
              <X size={14} /> Reject selected
            </button>
          </div>
        </motion.section>
      )}

      {feedback ? (
        <div className={`acp-feedback ${feedback.variant === 'error' ? 'acp-feedback-error' : 'acp-feedback-success'}`}>
          {feedback.message}
        </div>
      ) : null}

      {errorMessage ? <div className="acp-error-banner">{errorMessage}</div> : null}

      {isLoading ? (
        <div className="acp-loading">Loading complaints moderation board...</div>
      ) : (
        <motion.section
          className="acp-grid"
          variants={cardContainerVariants}
          initial="hidden"
          animate="visible"
        >
          {visibleComplaints.map((item) => {
            const isSelected = selectedIds.includes(item.id);

            return (
              <motion.article
                key={item.id}
                className={`acp-card ${item.riskLevel === 'high' ? 'acp-card-high' : ''}`}
                variants={cardItemVariants}
              >
                <header className="acp-card-head">
                  <label className="acp-check-wrap">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(item.id)}
                    />
                    <span>{item.id}</span>
                  </label>

                  <span className={`acp-risk-pill acp-risk-${item.riskLevel}`}>{item.riskLevel} risk</span>
                </header>

                <h3>{item.title}</h3>
                <p className="acp-card-description">{item.description}</p>

                <div className="acp-chip-row">
                  <span className={`acp-status-chip acp-status-${item.status.replace(/\s/g, '').toLowerCase()}`}>
                    {item.status}
                  </span>
                  <span className={`acp-priority-chip acp-priority-${item.priority.toLowerCase()}`}>
                    {item.priority}
                  </span>
                  <span className="acp-category-chip">{item.category}</span>
                </div>

                <div className="acp-card-meta">
                  <span><MapPin size={13} /> {item.location}</span>
                  <span>{item.distance}m away</span>
                  <span>{formatSince(item.createdAt)}</span>
                </div>

                <div className="acp-card-reporter">
                  <strong>{item.reportedBy}</strong>
                  <span>{item.visibility}</span>
                </div>

                <footer className="acp-card-actions">
                  <button
                    type="button"
                    className="acp-btn acp-btn-ghost"
                    onClick={() => {
                      void openComplaintDetails(item);
                    }}
                  >
                    <Eye size={14} /> Details
                  </button>
                  <button
                    type="button"
                    className="acp-btn acp-btn-subtle"
                    onClick={() => openActionModal('underReview', [item.id])}
                  >
                    Under review
                  </button>
                  <button
                    type="button"
                    className="acp-btn acp-btn-primary"
                    onClick={() => openActionModal('resolved', [item.id])}
                  >
                    Resolve
                  </button>
                </footer>
              </motion.article>
            );
          })}

          {visibleComplaints.length === 0 ? (
            <div className="acp-empty">
              <AlertTriangle size={20} />
              <h3>No complaints match your current filters</h3>
              <p>Adjust filters or search keywords to widen the moderation queue.</p>
            </div>
          ) : null}
        </motion.section>
      )}

      {!isLoading ? (
        <section className="acp-pagination">
          <p>
            Showing {pagination.from || 0}-{pagination.to || visibleComplaints.length} of {pagination.total || visibleComplaints.length} complaints
          </p>

          <div className="acp-pagination-controls">
            <label>
              <span>Per page</span>
              <select
                value={perPage}
                onChange={(event) => {
                  const nextPerPage = Number(event.target.value);
                  setPerPage(nextPerPage);
                  setServerPage(1);
                }}
              >
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={36}>36</option>
              </select>
            </label>

            <button
              type="button"
              className="acp-btn acp-btn-ghost"
              onClick={() => setServerPage((previous) => Math.max(1, previous - 1))}
              disabled={!hasPreviousPage || isRefreshing}
            >
              Previous
            </button>

            <span className="acp-page-indicator">
              Page {pagination.currentPage} of {pagination.lastPage}
            </span>

            <button
              type="button"
              className="acp-btn acp-btn-ghost"
              onClick={() => setServerPage((previous) => Math.min(pagination.lastPage, previous + 1))}
              disabled={!hasNextPage || isRefreshing}
            >
              Next
            </button>
          </div>
        </section>
      ) : null}

      <section className="acp-activity-panel">
        <h4>Recent moderation activity</h4>
        {activities.length === 0 ? (
          <p>No moderation actions yet.</p>
        ) : (
          <ul>
            {activities.map((activity) => (
              <li key={activity.id}>
                <span>{activity.label}</span>
                <time>{formatSince(activity.timestamp)}</time>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AnimatePresence>
        {activeComplaint ? (
          <motion.div
            className="acp-drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveComplaintId(null)}
          >
            <motion.aside
              className="acp-drawer"
              initial={{ x: 420, opacity: 0.7 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 420, opacity: 0.7 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              onClick={(event) => event.stopPropagation()}
            >
              <header>
                <div>
                  <p>{activeComplaint.id}</p>
                  <h3>{activeComplaint.title}</h3>
                </div>
                <button type="button" onClick={() => setActiveComplaintId(null)}>
                  <X size={18} />
                </button>
              </header>

              <div className="acp-drawer-scroll">
                {isDetailsLoading ? <p className="acp-detail-loading">Refreshing latest complaint details...</p> : null}

                {activeComplaint.photoUrl ? (
                  <img src={activeComplaint.photoUrl} alt={activeComplaint.title} className="acp-drawer-photo" />
                ) : null}

                <article className="acp-drawer-block">
                  <h4>Complaint details</h4>
                  <p>{activeComplaint.description}</p>
                  <ul>
                    <li><strong>Category:</strong> {activeComplaint.category}</li>
                    <li><strong>Status:</strong> {activeComplaint.status}</li>
                    <li><strong>Priority:</strong> {activeComplaint.priority}</li>
                    <li><strong>Visibility:</strong> {activeComplaint.visibility}</li>
                    <li><strong>Reporter:</strong> {activeComplaint.reportedBy}</li>
                    <li><strong>Location:</strong> {activeComplaint.location}</li>
                  </ul>
                </article>

                <article className="acp-drawer-block">
                  <h4>Risk signals</h4>
                  <div className="acp-risk-signal-list">
                    {activeComplaint.riskSignals.map((signal) => (
                      <span key={signal}>{signal}</span>
                    ))}
                  </div>
                </article>

                <article className="acp-drawer-block">
                  <h4>Case timeline</h4>
                  <ul className="acp-timeline">
                    {activeComplaint.updates.map((update) => (
                      <li key={`${update.stage}-${update.date}`}>
                        <div>
                          <strong>{update.stage}</strong>
                          <p>{new Date(update.date).toLocaleString()}</p>
                        </div>
                        {update.note ? <span>{update.note}</span> : null}
                      </li>
                    ))}
                  </ul>
                </article>

                {activeComplaint.internalNotes.length > 0 ? (
                  <article className="acp-drawer-block">
                    <h4>Internal notes</h4>
                    <ul className="acp-internal-notes">
                      {activeComplaint.internalNotes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  </article>
                ) : null}
              </div>

              <footer>
                <button
                  type="button"
                  className="acp-btn acp-btn-subtle"
                  onClick={() => openActionModal('inProgress', [activeComplaint.id])}
                >
                  In progress
                </button>
                <button
                  type="button"
                  className="acp-btn acp-btn-primary"
                  onClick={() => openActionModal('resolved', [activeComplaint.id])}
                >
                  Resolve
                </button>
                <button
                  type="button"
                  className="acp-btn acp-btn-danger"
                  onClick={() => openActionModal('rejected', [activeComplaint.id])}
                >
                  Reject
                </button>
              </footer>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {pendingAction ? (
          <motion.div
            className="acp-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeActionModal}
          >
            <motion.div
              className="acp-modal"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={(event) => event.stopPropagation()}
            >
              <h3>{ACTION_LABELS[pendingAction.kind].title}</h3>
              <p>{ACTION_LABELS[pendingAction.kind].description}</p>

              <label>
                <span>Moderation note</span>
                <textarea
                  value={actionNote}
                  onChange={(event) => setActionNote(event.target.value)}
                  placeholder="Add a short moderation note for this action"
                  rows={4}
                  maxLength={500}
                />
              </label>

              <div className="acp-modal-actions">
                <button
                  type="button"
                  className="acp-btn acp-btn-ghost"
                  onClick={closeActionModal}
                  disabled={isActionSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="acp-btn acp-btn-primary"
                  onClick={() => void confirmAction()}
                  disabled={isActionSubmitting}
                >
                  {isActionSubmitting ? 'Applying...' : ACTION_LABELS[pendingAction.kind].confirm}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
