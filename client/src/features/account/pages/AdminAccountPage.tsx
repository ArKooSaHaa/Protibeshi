import { AnimatePresence, motion } from 'framer-motion';
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  Clock3,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  banAdminUser,
  fetchAdminUsers,
  getAdminUserErrorMessage,
  type AdminUserRecord,
  type AdminUserSummary,
  unbanAdminUser,
} from '../services/adminUserService';

const sectionTransition = {
  duration: 0.5,
  ease: [0.22, 1, 0.36, 1] as const,
};

const commonAreas = ['Mirpur', 'Dhanmondi', 'Gulshan', 'Uttara', 'Banani', 'Mohakhali', 'Bashundhara'];

type SummaryCard = {
  label: string;
  value: number;
  note: string;
  icon: typeof Users;
  gradient: string;
};

const formatDate = (value: string | null | undefined): string => {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Not available';
  }

  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getInitials = (user: AdminUserRecord): string => {
  const nameSource = user.full_name || user.username || user.email || 'User';
  return nameSource
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
};

const statCards = (summary: AdminUserSummary | null): SummaryCard[] => [
  {
    label: 'Registered Users',
    value: summary?.total_users ?? 0,
    note: 'Everyone registered on Protibeshi',
    icon: Users,
    gradient: 'from-emerald-500/20 via-emerald-400/10 to-white',
  },
  {
    label: 'Matching Filters',
    value: summary?.filtered_users ?? 0,
    note: 'Users matching the current search',
    icon: Search,
    gradient: 'from-sky-500/20 via-cyan-400/10 to-white',
  },
  {
    label: 'Verified Users',
    value: summary?.verified_users ?? 0,
    note: 'Email-verified accounts',
    icon: BadgeCheck,
    gradient: 'from-amber-500/20 via-orange-400/10 to-white',
  },
  {
    label: 'Banned Users',
    value: summary?.banned_users ?? 0,
    note: 'Currently restricted accounts',
    icon: ShieldCheck,
    gradient: 'from-rose-500/20 via-red-400/10 to-white',
  },
];

