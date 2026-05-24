import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bookmark, Clock, MapPin, Sparkles, Star } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  addRestaurantFavorite,
  removeRestaurantFavorite,
  RestaurantApiError,
} from '@/api/restaurantApi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Restaurant } from './types';

interface RestaurantCardProps {
  restaurant: Restaurant;
  isAuthenticated?: boolean;
  onFavoriteChange?: (restaurantId: string, isSaved: boolean) => void;
}

const starItems = Array.from({ length: 5 }, (_, index) => index + 1);

export const RestaurantCard = ({
  restaurant,
  isAuthenticated = false,
  onFavoriteChange,
}: RestaurantCardProps) => {
  const [saved, setSaved] = useState(restaurant.isSaved ?? false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  useEffect(() => {
    setSaved(restaurant.isSaved ?? false);
  }, [restaurant.id, restaurant.isSaved]);

  const handleFavoriteClick = async () => {
    if (!isAuthenticated) {
      toast.error('Sign in to save restaurants.');
      return;
    }

    if (isTogglingFavorite) {
      return;
    }

    const nextSaved = !saved;
    setIsTogglingFavorite(true);

    try {
      if (nextSaved) {
        await addRestaurantFavorite(restaurant.id);
        toast.success('Saved to favorites');
      } else {
        await removeRestaurantFavorite(restaurant.id);
        toast.success('Removed from favorites');
      }
      setSaved(nextSaved);
      onFavoriteChange?.(restaurant.id, nextSaved);
    } catch (error) {
      const message =
        error instanceof RestaurantApiError
          ? error.message
          : 'Could not update favorite.';
      toast.error(message);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  return (
    <motion.article
      className={cn(
        'group flex flex-col overflow-hidden rounded-2xl border border-emerald-100/80 bg-white shadow-sm transition-all dark:border-emerald-400/20',
        'hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-200/30 dark:hover:shadow-emerald-900/30',
      )}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative h-32 overflow-hidden">
        <img
          src={restaurant.imageUrl}
          alt={restaurant.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="fc-image-overlay absolute inset-0" />
        {restaurant.isTrending ? (
          <Badge className="absolute left-3 top-3 bg-emerald-500/90 text-white shadow-sm">
            <Sparkles size={12} /> Trending
          </Badge>
        ) : null}
        <Badge
          className={cn(
            'absolute right-3 top-3 border border-white/70 bg-white/90 text-emerald-800',
            restaurant.isOpen ? 'text-emerald-800' : 'text-slate-600',
          )}
        >
          {restaurant.isOpen ? 'Open Now' : 'Closed'}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col gap-3 bg-white p-4 text-slate-900">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-base font-extrabold text-slate-950">
              {restaurant.name}
            </h4>
            <p className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200">
              {restaurant.category} • {restaurant.priceRange}
            </p>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            disabled={isTogglingFavorite}
            className={cn(
              'h-8 w-8 rounded-full border border-emerald-100/80 bg-white/90 text-emerald-800 shadow-sm transition',
              'hover:bg-emerald-50 dark:border-emerald-400/30 dark:bg-slate-900/80 dark:text-emerald-100',
            )}
            aria-pressed={saved}
            aria-label={saved ? 'Remove from favorites' : 'Save restaurant'}
            onClick={() => void handleFavoriteClick()}
          >
            <Bookmark size={14} className={saved ? 'fill-emerald-500 text-emerald-500' : ''} />
          </Button>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
          <MapPin size={12} />
          <span>{restaurant.location}</span>
        </div>

        <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
          <div className="flex items-center gap-1">
            {starItems.map((star) => (
              <Star
                key={star}
                size={12}
                className={cn(
                  'text-slate-300',
                  star <= Math.round(restaurant.rating) ? 'fill-amber-400 text-amber-400' : '',
                )}
              />
            ))}
            <span className="ml-1 font-extrabold text-slate-900 dark:text-slate-100">
              {restaurant.rating.toFixed(1)}
            </span>
            <span className="text-slate-700 dark:text-slate-300">({restaurant.reviews})</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>{restaurant.eta}</span>
          </div>
        </div>

        {restaurant.tags?.length ? (
          <div className="flex flex-wrap gap-2">
            {restaurant.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-1 text-[11px] font-extrabold text-emerald-900 dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-200"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </motion.article>
  );
};
