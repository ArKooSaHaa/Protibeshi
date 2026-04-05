// src/features/relief/hooks/useReliefBoard.ts
import { useCallback, useEffect, useState } from 'react';
import {
  addReliefComment,
  createRelief,
  deleteRelief,
  getReliefs,
  offerHelp,
  reportRelief,
  ReliefApiError,
} from '@/api/relief';
import type { ReliefApiComment, ReliefApiItem, ReliefApiUser } from '@/api/relief';
import { createOffer, getOffers } from '@/api/offerApi';
import type { OfferApiItem } from '@/api/offerApi';
import type {
  HelpOffer,
  ReliefComment,
  HelpOfferFormState,
  ReliefFormErrors,
  ReliefHelpType,
  ReliefStatus,
  ReliefRequest,
  ReliefRequestFormState,
  ReliefUrgency,
} from '../types/relief.types';
import { reliefHelpTypes } from '../types/relief.types';
import { useReliefFilters } from './useReliefFilters';

type ModalMode = 'request' | 'offer' | null;

const DEFAULT_API_BASE = 'http://127.0.0.1:8000';
const OFFERED_RELIEF_IDS_STORAGE_KEY_PREFIX = 'relief.offered.help.ids.v2';
const LEGACY_OFFERED_RELIEF_IDS_STORAGE_KEY = 'relief.offered.help.ids';

const initialRequestForm: ReliefRequestFormState = {
  title: '',
  helpType: '',
  description: '',
  urgency: '',
  location: 'Motijheel, Dhaka',
  visibility: 'Public',
  contactPreference: 'In-app message',
  timeSensitivity: 'Immediate',
  photo: null,
  phone: '',
};

const initialOfferForm: HelpOfferFormState = {
  title: '',
  helpType: '',
  description: '',
  availability: '',
  serviceRadius: 2,
  contactPreference: 'In-app message',
  isRecurring: false,
  phone: '',
};

const decodeCurrentUserIdFromToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const token = window.localStorage.getItem('token');
  if (!token) {
    return null;
  }

  try {
    const payloadSegment = token.split('.')[1];
    if (!payloadSegment) {
      return null;
    }

    const normalizedPayload = payloadSegment
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + (4 - (normalizedPayload.length % 4 || 4)),
      '=',
    );

    const payload = JSON.parse(atob(paddedPayload));
    const userId = Number(payload?.sub ?? payload?.user_id ?? payload?.id);

    return Number.isFinite(userId) ? userId : null;
  } catch {
    return null;
  }
};

const resolveStorageUserId = (providedUserId?: number | null) => {
  if (
    typeof providedUserId === 'number'
    && Number.isFinite(providedUserId)
    && providedUserId > 0
  ) {
    return providedUserId;
  }

  return decodeCurrentUserIdFromToken();
};

const getOfferedReliefIdsStorageKey = (providedUserId?: number | null) => {
  const userId = resolveStorageUserId(providedUserId);
  if (typeof userId !== 'number' || !Number.isFinite(userId) || userId <= 0) {
    return null;
  }

  return `${OFFERED_RELIEF_IDS_STORAGE_KEY_PREFIX}.${userId}`;
};

const toTitleCase = (value: string) =>
  value
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');

const toReliefHelpType = (value: unknown): ReliefHelpType => {
  const raw = String(value || '').trim();
  if (!raw) {
    return 'Other';
  }

  const normalized = toTitleCase(raw.replace(/[_-]/g, ' ').toLowerCase());
  return reliefHelpTypes.includes(normalized as ReliefHelpType)
    ? (normalized as ReliefHelpType)
    : 'Other';
};

const toReliefUrgency = (value: unknown): ReliefUrgency => {
  const normalized = String(value || '').trim().toLowerCase();

  if (normalized === 'important') return 'Important';
  if (normalized === 'urgent') return 'Urgent';
  if (normalized === 'critical') return 'Critical';

  return 'Normal';
};

