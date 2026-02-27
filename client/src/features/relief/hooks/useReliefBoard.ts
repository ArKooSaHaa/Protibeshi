import { useState } from 'react';
import { mockHelpOffers, mockReliefRequests } from '../mock/relief.mock';
import type {
  HelpOffer,
  HelpOfferFormState,
  ReliefFormErrors,
  ReliefRequest,
  ReliefRequestFormState,
} from '../types/relief.types';
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

export const useReliefBoard = () => {
  const [requests, setRequests] = useState<ReliefRequest[]>(mockReliefRequests);
  const [offers, setOffers] = useState<HelpOffer[]>(mockHelpOffers);

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
  const handleSubmitRequest = () => {
    const errors = validateRequestForm(requestForm);
    if (Object.keys(errors).length > 0) {
      setRequestFormErrors(errors);
      return;
    }

    const newRequest: ReliefRequest = {
      id: `REL-2026-${String(requests.length + 1).padStart(3, '0')}`,
      type: 'request',
      helpType: requestForm.helpType as ReliefRequest['helpType'],
      title: requestForm.title,
      description: requestForm.description,
      urgency: requestForm.urgency as ReliefRequest['urgency'],
      status: 'Open',
      visibility: requestForm.visibility,
      contactPreference: requestForm.contactPreference,
      timeSensitivity: requestForm.timeSensitivity,
      location: requestForm.location,
      distance: Math.floor(Math.random() * 500) + 50,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      postedBy: 'You',
      avatarInitials: 'YO',
      verified: true,
      anonymous: false,
      volunteerCount: 0,
      volunteers: [],
      timeline: [{ stage: 'Posted', date: new Date().toISOString() }],
      comments: [],
      photos: [],
    };

    setRequests((prev) => [newRequest, ...prev]);
    setRequestForm(initialRequestForm);
    setRequestFormErrors({});
    setModalMode(null);
  };

  const handleSubmitOffer = () => {
    const errors = validateOfferForm(offerForm);
    if (Object.keys(errors).length > 0) {
      setOfferFormErrors(errors);
      return;
    }

    const newOffer: HelpOffer = {
      id: `OFF-2026-${String(offers.length + 1).padStart(3, '0')}`,
      type: 'offer',
      helpType: offerForm.helpType as HelpOffer['helpType'],
      title: offerForm.title,
      description: offerForm.description,
      availability: offerForm.availability as HelpOffer['availability'],
      serviceRadius: offerForm.serviceRadius,
      contactPreference: offerForm.contactPreference,
      isRecurring: offerForm.isRecurring,
      location: 'Motijheel, Dhaka',
      distance: Math.floor(Math.random() * 500) + 50,
      createdAt: new Date().toISOString(),
      postedBy: 'You',
      avatarInitials: 'YO',
      verified: true,
    };

    setOffers((prev) => [newOffer, ...prev]);
    setOfferForm(initialOfferForm);
    setOfferFormErrors({});
    setModalMode(null);
  };

  return {
    // data
    filteredRequests: filterSystem.filteredRequests,
    filteredOffers: filterSystem.filteredOffers,
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
    // offer form
    offerForm,
    offerFormErrors,
    updateOfferField,
    handleSubmitOffer,
  };
};
