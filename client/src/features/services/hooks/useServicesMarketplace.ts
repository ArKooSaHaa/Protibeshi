import { useMemo, useState } from 'react';
import { servicesData } from '../mock/servicesData';
import {
  OfferServiceFormValues,
  ServiceChatMessage,
  ServiceFilterState,
  ServiceItem,
} from '../types/service.types';
import { DEFAULT_SERVICE_FILTERS, useServiceFilters } from './useServiceFilters';

const createId = () => `svc-${Math.random().toString(36).slice(2, 10)}`;

const priceSuffixMap: Record<OfferServiceFormValues['priceUnit'], string> = {
  hour: 'hour',
  session: 'session',
  fixed: 'fixed',
};

export const useServicesMarketplace = () => {
  const [services, setServices] = useState<ServiceItem[]>(servicesData);
  const [filters, setFilters] = useState<ServiceFilterState>(DEFAULT_SERVICE_FILTERS);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [activeDetails, setActiveDetails] = useState<ServiceItem | null>(null);
  const [activeChat, setActiveChat] = useState<ServiceItem | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, ServiceChatMessage[]>>({});

  const filteredServices = useServiceFilters(services, filters);

  const locationLabel = useMemo(() => `Motijheel • ${filters.distance}m radius`, [filters.distance]);

  const onToggleBookmark = (serviceId: string) => {
    setBookmarkedIds((prev) =>
      prev.includes(serviceId) ? prev.filter((item) => item !== serviceId) : [...prev, serviceId]
    );
  };

  const onAddService = (values: OfferServiceFormValues) => {
    const createdService: ServiceItem = {
      id: createId(),
      providerName: 'You',
      avatar: values.photo || 'https://i.pravatar.cc/120?img=11',
      verified: values.verified,
      rating: values.verified ? 4.5 : 4,
      reviews: 0,
      distance: 220,
      category: values.category,
      title: values.serviceTitle.trim(),
      shortDescription: values.shortDescription.trim(),
      fullDescription: values.fullDescription.trim(),
      price: Number(values.price),
      priceUnit: values.priceUnit,
      availability: values.availability,
      experience: Number(values.experience),
      radius: values.serviceRadius,
      createdAt: Date.now(),
      responseTime: 'Usually replies in 20 mins',
      skills: values.shortDescription
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 4),
      certifications: values.certifications
        ? values.certifications
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
      gallery: values.portfolioImages
        ? values.portfolioImages
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
      schedule: values.workingHours
        ? values.workingHours
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
        : ['Flexible schedule'],
      location: values.location,
    };

    setServices((prev) => [createdService, ...prev]);
    setIsOfferModalOpen(false);
    setActiveDetails(createdService);
    setFilters((prev) => ({ ...prev, sortBy: 'Recently Added' }));
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
      [serviceId]: [...(prev[serviceId] || []), userMessage, providerReply],
    }));
  };

  const getPriceLabel = (service: ServiceItem) => `₹${service.price} / ${priceSuffixMap[service.priceUnit]}`;

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
    locationLabel,
    setFilters,
    setIsOfferModalOpen,
    setIsFilterDrawerOpen,
    setActiveDetails,
    setActiveChat,
    onToggleBookmark,
    onAddService,
    onSendMessage,
    getPriceLabel,
  };
};