export const AdminAccountPage = () => {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [summary, setSummary] = useState<AdminUserSummary | null>(null);
  const [availableNeighborhoods, setAvailableNeighborhoods] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('all');
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [onlyBanned, setOnlyBanned] = useState(false);
  const [activeActionUser, setActiveActionUser] = useState<AdminUserRecord | null>(null);
  const [moderationMode, setModerationMode] = useState<'ban' | 'unban' | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banDurationDays, setBanDurationDays] = useState('7');
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchAdminUsers({
        q: searchQuery.trim() || undefined,
        city: selectedCity === 'all' ? undefined : selectedCity,
        neighborhood: selectedNeighborhood === 'all' ? undefined : selectedNeighborhood,
        verified_only: onlyVerified || undefined,
        banned_only: onlyBanned || undefined,
      });

      setUsers(data.users);
      setSummary(data.summary);
      setAvailableNeighborhoods(data.available_neighborhoods);
      setAvailableCities(data.available_cities);
    } catch (requestError) {
      setUsers([]);
      setSummary(null);
      setAvailableNeighborhoods([]);
      setAvailableCities([]);
      setError(getAdminUserErrorMessage(requestError, 'Could not load user directory.'));
    } finally {
      setIsLoading(false);
    }
  }, [onlyBanned, onlyVerified, searchQuery, selectedCity, selectedNeighborhood]);

  const openBanModal = (user: AdminUserRecord) => {
    setActiveActionUser(user);
    setModerationMode('ban');
    setBanReason(user.banned_reason || '');
    setBanDurationDays('7');
    setActionError(null);
  };

  const openUnbanModal = (user: AdminUserRecord) => {
    setActiveActionUser(user);
    setModerationMode('unban');
    setActionError(null);
  };

  const closeActionModal = (force = false) => {
    if (isSubmittingAction && !force) {
      return;
    }

    setActiveActionUser(null);
    setModerationMode(null);
    setBanReason('');
    setBanDurationDays('7');
    setActionError(null);
  };

  const handleBanSubmit = async () => {
    if (!activeActionUser) {
      return;
    }

    const trimmedReason = banReason.trim();
    if (!trimmedReason) {
      setActionError('Please provide a moderation reason before banning this user.');
      return;
    }

    const parsedDuration = Number(banDurationDays);
    const durationDays = Number.isFinite(parsedDuration) && parsedDuration > 0 ? Math.min(parsedDuration, 90) : 7;

    setIsSubmittingAction(true);
    setActionError(null);

    try {
      await banAdminUser(activeActionUser.id, {
        reason: trimmedReason,
        duration_days: durationDays,
      });
      setIsSubmittingAction(false);
      closeActionModal(true);
      await loadUsers();
    } catch (requestError) {
      setActionError(getAdminUserErrorMessage(requestError, 'Unable to ban this user right now.'));
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleUnbanSubmit = async () => {
    if (!activeActionUser) {
      return;
    }

    setIsSubmittingAction(true);
    setActionError(null);

    try {
      await unbanAdminUser(activeActionUser.id);
      setIsSubmittingAction(false);
      closeActionModal(true);
      await loadUsers();
    } catch (requestError) {
      setActionError(getAdminUserErrorMessage(requestError, 'Unable to unban this user right now.'));
    } finally {
      setIsSubmittingAction(false);
    }
  };

  useEffect(() => {
    const debounceId = window.setTimeout(() => {
      void loadUsers();
    }, 280);

    return () => window.clearTimeout(debounceId);
  }, [loadUsers]);

  const matchingCount = summary?.filtered_users ?? users.length;

  const displayedAreas = useMemo(() => {
    const source = availableNeighborhoods.length > 0 ? availableNeighborhoods : commonAreas;
    return ['all', ...source].slice(0, 18);
  }, [availableNeighborhoods]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCity('all');
    setSelectedNeighborhood('all');
    setOnlyVerified(false);
    setOnlyBanned(false);
  };

  return (
    <div className="px-3 pb-10 pt-4 md:px-6">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={sectionTransition}
        className="mx-auto max-w-7xl space-y-6"
      >
        <section className="relative overflow-hidden rounded-[34px] border border-white/70 bg-[linear-gradient(135deg,rgba(236,253,245,0.97),rgba(240,253,250,0.9),rgba(255,255,255,0.98))] p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(16,185,129,0.22),transparent_28%),radial-gradient(circle_at_85%_15%,rgba(45,212,191,0.18),transparent_24%)]" />
          <motion.div
            className="pointer-events-none absolute right-6 top-6 h-24 w-24 rounded-full border border-white/40 bg-white/20"
            animate={{ y: [0, -8, 0], rotate: [0, 6, 0] }}
            transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
          />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3 max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                <Sparkles className="h-3.5 w-3.5" />
                Admin User Directory
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">Registered users by area</h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-700 md:text-base">
                Search every registered account, filter by neighborhood or city, and review local activity at a glance.
              </p>
            </div>

            <motion.button
              type="button"
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => void loadUsers()}
              className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800"
            >
              <RefreshCw className={cn('h-4 w-4', isLoading ? 'animate-spin' : '')} />
              {isLoading ? 'Refreshing...' : 'Refresh Users'}
            </motion.button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards(summary).map((card, index) => (
            <motion.article
              key={card.label}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ ...sectionTransition, delay: index * 0.04 }}
              whileHover={{ y: -5, scale: 1.01 }}
              className={cn(
                'group relative overflow-hidden rounded-[28px] border border-white/70 p-5 shadow-[0_20px_55px_rgba(15,23,42,0.07)] backdrop-blur-xl',
                'bg-linear-to-br',
                card.gradient,
              )}
            >
              <div className="absolute inset-0 bg-white/60 mix-blend-screen" />
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{card.label}</p>
                  <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">{card.value}</p>
                  <p className="mt-2 text-sm text-slate-600">{card.note}</p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/75 p-3 shadow-sm transition-transform duration-300 group-hover:scale-105">
                  <card.icon className="h-6 w-6 text-emerald-700" />
                </div>
              </div>
            </motion.article>
          ))}
        </section>

        <section className="rounded-4xl border border-slate-200/70 bg-white/80 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-xl md:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Filter users</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Area-wise user search</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Focus on a neighborhood like Mirpur, narrow by city, and switch on verified or banned account views.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedNeighborhood('all')}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                  selectedNeighborhood === 'all'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                )}
              >
                All areas
              </button>
              {displayedAreas
                .filter((area) => area !== 'all')
                .map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => setSelectedNeighborhood(area)}
                    className={cn(
                      'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                      selectedNeighborhood === area
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                    )}
                  >
                    {area}
                  </button>
                ))}
            </div>
          </div>

          <div className="mt-6 grid gap-3 xl:grid-cols-[1.15fr_0.7fr_0.7fr_auto]">
            <label className="flex items-center gap-3 rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 py-3">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by name, email, username, phone, or address"
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </label>

            <label className="flex items-center gap-3 rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 py-3">
              <Building2 className="h-4 w-4 text-slate-500" />
              <select
                value={selectedCity}
                onChange={(event) => setSelectedCity(event.target.value)}
                className="w-full bg-transparent text-sm outline-none"
              >
                <option value="all">All cities</option>
                {availableCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-3 rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 py-3">
              <MapPin className="h-4 w-4 text-slate-500" />
              <select
                value={selectedNeighborhood}
                onChange={(event) => setSelectedNeighborhood(event.target.value)}
                className="w-full bg-transparent text-sm outline-none"
              >
                <option value="all">All neighborhoods</option>
                {availableNeighborhoods.map((neighborhood) => (
                  <option key={neighborhood} value={neighborhood}>
                    {neighborhood}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center justify-center gap-2 rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              <X className="h-4 w-4" />
              Reset
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setOnlyVerified((previous) => !previous)}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                onlyVerified
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
              )}
            >
              Verified only
            </button>
            <button
              type="button"
              onClick={() => setOnlyBanned((previous) => !previous)}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                onlyBanned
                  ? 'border-rose-300 bg-rose-50 text-rose-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
              )}
            >
              Banned only
            </button>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock3 className="h-4 w-4 text-emerald-600" />
              Showing {matchingCount} user{matchingCount === 1 ? '' : 's'}
            </div>
          </div>

          {error ? (
            <div className="mt-5 rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          ) : null}

          {isLoading ? (
            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-44 animate-pulse rounded-[26px] border border-slate-200 bg-slate-100/80" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="mt-5 rounded-[26px] border border-dashed border-slate-300 bg-slate-50/80 p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">No users match this filter</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                Try a different neighborhood, broaden the search, or clear the verification and ban toggles.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              {users.map((user, index) => {
                const name = user.full_name || user.username || user.email;
                const location = [user.neighborhood, user.city].filter(Boolean).join(', ') || 'Location not provided';
                const isVerified = user.verification_status === 'verified';
                const isBanned = Boolean(user.is_banned);

                return (
                  <motion.article
                    key={String(user.id)}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ ...sectionTransition, delay: index * 0.03 }}
                    whileHover={{ y: -4 }}
                    className={cn(
                      'relative overflow-hidden rounded-[28px] border p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)] transition-shadow hover:shadow-[0_24px_60px_rgba(15,23,42,0.08)]',
                      isBanned
                        ? 'border-rose-200 bg-rose-50/80'
                        : 'border-slate-200/80 bg-white/90',
                    )}
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_35%)]" />
                    <div className="relative z-10 flex flex-col gap-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                          {user.profile_picture_url ? (
                            <img
                              src={user.profile_picture_url}
                              alt={name}
                              className="h-14 w-14 rounded-2xl border border-white/80 object-cover shadow-sm"
                            />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/80 bg-emerald-100 text-base font-semibold text-emerald-700 shadow-sm">
                              {getInitials(user)}
                            </div>
                          )}

                          <div className="min-w-0">
                            <h3 className="truncate text-lg font-semibold tracking-tight text-slate-950">{name}</h3>
                            <p className="mt-1 text-sm text-slate-600">@{user.username}</p>
                          </div>
                        </div>

                        <div className="flex flex-col items-start gap-3 lg:items-end">
                          <div className="flex flex-wrap items-center gap-2 justify-start lg:justify-end">
                            <span className={cn(
                              'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]',
                              isVerified
                                ? 'border-emerald-500/20 bg-emerald-50 text-emerald-700'
                                : 'border-amber-500/20 bg-amber-50 text-amber-700',
                            )}>
                              <BadgeCheck className="h-3.5 w-3.5" />
                              {isVerified ? 'Verified' : 'Pending'}
                            </span>
                            {isBanned ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-700">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Banned
                              </span>
                            ) : null}
                          </div>

                          <motion.button
                            type="button"
                            whileHover={{ y: -1, scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => (isBanned ? openUnbanModal(user) : openBanModal(user))}
                            className={cn(
                              'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-sm transition-colors',
                              isBanned
                                ? 'border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                : 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
                            )}
                          >
                            <ShieldCheck className="h-4 w-4" />
                            {isBanned ? 'Unban user' : 'Ban user'}
                          </motion.button>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            <Mail className="h-4 w-4 text-emerald-600" />
                            Email
                          </div>
                          <p className="mt-2 break-all text-sm font-medium text-slate-800">{user.email}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            <Phone className="h-4 w-4 text-emerald-600" />
                            Phone
                          </div>
                          <p className="mt-2 text-sm font-medium text-slate-800">{user.phone || 'Not provided'}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            <MapPin className="h-4 w-4 text-emerald-600" />
                            Location
                          </div>
                          <p className="mt-2 text-sm font-medium text-slate-800">{location}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            <CalendarDays className="h-4 w-4 text-emerald-600" />
                            Joined
                          </div>
                          <p className="mt-2 text-sm font-medium text-slate-800">{formatDate(user.created_at)}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-700">
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Posts {user.posts_count ?? 0}</span>
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Listings {user.listings_count ?? 0}</span>
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Services {user.services_count ?? 0}</span>
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Rent {user.rent_listings_count ?? 0}</span>
                      </div>

                      {user.full_address ? (
                        <div className="rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Full Address</p>
                          <p className="mt-2 text-sm leading-6 text-slate-700">{user.full_address}</p>
                        </div>
                      ) : null}

                      {isBanned && user.banned_reason ? (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-700">
                          <strong className="block text-xs uppercase tracking-[0.18em]">Ban note</strong>
                          <span className="mt-1 block leading-6">{user.banned_reason}</span>
                        </div>
                      ) : null}
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </section>

        <AnimatePresence>
          {moderationMode && activeActionUser ? (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeActionModal}
            >
              <motion.div
                className="w-full max-w-xl overflow-hidden rounded-[30px] border border-white/70 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.28)]"
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 16 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50/80 px-6 py-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                      {moderationMode === 'ban' ? 'Ban user' : 'Unban user'}
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{activeActionUser.full_name || activeActionUser.username}</h3>
                    <p className="mt-1 text-sm text-slate-600">@{activeActionUser.username}</p>
                  </div>

                  <button
                    type="button"
                    onClick={closeActionModal}
                    className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-100"
                    aria-label="Close moderation modal"
                    disabled={isSubmittingAction}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-4 px-6 py-5">
                  {moderationMode === 'ban' ? (
                    <>
                      <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        This user will be blocked from creating feed posts, marketplace listings, rent listings, services, complaints, and relief requests.
                      </div>

                      <label className="block space-y-2">
                        <span className="text-sm font-medium text-slate-700">Ban reason</span>
                        <textarea
                          value={banReason}
                          onChange={(event) => setBanReason(event.target.value)}
                          rows={4}
                          placeholder="Write the moderation reason that will be shown to the user"
                          className="w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-300 focus:bg-white"
                        />
                      </label>

                      <label className="block space-y-2">
                        <span className="text-sm font-medium text-slate-700">Ban duration in days</span>
                        <input
                          type="number"
                          min={1}
                          max={90}
                          value={banDurationDays}
                          onChange={(event) => setBanDurationDays(event.target.value)}
                          className="w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-300 focus:bg-white"
                        />
                      </label>
                    </>
                  ) : (
                    <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      This will restore the user&apos;s ability to create content immediately and send them an unban notification.
                    </div>
                  )}

                  {actionError ? (
                    <div className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {actionError}
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50/80 px-6 py-4">
                  <button
                    type="button"
                    onClick={closeActionModal}
                    disabled={isSubmittingAction}
                    className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>

                  <motion.button
                    type="button"
                    whileHover={{ y: -1, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={moderationMode === 'ban' ? handleBanSubmit : handleUnbanSubmit}
                    disabled={isSubmittingAction}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                      moderationMode === 'ban'
                        ? 'bg-rose-600 hover:bg-rose-700'
                        : 'bg-emerald-600 hover:bg-emerald-700',
                    )}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {isSubmittingAction
                      ? 'Saving...'
                      : moderationMode === 'ban'
                        ? 'Ban user'
                        : 'Unban user'}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