const toReliefStatus = (value: unknown): ReliefStatus => {
  const normalized = String(value || '').trim().toLowerCase();

  if (normalized === 'assigned') return 'Assigned';
  if (normalized === 'completed') return 'Completed';

  return 'Open';
};

const toAvatarInitials = (name: string): string => {
  const words = name
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean);

  if (words.length === 0) {
    return 'NN';
  }

  const first = words[0]?.[0] || '';
  const second = words[1]?.[0] || words[0]?.[1] || '';

  return `${first}${second}`.toUpperCase();
};

const resolveUserImageUrl = (rawPath: string | null | undefined) => {
  if (!rawPath) {
    return null;
  }

  const normalizedPath = rawPath.replace(/\\/g, '/').trim();
  if (!normalizedPath) {
    return null;
  }

  if (normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')) {
    return normalizedPath;
  }

  const baseUrl = import.meta.env.VITE_API_URL || DEFAULT_API_BASE;

  if (normalizedPath.startsWith('/')) {
    return `${baseUrl}${normalizedPath}`;
  }

  if (normalizedPath.startsWith('storage/')) {
    return `${baseUrl}/${normalizedPath}`;
  }

  if (normalizedPath.startsWith('public/storage/')) {
    return `${baseUrl}/${normalizedPath.replace(/^public\//, '')}`;
  }

  return `${baseUrl}/storage/${normalizedPath}`;
};

const resolveReliefUserProfilePhoto = (user: ReliefApiUser | null | undefined) => {
  if (!user) {
    return null;
  }

  const candidates = [
    user.profile_picture_url,
    user.profile_picture,
    user.avatar_url,
    user.avatar,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      const resolved = resolveUserImageUrl(candidate);
      if (resolved) {
        return resolved;
      }
    }
  }

  return null;
};

const getStoredOfferedReliefIds = (providedUserId?: number | null) => {
  if (typeof window === 'undefined') {
    return new Set<string>();
  }

  const storageKey = getOfferedReliefIdsStorageKey(providedUserId);
  if (!storageKey) {
    return new Set<string>();
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return new Set<string>();
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return new Set<string>();
    }

    return new Set(parsed.map((value) => String(value)));
  } catch {
    return new Set<string>();
  }
};

const markReliefAsOfferedInStorage = (
  reliefId: number | string,
  providedUserId?: number | null,
) => {
  if (typeof window === 'undefined') {
    return;
  }

  const storageKey = getOfferedReliefIdsStorageKey(providedUserId);
  if (!storageKey) {
    return;
  }

  const next = getStoredOfferedReliefIds(providedUserId);
  next.add(String(reliefId));
  window.localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
};

const clearLegacyOfferedReliefIdsStorage = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(LEGACY_OFFERED_RELIEF_IDS_STORAGE_KEY);
};

const resolveUserName = (relief: ReliefApiItem): string => {
  const user = relief.user;
  if (!user) {
    return 'Neighbor';
  }

  const firstName = String(user.first_name || '').trim();
  const lastName = String(user.last_name || '').trim();
  const fullName = `${firstName} ${lastName}`.trim();

  if (fullName) {
    return fullName;
  }

  return String(user.name || user.username || user.email || 'Neighbor').trim() || 'Neighbor';
};

const resolveCommentAuthorName = (comment: ReliefApiComment): string => {
  const user = comment.user;
  if (!user) {
    return 'Neighbor';
  }

  const firstName = String(user.first_name || '').trim();
  const lastName = String(user.last_name || '').trim();
  const fullName = `${firstName} ${lastName}`.trim();

  if (fullName) {
    return fullName;
  }

  return String(user.name || user.username || user.email || 'Neighbor').trim() || 'Neighbor';
};

