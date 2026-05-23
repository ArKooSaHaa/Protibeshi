export type RestaurantCategory =
  | 'Fast Food'
  | 'Cafe'
  | 'Bengali'
  | 'Chinese'
  | 'Dessert'
  | 'Bakery'
  | 'BBQ'
  | 'Healthy'
  | 'Street Food';

export type PriceRange = '$' | '$$' | '$$$';

export type Restaurant = {
  id: string;
  name: string;
  category: RestaurantCategory;
  location: string;
  rating: number;
  reviews: number;
  eta: string;
  distanceKm: number;
  priceRange: PriceRange;
  imageUrl: string;
  isOpen: boolean;
  isTrending?: boolean;
  tags?: string[];
  isSaved?: boolean;
};
