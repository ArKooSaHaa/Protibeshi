// src/features/services/types/service.types.ts 
export type ServiceCategory = 
 | 'Tuition' 
 | 'Plumbing' 
 | 'Electrical' 
 | 'Cleaning' 
 | 'Fitness' 
 | 'Cooking' 
 | 'IT Support' 
 | 'Babysitting' 
 | 'Home Repair' 
 | 'Other'; 
 
export type ServiceAvailability = 'Available today' | 'Weekends only' | 
'Flexible'; 
 
export type ServiceSortBy = 
 | 'Nearest' 
 | 'Highest Rated' 
 | 'Lowest Price' 
 | 'Most Reviewed' 
 | 'Recently Added'; 
 
export type ServicePriceUnit = 'hour' | 'session' | 'fixed'; 
 
export interface ServiceItem { 
 id: string; 
 providerName: string; 
 avatar: string; 
 verified: boolean; 
 rating: number; 
 reviews: number; 
 distance: number; 
 category: ServiceCategory; 
 title: string; 
 shortDescription: string; 
 fullDescription: string; 
 price: number; 
 priceUnit: ServicePriceUnit; 
 availability: ServiceAvailability; 
 experience: number; 
 radius: number; 
 createdAt: number; 
 responseTime: string; 
 skills: string[]; 
 certifications: string[]; 
 gallery?: string[]; 
 schedule: string[]; 
 location: string; 
} 
 
export interface ServiceFilterState { 
 distance: number; 
 categories: ServiceCategory[]; 
 availability: ServiceAvailability[]; 
 minPrice: number; 
 maxPrice: number; 
 verifiedOnly: boolean; 
 minRating: number; 
 sortBy: ServiceSortBy; 
} 
 
export interface OfferServiceFormValues { 
 serviceTitle: string; 
 category: ServiceCategory; 
 shortDescription: string; 
 fullDescription: string; 
 price: string; 
 priceUnit: ServicePriceUnit; 
 availability: ServiceAvailability; 
 experience: string; 
 serviceRadius: number; 
 location: string; 
 verified: boolean; 
 photo?: string; 
 portfolioImages: string; 
 certifications: string; 
 workingHours: string; 
} 
 
export interface ServiceChatMessage { 
 id: string; 
 sender: 'user' | 'provider'; 
text: string; 
timestamp: number; 
} 