const normalizeReliefComment = (comment: ReliefApiComment): ReliefComment => {
  const author = resolveCommentAuthorName(comment);
  const avatarUrl = resolveReliefUserProfilePhoto(comment.user);

  return {
    id: String(comment.id),
    author,
    avatarInitials: toAvatarInitials(author),
    avatarUrl,
    message: String(comment.comment || ''),
    createdAt: String(comment.created_at || new Date().toISOString()),
  };
};

const normalizeRelief = (relief: ReliefApiItem): ReliefRequest => {
  const postedBy = resolveUserName(relief);
  const avatarUrl = resolveReliefUserProfilePhoto(relief.user);

  return {
    id: String(relief.id),
    backendId: Number(relief.id),
    userId: Number(relief.user_id),
    type: 'request',
    helpType: toReliefHelpType(relief.type),
    title: String(relief.title || 'Untitled request'),
    description: String(relief.description || ''),
    urgency: toReliefUrgency(relief.urgency),
    status: toReliefStatus(relief.status),
    visibility: String(relief.visibility || '').toLowerCase() === 'private'
      ? 'Only verified neighbors'
      : 'Public',
    contactPreference: String(relief.contact_preference || '').toLowerCase().includes('phone')
      ? 'Phone'
      : 'In-app message',
    timeSensitivity: String(relief.time_sensitivity || 'Flexible') as ReliefRequest['timeSensitivity'],
    location: String(relief.location || ''),
    distance: 0,
    createdAt: String(relief.created_at || new Date().toISOString()),
    updatedAt: String(relief.updated_at || new Date().toISOString()),
    postedBy,
    avatarInitials: toAvatarInitials(postedBy),
    avatarUrl,
    verified: false,
    anonymous: false,
    hasOfferedHelp: Boolean(relief.has_offered_help),
    volunteerCount: Number(relief.helpers_count || 0),
    volunteers: [],
    timeline: [
      {
        stage: 'Posted',
        date: String(relief.created_at || new Date().toISOString()),
      },
    ],
    comments: Array.isArray(relief.comments)
      ? relief.comments.map(normalizeReliefComment)
      : [],
    photos: [],
  };
};

const normalizeOffer = (offer: OfferApiItem): HelpOffer => {
  const postedBy = String(offer.user?.name || 'Neighbor').trim() || 'Neighbor';
  const helpType = toReliefHelpType(offer.help_types?.[0] || 'other');
  const availability = String(offer.availability?.[0] || 'today').trim().toLowerCase();

  const availabilityLabelMap: Record<string, HelpOffer['availability']> = {
    today: 'Today only',
    this_week: 'This week',
    weekends: 'Weekends',
    on_call: 'On-call',
    recurring: 'Recurring',
  };

  return {
    id: String(offer.id),
    type: 'offer',
    helpType,
    title: String(offer.short_summary || 'Untitled offer'),
    description: String(offer.description || ''),
    availability: availabilityLabelMap[availability] || 'Today only',
    serviceRadius: Number(offer.service_radius || 0),
    contactPreference: offer.contact_preference === 'phone' ? 'Phone' : 'In-app message',
    isRecurring: Boolean(offer.is_recurring),
    location: 'Nearby',
    distance: 0,
    createdAt: String(offer.created_at || new Date().toISOString()),
    postedBy,
    avatarInitials: toAvatarInitials(postedBy),
    verified: false,
  };
};

const validateRequestForm = (
  form: ReliefRequestFormState,
): ReliefFormErrors<ReliefRequestFormState> => {
  const errors: ReliefFormErrors<ReliefRequestFormState> = {};
  if (!form.title.trim()) errors.title = 'Title is required.';
  if (!form.helpType) errors.helpType = 'Please select a type of help.';
  if (!form.description.trim() || form.description.trim().length < 20)
    errors.description = 'Please provide at least 20 characters of description.';
  if (!form.urgency) errors.urgency = 'Please select urgency level.';
  return errors;
};

