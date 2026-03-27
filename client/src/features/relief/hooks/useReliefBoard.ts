// src/features/relief/hooks/useReliefBoard.ts
import { useCallback, useEffect, useState } from 'react';
import {
  createRelief,
  deleteRelief,
  getReliefs,
  offerHelp,
  ReliefApiError,
} from '@/api/relief';
import type { ReliefApiItem } from '@/api/relief';
import { createOffer, getOffers } from '@/api/offerApi';
import type { OfferApiItem } from '@/api/offerApi';
import type {
  HelpOffer,
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

const normalizeRelief = (relief: ReliefApiItem): ReliefRequest => {
  const postedBy = resolveUserName(relief);

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
    verified: false,
    anonymous: false,
    volunteerCount: Number(relief.helpers_count || 0),
    volunteers: [],
    timeline: [
      {
        stage: 'Posted',
        date: String(relief.created_at || new Date().toISOString()),
      },
    ],
    comments: [],
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
      setRequests(reliefData.map(normalizeRelief));
      setOffers(offerData.map(normalizeOffer));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load relief requests';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setCurrentUserId(decodeCurrentUserIdFromToken());
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

    const targetId = request.backendId ?? Number(request.id);
    if (!Number.isFinite(targetId)) {
      setErrorMessage('Invalid relief request.');
      return;
    }

    setOfferingRequestId(request.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    setRequests((prev) => prev.map((item) => (
      item.id === request.id ? { ...item, volunteerCount: item.volunteerCount + 1 } : item
    )));

    try {
      const updated = await offerHelp(targetId);

      if (updated) {
        const normalized = normalizeRelief(updated);
        setRequests((prev) => prev.map((item) => (
          item.id === request.id
            ? { ...item, volunteerCount: normalized.volunteerCount, status: normalized.status }
            : item
        )));
      }

      setSuccessMessage('Thank you for offering help.');
    } catch (error) {
      setRequests((prev) => prev.map((item) => (
        item.id === request.id ? { ...item, volunteerCount: Math.max(0, item.volunteerCount - 1) } : item
      )));

      if (error instanceof ReliefApiError && error.status === 401) {
        setErrorMessage('Your session has expired. Please sign in again.');
        onUnauthorized?.();
      } else {
        const message = error instanceof Error ? error.message : 'Failed to offer help';
        setErrorMessage(message);
      }
    } finally {
      setOfferingRequestId(null);
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
    onDeleteRequest,
    // offer form
    offerForm,
    offerFormErrors,
    updateOfferField,
    handleSubmitOffer,
  };
};
