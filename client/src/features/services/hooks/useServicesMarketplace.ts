// src/features/services/hooks/useServicesMarketplace.ts 
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createService,
  deleteService,
  getServices,
} from '@/services/serviceService';
import {
  OfferServiceFormValues,
  ServiceChatMessage,
  ServiceFilterState,
  ServiceItem,
} from '../types/service.types';
import { DEFAULT_SERVICE_FILTERS, useServiceFilters } from
  './useServiceFilters';

const createId = () => `svc-${Math.random().toString(36).slice(2,
  10)}`;

const getCurrentUserIdFromToken = () => {
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

    const normalizedPayload = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
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

const priceSuffixMap: Record<OfferServiceFormValues['priceUnit'],
  string> = {
  hour: 'hour',
  session: 'session',
  fixed: 'fixed',
};

export const useServicesMarketplace = () => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [filters, setFilters] =
    useState<ServiceFilterState>(DEFAULT_SERVICE_FILTERS);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [activeDetails, setActiveDetails] = useState<ServiceItem |
    null>(null);
  const [activeChat, setActiveChat] = useState<ServiceItem |
    null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string,
    ServiceChatMessage[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const filteredServices = useServiceFilters(services, filters);

  const loadServices = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await getServices();
      setServices(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load services';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const locationLabel = useMemo(() => `Motijheel • ${filters.distance}m 
radius`, [filters.distance]);

  useEffect(() => {
    setCurrentUserId(getCurrentUserIdFromToken());
    void loadServices();
  }, [loadServices]);

  const onToggleBookmark = (serviceId: string) => {
    setBookmarkedIds((prev) =>
      prev.includes(serviceId) ? prev.filter((item) => item !==
        serviceId) : [...prev, serviceId]
    );
  };

  const onAddService = useCallback(async (values: OfferServiceFormValues) => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;

    if (!token) {
      setErrorMessage('You need to sign in before posting a service.');
      return false;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData();
    if (values.photo) {
      formData.append('cover_photo', values.photo);
    }

    formData.append('title', values.serviceTitle.trim());
    formData.append('category', values.category);
    formData.append('short_description', values.shortDescription.trim());
    formData.append('full_description', values.fullDescription.trim());
    formData.append('price', values.price);
    formData.append('price_type', values.priceUnit);
    formData.append('availability', values.availability || 'Flexible');
    formData.append('experience_years', values.experience || '0');
    formData.append('service_radius', String(values.serviceRadius));
    formData.append('location', values.location.trim());
    formData.append('working_hours', values.workingHours.trim());

    try {
      const response = await createService(formData, token);
      setSuccessMessage(response.message || 'Service created successfully');
      setIsOfferModalOpen(false);
      setFilters({
        ...DEFAULT_SERVICE_FILTERS,
        sortBy: 'Recently Added',
      });
      await loadServices();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create service';
      setErrorMessage(message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [loadServices]);

  const onDeleteService = useCallback(async (id: string) => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;

    if (!token) {
      setErrorMessage('You need to sign in before deleting a service.');
      return;
    }

    setDeletingServiceId(id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await deleteService(id, token);
      setSuccessMessage(response?.message || 'Service deleted successfully');
      await loadServices();

      setActiveDetails((prev) => (prev?.id === id ? null : prev));
      setActiveChat((prev) => (prev?.id === id ? null : prev));
      setBookmarkedIds((prev) => prev.filter((serviceId) => serviceId !== id));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete service';
      setErrorMessage(message);
    } finally {
      setDeletingServiceId(null);
    }
  }, [loadServices]);

  const clearFeedback = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const onSendMessage = (serviceId: string, text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText) {
      return;
    }

    const userMessage: ServiceChatMessage = {
      id: createId(),
      sender: 'user',
      text: trimmedText,
      timestamp: Date.now(),
    };

    const providerReply: ServiceChatMessage = {
      id: createId(),
      sender: 'provider',
      text: 'Thanks for reaching out. I can share availability and exact price details now.',
      timestamp: Date.now() + 1000,
    };

    setChatMessages((prev) => ({
      ...prev,
      [serviceId]: [...(prev[serviceId] || []), userMessage,
        providerReply],
    }));
  };

  const getPriceLabel = (service: ServiceItem) => `₹${service.price} / 
${priceSuffixMap[service.priceUnit]}`;

  return {
    services,
    filters,
    filteredServices,
    bookmarkedIds,
    isOfferModalOpen,
    isFilterDrawerOpen,
    activeDetails,
    activeChat,
    chatMessages,
    isLoading,
    isSubmitting,
    deletingServiceId,
    errorMessage,
    successMessage,
    currentUserId,
    locationLabel,
    setFilters,
    setIsOfferModalOpen,
    setIsFilterDrawerOpen,
    setActiveDetails,
    setActiveChat,
    onToggleBookmark,
    loadServices,
    onAddService,
    onDeleteService,
    onSendMessage,
    clearFeedback,
    getPriceLabel,
  };
};