const validateOfferForm = (
  form: HelpOfferFormState,
): ReliefFormErrors<HelpOfferFormState> => {
  const errors: ReliefFormErrors<HelpOfferFormState> = {};
  if (!form.title.trim()) errors.title = 'Title is required.';
  if (!form.helpType) errors.helpType = 'Please select a type of help you can offer.';
  if (!form.description.trim() || form.description.trim().length < 20)
    errors.description = 'Please provide at least 20 characters of description.';
  if (!form.availability) errors.availability = 'Please select your availability.';
  return errors;
};

const mapOfferHelpTypeToApi = (value: HelpOfferFormState['helpType']) => {
  const map: Record<string, string> = {
    Food: 'food',
    Medical: 'medical',
    Shelter: 'shelter',
    Transportation: 'transportation',
    Financial: 'financial',
    Utilities: 'utilities',
    'Disaster Relief': 'disaster_relief',
    Other: 'other',
  };

  return map[String(value)] || 'other';
};

const mapOfferAvailabilityToApi = (value: HelpOfferFormState['availability']) => {
  const map: Record<string, string> = {
    'Today only': 'today',
    'This week': 'this_week',
    Weekends: 'weekends',
    'On-call': 'on_call',
    Recurring: 'recurring',
  };

  return map[String(value)] || 'today';
};

type UseReliefBoardOptions = {
  onUnauthorized?: () => void;
};

