import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookmarkPlus,
  MapPin,
  Search,
  Soup,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Toaster } from 'sonner';
import { cn } from '@/lib/utils';
import {
  getRestaurants,
  RestaurantApiError,
} from '@/api/restaurantApi';
import { useAuthStore } from '@/features/auth/store/authStore';

import { AddRestaurantModal } from './AddRestaurantModal';
import { RestaurantCard } from './RestaurantCard';
import type { Restaurant } from './types';

import './styles.css';

export const FoodCorner = () => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const fetchRestaurants = useCallback(async (query: string) => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const trimmed = query.trim();
      const { restaurants: items } = await getRestaurants({
        q: trimmed || undefined,
        top_rated: !trimmed ? true : undefined,
        per_page: 20,
      });
      setRestaurants(items);
    } catch (error) {
      const message =
        error instanceof RestaurantApiError
          ? error.message
          : 'Could not load restaurants. Please try again.';
      setLoadError(message);
      setRestaurants([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchRestaurants(search);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [search, fetchRestaurants]);

  const handleFavoriteChange = (restaurantId: string, isSaved: boolean) => {
    setRestaurants((prev) =>
      prev.map((item) =>
        item.id === restaurantId ? { ...item, isSaved } : item,
      ),
    );
  };

  const handleOpenAddModal = () => {
    if (!isAuthenticated) {
      toast.error('Sign in to add your restaurant.');
      return;
    }
    setOpen(true);
  };

  return (
    <motion.section
      className={cn(
        'fc-card fc-strong-text fc-scrollable flex w-full min-h-[240px] flex-col gap-4 rounded-3xl p-5 pb-6 text-slate-950 dark:text-white',
        isMinimized && 'fc-minimized',
        'border-emerald-100/60 bg-white/70 dark:border-emerald-400/20',
      )}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      aria-label="Food Corner"
    >
      <Toaster position="top-right" />

      <header className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/45 text-emerald-950 shadow-sm dark:bg-emerald-400/35 dark:text-emerald-100">
            <UtensilsCrossed
              size={18}
              className="text-emerald-950 dark:text-emerald-100"
            />
          </div>

          <div>
            <h3 className="fc-title text-lg font-extrabold text-slate-950 dark:text-white">
              Food Corner
            </h3>

            <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              Popular restaurants near you
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          className="
            h-auto
            p-0
            text-sm
            font-extrabold
            text-emerald-600
            shadow-none
            transition-all
            duration-200
            hover:bg-transparent
            hover:text-emerald-700
            hover:underline
            dark:text-emerald-400
            dark:hover:text-emerald-300
          "
          onClick={() => setIsMinimized((prev) => !prev)}
          aria-expanded={!isMinimized}
        >
          {isMinimized ? 'View All' : 'Minimize'}
        </Button>
      </header>

      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-700" />

          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search restaurants, cuisines"
            className="border-slate-400 bg-white pl-9 text-slate-900 placeholder:text-slate-600 focus-visible:border-emerald-600 focus-visible:ring-emerald-400/70"
          />
        </div>

        <div
          className="
            flex items-center justify-between
            rounded-2xl
            border border-slate-200/80
            bg-white/95
            p-4
            shadow-sm
            backdrop-blur-sm
            transition-all duration-300
            hover:shadow-md
            hover:border-emerald-200
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                flex h-11 w-11 items-center justify-center
                rounded-2xl
                bg-emerald-100
                text-emerald-700
                shadow-sm
              "
            >
              <MapPin size={18} />
            </div>

            <div>
              <p className="text-sm font-bold tracking-tight text-slate-900">
                Add your restaurant
              </p>

              <p className="text-xs font-medium text-slate-600">
                Reach hungry neighbors instantly
              </p>
            </div>
          </div>

          <Button
            className="
              gap-2
              rounded-xl
              bg-emerald-500
              px-4
              text-white
              shadow-sm
              transition-all duration-300
              hover:bg-emerald-600
              hover:shadow-md
            "
            onClick={handleOpenAddModal}
          >
            <Sparkles size={14} />
            Add Listing
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {isLoading ? (
          <div className="grid gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white/70"
              >
                <Skeleton className="h-24 w-full" />

                <div className="space-y-2 p-4">
                  <Skeleton className="h-4 w-3/5" />
                  <Skeleton className="h-3 w-2/5" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-rose-200 bg-rose-50/70 px-6 py-8 text-center">
            <p className="text-sm font-semibold text-rose-800">{loadError}</p>
            <Button size="sm" variant="outline" onClick={() => void fetchRestaurants(search)}>
              Retry
            </Button>
          </div>
        ) : restaurants.length ? (
          <div className="fc-scroll-shadow flex flex-col gap-4">
            {restaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                isAuthenticated={isAuthenticated}
                onFavoriteChange={handleFavoriteChange}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/70 px-6 py-8 text-center dark:border-emerald-400/30 dark:bg-emerald-500/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-emerald-800">
              <Soup size={20} />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">No result</p>

              <p className="text-xs text-slate-600 dark:text-slate-300">
                Try another search or add the first listing for this area.
              </p>
            </div>

            <Button
              size="sm"
              className="gap-2"
              onClick={handleOpenAddModal}
            >
              <BookmarkPlus size={14} />
              Add Restaurant
            </Button>
          </div>
        )}
      </div>

      <AddRestaurantModal
        open={open}
        onOpenChange={setOpen}
        onCreated={() => void fetchRestaurants(search)}
      />
    </motion.section>
  );
};