export const useReliefBoard = (options: UseReliefBoardOptions = {}) => {
  const { onUnauthorized } = options;

  const [requests, setRequests] = useState<ReliefRequest[]>([]);
  const [offers, setOffers] = useState<HelpOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [offeringRequestId, setOfferingRequestId] = useState<string | null>(null);
  const [commentingRequestId, setCommentingRequestId] = useState<string | null>(null);
  const [reportingRequestId, setReportingRequestId] = useState<string | null>(null);
  const [deletingRequestId, setDeletingRequestId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const filterSystem = useReliefFilters(requests, offers);

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedRequest, setSelectedRequest] = useState<ReliefRequest | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<HelpOffer | null>(null);

  const [requestForm, setRequestForm] =
    useState<ReliefRequestFormState>(initialRequestForm);
  const [requestFormErrors, setRequestFormErrors] =
    useState<ReliefFormErrors<ReliefRequestFormState>>({});

  const [offerForm, setOfferForm] = useState<HelpOfferFormState>(initialOfferForm);
  const [offerFormErrors, setOfferFormErrors] =
    useState<ReliefFormErrors<HelpOfferFormState>>({});

  const loadReliefs = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [reliefData, offerData] = await Promise.all([getReliefs(), getOffers()]);
      const storedOfferedIds = getStoredOfferedReliefIds();
      setRequests(reliefData.map((relief) => {
        const normalized = normalizeRelief(relief);

        if (!normalized.hasOfferedHelp && storedOfferedIds.has(String(relief.id))) {
          return {
            ...normalized,
            hasOfferedHelp: true,
          };
        }

        return normalized;
      }));
      setOffers(offerData.map(normalizeOffer));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load relief requests';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const decodedUserId = decodeCurrentUserIdFromToken();
    setCurrentUserId(decodedUserId);
    clearLegacyOfferedReliefIdsStorage();
    void loadReliefs();
  }, [loadReliefs]);

  // ── Form field updaters ───────────────────────────────────────────────────
  const updateRequestField = <K extends keyof ReliefRequestFormState>(
    key: K,
    value: ReliefRequestFormState[K],
  ) => {
    setRequestForm((prev) => ({ ...prev, [key]: value }));
    setRequestFormErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const updateOfferField = <K extends keyof HelpOfferFormState>(
    key: K,
    value: HelpOfferFormState[K],
  ) => {
    setOfferForm((prev) => ({ ...prev, [key]: value }));
    setOfferFormErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  // ── Submit handlers ───────────────────────────────────────────────────────
  const handleSubmitRequest = async () => {
    const errors = validateRequestForm(requestForm);
    if (Object.keys(errors).length > 0) {
      setRequestFormErrors(errors);
      return false;
    }

    const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
    if (!token) {
      setErrorMessage('Please sign in to create a relief request.');
      onUnauthorized?.();
      return false;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const created = await createRelief({
        title: requestForm.title.trim(),
        type: String(requestForm.helpType).toLowerCase(),
        description: requestForm.description.trim(),
        urgency: String(requestForm.urgency).toLowerCase(),
        time_sensitivity: requestForm.timeSensitivity,
        visibility: requestForm.visibility === 'Public' ? 'public' : 'private',
        contact_preference: requestForm.contactPreference === 'Phone' ? 'phone' : 'in_app',
        location: requestForm.location.trim(),
      });

      if (created) {
        setRequests((prev) => [normalizeRelief(created), ...prev]);
      } else {
        await loadReliefs();
      }

      setSuccessMessage('Relief request posted successfully.');
      setRequestForm(initialRequestForm);
      setRequestFormErrors({});
      setModalMode(null);
      return true;
    } catch (error) {
      if (error instanceof ReliefApiError && error.status === 401) {
        setErrorMessage('Your session has expired. Please sign in again.');
        onUnauthorized?.();
      } else {
        const message = error instanceof Error ? error.message : 'Failed to create relief request';
        setErrorMessage(message);
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitOffer = async () => {
    const errors = validateOfferForm(offerForm);
    if (Object.keys(errors).length > 0) {
      setOfferFormErrors(errors);
      return;
    }

    // Build payload for backend
    const payload = {
      short_summary: offerForm.title.trim(),
      description: offerForm.description.trim(),
      help_types: offerForm.helpType ? [mapOfferHelpTypeToApi(offerForm.helpType)] : [],
      availability: offerForm.availability
        ? [mapOfferAvailabilityToApi(offerForm.availability)]
        : [],
      service_radius: Math.round(offerForm.serviceRadius),
      contact_preference: offerForm.contactPreference === 'In-app message' ? 'in_app' : 'phone',
      is_recurring: offerForm.isRecurring,
    };

    try {
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
      if (!token) {
        setErrorMessage('Please sign in to offer help.');
        onUnauthorized?.();
        return;
      }

      await createOffer(payload, token);
      await loadReliefs();
      setSuccessMessage('Offer submitted successfully!');
      setOfferForm(initialOfferForm);
      setOfferFormErrors({});
      setModalMode(null);
    } catch (error: any) {
      if (error?.response?.status === 401) {
        setErrorMessage('Unauthorized. Please log in again.');
        onUnauthorized?.();
      } else if (error?.response?.status === 422 && error?.response?.data?.errors) {
        const backendErrors = error.response.data.errors as Record<string, string[] | string>;
        const mappedErrors: ReliefFormErrors<HelpOfferFormState> = {};

        if (backendErrors.short_summary) {
          mappedErrors.title = Array.isArray(backendErrors.short_summary)
            ? backendErrors.short_summary[0]
            : String(backendErrors.short_summary);
        }

        if (backendErrors.description) {
          mappedErrors.description = Array.isArray(backendErrors.description)
            ? backendErrors.description[0]
            : String(backendErrors.description);
        }

        if (backendErrors.help_types || backendErrors['help_types.0']) {
          const value = backendErrors.help_types || backendErrors['help_types.0'];
          mappedErrors.helpType = Array.isArray(value) ? value[0] : String(value);
        }

        if (backendErrors.availability || backendErrors['availability.0']) {
          const value = backendErrors.availability || backendErrors['availability.0'];
          mappedErrors.availability = Array.isArray(value) ? value[0] : String(value);
        }

        setOfferFormErrors(mappedErrors);
        setErrorMessage('Please correct the highlighted offer fields.');
      } else if (error?.response?.status === 500) {
        setErrorMessage('Server error. Please try again later.');
      } else {
        setErrorMessage('Failed to submit offer.');
      }
    }
  };

  const onOfferHelp = useCallback(async (request: ReliefRequest) => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
    if (!token) {
      setErrorMessage('Please sign in to offer help.');
      onUnauthorized?.();
      return;
    }

    if (request.hasOfferedHelp) {
      setErrorMessage('You have already offered help for this request.');
      return;
    }

    const targetId = request.backendId ?? Number(request.id);
    if (!Number.isFinite(targetId)) {
      setErrorMessage('Invalid relief request.');
      return;
    }

    setOfferingRequestId(request.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updated = await offerHelp(targetId);
      const viewerId = resolveStorageUserId(currentUserId);

      if (updated) {
        const normalized = normalizeRelief(updated);
        markReliefAsOfferedInStorage(targetId, viewerId);
        setRequests((prev) => prev.map((item) => (
          item.id === request.id
            ? {
              ...item,
              volunteerCount: normalized.volunteerCount,
              status: normalized.status,
              hasOfferedHelp: normalized.hasOfferedHelp,
            }
            : item
        )));
      } else {
        await loadReliefs();
      }

      setSuccessMessage('Thank you for offering help.');
    } catch (error) {
      if (error instanceof ReliefApiError && error.status === 401) {
        setErrorMessage('Your session has expired. Please sign in again.');
        onUnauthorized?.();
      } else if (error instanceof ReliefApiError && error.status === 409) {
        const viewerId = resolveStorageUserId(currentUserId);
        markReliefAsOfferedInStorage(targetId, viewerId);
        setRequests((prev) => prev.map((item) => (
          item.id === request.id ? { ...item, hasOfferedHelp: true } : item
        )));
        setErrorMessage(error.message || 'You have already offered help for this request.');
      } else {
        const message = error instanceof Error ? error.message : 'Failed to offer help';
        setErrorMessage(message);
      }
    } finally {
      setOfferingRequestId(null);
    }
  }, [loadReliefs, onUnauthorized]);

  const onSubmitRequestComment = useCallback(async (
    request: ReliefRequest,
    message: string,
  ) => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
    if (!token) {
      setErrorMessage('Please sign in to add a comment.');
      onUnauthorized?.();
      return false;
    }

    const content = message.trim();
    if (!content) {
      setErrorMessage('Comment cannot be empty.');
      return false;
    }

    const targetId = request.backendId ?? Number(request.id);
    if (!Number.isFinite(targetId)) {
      setErrorMessage('Invalid relief request.');
      return false;
    }

    setCommentingRequestId(request.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const createdComment = await addReliefComment(targetId, content);

      if (createdComment) {
        const normalizedComment = normalizeReliefComment(createdComment);
        setRequests((prev) => prev.map((item) => {
          if (item.id !== request.id) {
            return item;
          }

          return {
            ...item,
            comments: [...item.comments, normalizedComment],
          };
        }));

        setSelectedRequest((prev) => {
          if (!prev || prev.id !== request.id) {
            return prev;
          }

          return {
            ...prev,
            comments: [...prev.comments, normalizedComment],
          };
        });
      } else {
        await loadReliefs();
      }

      setSuccessMessage('Comment added successfully.');
      return true;
    } catch (error) {
      if (error instanceof ReliefApiError && error.status === 401) {
        setErrorMessage('Your session has expired. Please sign in again.');
        onUnauthorized?.();
      } else {
        const fallbackMessage = error instanceof Error ? error.message : 'Failed to add comment';
        setErrorMessage(fallbackMessage);
      }

      return false;
    } finally {
      setCommentingRequestId(null);
    }
  }, [loadReliefs, onUnauthorized]);

  const onReportRequest = useCallback(async (
    request: ReliefRequest,
    reason: string,
  ): Promise<{ message: string }> => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
    if (!token) {
      const message = 'Please sign in to report this relief request.';
      setErrorMessage(message);
      onUnauthorized?.();
      throw new Error(message);
    }

    const content = reason.trim();
    if (content.length < 5) {
      const message = 'Please provide at least 5 characters for the report reason.';
      setErrorMessage(message);
      throw new Error(message);
    }

    const targetId = request.backendId ?? Number(request.id);
    if (!Number.isFinite(targetId)) {
      const message = 'Invalid relief request.';
      setErrorMessage(message);
      throw new Error(message);
    }

    setReportingRequestId(request.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await reportRelief(targetId, content);
      const message = response.message || 'Relief request reported successfully. Admin team will review it.';
      setSuccessMessage(message);

      return { message };
    } catch (error) {
      if (error instanceof ReliefApiError && error.status === 401) {
        const message = 'Your session has expired. Please sign in again.';
        setErrorMessage(message);
        onUnauthorized?.();
        throw new Error(message);
      }

      const message = error instanceof Error ? error.message : 'Failed to report relief request';
      setErrorMessage(message);
      throw new Error(message);
    } finally {
      setReportingRequestId(null);
    }
  }, [onUnauthorized]);

  const onDeleteRequest = useCallback(async (request: ReliefRequest) => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
    if (!token) {
      setErrorMessage('Please sign in to delete this request.');
      onUnauthorized?.();
      return;
    }

    const targetId = request.backendId ?? Number(request.id);
    if (!Number.isFinite(targetId)) {
      setErrorMessage('Invalid relief request.');
      return;
    }

    setDeletingRequestId(request.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await deleteRelief(targetId);
      setRequests((prev) => prev.filter((item) => item.id !== request.id));
      setSelectedRequest((prev) => (prev?.id === request.id ? null : prev));
      setSuccessMessage('Relief request deleted successfully.');
    } catch (error) {
      if (error instanceof ReliefApiError && error.status === 401) {
        setErrorMessage('Your session has expired. Please sign in again.');
        onUnauthorized?.();
      } else {
        const message = error instanceof Error ? error.message : 'Failed to delete relief request';
        setErrorMessage(message);
      }
    } finally {
      setDeletingRequestId(null);
    }
  }, [onUnauthorized]);

  const clearFeedback = useCallback(() => {
    setErrorMessage(null);
    setSuccessMessage(null);
  }, []);

  return {
    // data
    requests,
    offers,
    filteredRequests: filterSystem.filteredRequests,
    filteredOffers: filterSystem.filteredOffers,
    isLoading,
    isSubmitting,
    offeringRequestId,
    commentingRequestId,
    reportingRequestId,
    deletingRequestId,
    errorMessage,
    successMessage,
    currentUserId,
    loadReliefs,
    clearFeedback,
    // filter system
    filters: filterSystem.filters,
    isFilterOpen: filterSystem.isFilterOpen,
    setIsFilterOpen: filterSystem.setIsFilterOpen,
    activeFilterCount: filterSystem.activeFilterCount,
    toggleTab: filterSystem.toggleTab,
    toggleHelpType: filterSystem.toggleHelpType,
    toggleUrgency: filterSystem.toggleUrgency,
    toggleStatus: filterSystem.toggleStatus,
    setTimeRange: filterSystem.setTimeRange,
    setDistance: filterSystem.setDistance,
    setVerifiedOnly: filterSystem.setVerifiedOnly,
    resetFilters: filterSystem.resetFilters,
    // modal
    modalMode,
    setModalMode,
    // detail drawers
    selectedRequest,
    setSelectedRequest,
    selectedOffer,
    setSelectedOffer,
    // request form
    requestForm,
    requestFormErrors,
    updateRequestField,
    handleSubmitRequest,
    onOfferHelp,
    onSubmitRequestComment,
    onReportRequest,
    onDeleteRequest,
    // offer form
    offerForm,
    offerFormErrors,
    updateOfferField,
    handleSubmitOffer,
  };
};
