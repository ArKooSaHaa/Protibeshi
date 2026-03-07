import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BadgeCheck,
  BellRing,
  Building2,
  CalendarDays,
  Check,
  CircleAlert,
  Eye,
  HandHeart,
  House,
  LoaderCircle,
  Lock,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  UserRound,
  Wrench,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EditProfileModal } from '../components/EditProfileModal';
import { useUserPosts, type AccountPostTab, type PostStatus, type UserPost } from '../hooks/useUserPosts';

const sectionTransition = {
  duration: 0.55,
  ease: [0.22, 1, 0.36, 1] as const,
};

const tabMeta: Record<
  AccountPostTab,
  {
    icon: typeof UserRound;
    accent: string;
    chip: string;
  }
> = {
  feed: {
    icon: Sparkles,
    accent: 'from-emerald-400/25 via-teal-300/10 to-white',
    chip: 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20',
  },
  marketplace: {
    icon: ShoppingBag,
    accent: 'from-sky-400/20 via-cyan-300/10 to-white',
    chip: 'text-sky-700 bg-sky-500/10 border-sky-500/20',
  },
  rent: {
    icon: House,
    accent: 'from-violet-400/20 via-fuchsia-300/10 to-white',
    chip: 'text-violet-700 bg-violet-500/10 border-violet-500/20',
  },
  services: {
    icon: Wrench,
    accent: 'from-amber-400/25 via-orange-300/10 to-white',
    chip: 'text-amber-700 bg-amber-500/10 border-amber-500/20',
  },
  complaints: {
    icon: CircleAlert,
    accent: 'from-rose-400/25 via-red-300/10 to-white',
    chip: 'text-rose-700 bg-rose-500/10 border-rose-500/20',
  },
  relief: {
    icon: HandHeart,
    accent: 'from-lime-400/25 via-emerald-300/10 to-white',
    chip: 'text-lime-700 bg-lime-500/10 border-lime-500/20',
  },
};

const statusStyles: Record<PostStatus, string> = {
  active: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700',
  expired: 'border-slate-300 bg-slate-100 text-slate-600',
  pending: 'border-amber-500/30 bg-amber-500/10 text-amber-700',
  open: 'border-sky-500/30 bg-sky-500/10 text-sky-700',
};

const settingsActions: Array<{
  key: 'password' | 'notifications' | 'privacy' | 'delete';
  label: string;
  description: string;
  icon: typeof UserRound;
  danger?: boolean;
}> = [
  {
    key: 'password',
    label: 'Change Password',
    description: 'Rotate credentials and enforce stronger device security for your neighborhood account.',
    icon: Lock,
  },
  {
    key: 'notifications',
    label: 'Notification Preferences',
    description: 'Tune push alerts for safety notices, marketplace activity, and direct neighborhood responses.',
    icon: BellRing,
  },
  {
    key: 'privacy',
    label: 'Privacy Settings',
    description: 'Control profile visibility, contact access, and post exposure across community surfaces.',
    icon: ShieldCheck,
  },
  {
    key: 'delete',
    label: 'Delete Account',
    description: 'This is a destructive action and should only be used when you want to remove your presence permanently.',
    icon: Trash2,
    danger: true,
  },
] as const;

type SettingActionKey = (typeof settingsActions)[number]['key'];

type PostEditorState = {
  title: string;
  description: string;
  location: string;
  status: PostStatus;
};

export const AccountPage = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeSetting, setActiveSetting] = useState<SettingActionKey>('privacy');
  const [previewPost, setPreviewPost] = useState<UserPost | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserPost | null>(null);
  const [editingPost, setEditingPost] = useState<UserPost | null>(null);
  const [isUpdatingPost, setIsUpdatingPost] = useState(false);
  const {
    profile,
    activeTab,
    tabs,
    posts,
    totalCount,
    hasMore,
    isLoading,
    isSavingProfile,
    stats,
    setActiveTab,
    loadMore,
    updateProfile,
    updatePost,
    deletePost,
  } = useUserPosts();

  const statsCards = useMemo(
    () => [
      {
        label: 'Posts Created',
        value: stats.totalPosts,
        note: 'Neighborhood updates and alerts',
        icon: Sparkles,
        gradient: 'from-emerald-500/20 via-emerald-400/10 to-white',
      },
      {
        label: 'Marketplace Listings',
        value: stats.marketplaceListings,
        note: 'Buyer-ready posts in circulation',
        icon: ShoppingBag,
        gradient: 'from-sky-500/20 via-cyan-400/10 to-white',
      },
      {
        label: 'Services Offered',
        value: stats.servicesOffered,
        note: 'Trusted skills shared locally',
        icon: Wrench,
        gradient: 'from-amber-500/20 via-orange-400/10 to-white',
      },
      {
        label: 'Rent Listings',
        value: stats.rentListings,
        note: 'Spaces currently managed',
        icon: House,
        gradient: 'from-violet-500/20 via-fuchsia-400/10 to-white',
      },
      {
        label: 'Complaints Submitted',
        value: stats.complaintsSubmitted,
        note: 'Reported issues awaiting resolution',
        icon: CircleAlert,
        gradient: 'from-rose-500/20 via-red-400/10 to-white',
      },
      {
        label: 'Relief Requests',
        value: stats.reliefPosts,
        note: 'Support activity across the area',
        icon: HandHeart,
        gradient: 'from-lime-500/20 via-emerald-400/10 to-white',
      },
    ],
    [stats],
  );

  const profileItems = useMemo(
    () => [
      { label: 'Full Name', value: profile.fullName, icon: UserRound },
      { label: 'Username', value: `@${profile.username}`, icon: BadgeCheck },
      { label: 'Email', value: profile.email, icon: Mail },
      { label: 'Phone Number', value: profile.phone, icon: Phone },
      { label: 'City', value: profile.city, icon: Building2 },
      { label: 'Neighborhood', value: profile.neighborhood, icon: MapPin },
    ],
    [profile],
  );

  const activeSettingDetails = settingsActions.find((action) => action.key === activeSetting) ?? settingsActions[0];

  const handleDeletePost = async () => {
    if (!deleteTarget) {
      return;
    }

    await deletePost(deleteTarget.tab, deleteTarget.id);
    setDeleteTarget(null);
    if (previewPost?.id === deleteTarget.id) {
      setPreviewPost(null);
    }
  };

  const handleUpdatePost = async (payload: PostEditorState) => {
    if (!editingPost) {
      return;
    }

    setIsUpdatingPost(true);
    await updatePost(editingPost.tab, editingPost.id, payload);
    setIsUpdatingPost(false);
    setEditingPost(null);
  };

  return (
    <div className="relative isolate overflow-hidden px-3 pb-10 pt-2 md:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_38%),radial-gradient(circle_at_top_right,rgba(45,212,191,0.14),transparent_36%),linear-gradient(180deg,rgba(240,253,250,0.95),rgba(255,255,255,0))]" />
      <div className="pointer-events-none absolute -left-10 top-24 -z-10 h-36 w-36 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-14 -z-10 h-44 w-44 rounded-full bg-teal-300/20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={sectionTransition}
        className="mx-auto max-w-7xl space-y-6"
      >
        <section className="relative overflow-hidden rounded-4xl border border-white/60 bg-[linear-gradient(135deg,rgba(224,242,241,0.95),rgba(240,253,244,0.92),rgba(255,255,255,0.98))] p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(16,185,129,0.22),transparent_30%),radial-gradient(circle_at_85%_15%,rgba(94,234,212,0.2),transparent_24%)]" />
          <motion.div
            className="pointer-events-none absolute -right-6 top-5 h-24 w-24 rounded-full border border-white/40 bg-white/20"
            animate={{ y: [0, -8, 0], rotate: [0, 6, 0] }}
            transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
          />
          <motion.div
            className="pointer-events-none absolute bottom-3 left-[42%] h-16 w-16 rounded-[28px] border border-white/40 bg-emerald-200/20"
            animate={{ y: [0, 10, 0], x: [0, 5, 0] }}
            transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
          />

          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-5 md:flex-row md:items-start">
              <motion.div whileHover={{ scale: 1.04, y: -2 }} className="relative shrink-0">
                <div className="absolute inset-0 rounded-full bg-emerald-400/30 blur-2xl" />
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  className="relative h-28 w-28 rounded-full border-4 border-white/80 object-cover shadow-[0_18px_45px_rgba(16,185,129,0.28)] md:h-32 md:w-32"
                />
              </motion.div>

              <div className="max-w-3xl space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">{profile.fullName}</h1>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Verified
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-slate-950/5 px-3 py-1 text-xs font-medium text-slate-700">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    Secure account
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span className="font-medium text-slate-700">@{profile.username}</span>
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                    {profile.neighborhood}, {profile.city}
                  </span>
                </div>

                <p className="max-w-2xl text-sm leading-7 text-slate-700 md:text-base">{profile.bio}</p>

                <div className="grid gap-3 sm:grid-cols-3">
                  <HeroMetric label="Reputation" value="94%" sublabel="Trusted by neighbors" />
                  <HeroMetric label="Response time" value="12m" sublabel="Fast on urgent posts" />
                  <HeroMetric label="Activity streak" value="18d" sublabel="Consistent local updates" />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end">
              <ActionButton
                icon={Pencil}
                label="Edit Profile"
                onClick={() => setIsEditModalOpen(true)}
                variant="primary"
              />
              <ActionButton
                icon={Settings2}
                label="Settings"
                onClick={() => document.getElementById('account-settings')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              />
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {statsCards.map((card, index) => (
            <motion.article
              key={card.label}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ ...sectionTransition, delay: index * 0.04 }}
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
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 + index * 0.05 }}
                    className="mt-3 text-4xl font-semibold tracking-tight text-slate-950"
                  >
                    {card.value}
                  </motion.p>
                  <p className="mt-2 text-sm text-slate-600">{card.note}</p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/75 p-3 shadow-sm transition-transform duration-300 group-hover:scale-105">
                  <card.icon className="h-6 w-6 text-emerald-700" />
                </div>
              </div>
            </motion.article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={sectionTransition}
            className="rounded-[30px] border border-slate-200/70 bg-white/80 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-xl"
          >
            <SectionEyebrow title="Profile Information" subtitle="Public identity, contact details, and local presence visible across Protibeshi." />

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {profileItems.map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    <item.icon className="h-4 w-4 text-emerald-600" />
                    {item.label}
                  </div>
                  <p className="mt-3 text-base font-medium text-slate-900">{item.value}</p>
                </div>
              ))}
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 md:col-span-2">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Short Bio</div>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700">{profile.bio}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            id="account-settings"
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ ...sectionTransition, delay: 0.05 }}
            className="space-y-6"
          >
            <div className="rounded-[30px] border border-slate-200/70 bg-white/80 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-xl">
              <SectionEyebrow title="Account Details" subtitle="Security and verification signals that increase trust around your local activity." />

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <InfoTile label="Account Created" value={new Date(profile.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} icon={CalendarDays} />
                <InfoTile label="Verification Status" value={profile.verificationStatus === 'verified' ? 'Verified' : 'Unverified'} icon={BadgeCheck} />
                <InfoTile label="Email Verified" value="Confirmed" icon={Mail} />
                <InfoTile label="Phone Verified" value="Confirmed" icon={Phone} />
              </div>
            </div>

            <div className="rounded-[30px] border border-slate-200/70 bg-white/80 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-xl">
              <SectionEyebrow title="Account Settings" subtitle="Quick controls for security, notifications, privacy, and destructive account operations." />

              <div className="mt-6 grid gap-3">
                {settingsActions.map((action) => (
                  <button
                    key={action.key}
                    type="button"
                    onClick={() => setActiveSetting(action.key)}
                    className={cn(
                      'flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all duration-300',
                      activeSetting === action.key
                        ? action.danger
                          ? 'border-rose-300 bg-rose-50 text-rose-700 shadow-sm'
                          : 'border-emerald-300 bg-emerald-50 text-emerald-800 shadow-sm'
                        : 'border-slate-200 bg-white/70 text-slate-700 hover:border-slate-300 hover:bg-slate-50',
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <span className={cn('rounded-xl p-2', action.danger ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-700')}>
                        <action.icon className="h-4 w-4" />
                      </span>
                      <span className="font-medium">{action.label}</span>
                    </span>
                    <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Open</span>
                  </button>
                ))}
              </div>

              <motion.div
                key={activeSettingDetails.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
                className={cn(
                  'mt-5 rounded-2xl border p-4',
                  activeSettingDetails.danger ? 'border-rose-200 bg-rose-50/80' : 'border-emerald-200 bg-emerald-50/70',
                )}
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <activeSettingDetails.icon className={cn('h-4 w-4', activeSettingDetails.danger ? 'text-rose-600' : 'text-emerald-700')} />
                  {activeSettingDetails.label}
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">{activeSettingDetails.description}</p>
              </motion.div>
            </div>
          </motion.div>
        </section>

        <section className="rounded-4xl border border-slate-200/70 bg-white/80 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-xl md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <SectionEyebrow
              title="User Content Dashboard"
              subtitle="Manage feed posts, marketplace listings, local services, rent offers, complaints, and relief updates from one place."
            />
            <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
              {totalCount} items in {tabs.find((tab) => tab.key === activeTab)?.label}
            </div>
          </div>

          <div className="mt-6 overflow-x-auto pb-2">
            <div className="inline-flex min-w-full gap-2 rounded-full border border-slate-200 bg-slate-100/70 p-2">
              {tabs.map((tab) => {
                const meta = tabMeta[tab.key];
                const Icon = meta.icon;
                const isActive = tab.key === activeTab;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'relative flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors',
                      isActive ? 'text-slate-950' : 'text-slate-600 hover:text-slate-900',
                    )}
                  >
                    {isActive ? (
                      <motion.span
                        layoutId="account-tab-pill"
                        className="absolute inset-0 rounded-full bg-white shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
                        transition={{ type: 'spring', bounce: 0.22, duration: 0.45 }}
                      />
                    ) : null}
                    <span className="relative z-10 flex items-center gap-2">
                      <Icon className="h-4 w-4 text-emerald-700" />
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {isLoading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="h-64 animate-pulse rounded-[28px] border border-slate-200 bg-linear-to-br from-slate-100 via-white to-emerald-50"
                  />
                ))
              : posts.map((post, index) => {
                  const meta = tabMeta[post.tab];
                  const Icon = meta.icon;

                  return (
                    <motion.article
                      key={post.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.32, delay: index * 0.03 }}
                      whileHover={{ y: -6 }}
                      className={cn(
                        'group relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-linear-to-br p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)] transition-shadow hover:shadow-[0_24px_60px_rgba(15,23,42,0.08)]',
                        meta.accent,
                      )}
                    >
                      <div className="absolute inset-x-0 top-0 h-28 bg-white/35" />
                      <div className="relative z-10 flex h-full flex-col gap-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize', statusStyles[post.status])}>
                                <Check className="h-3.5 w-3.5" />
                                {post.status}
                              </span>
                              <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium', meta.chip)}>
                                <Icon className="h-3.5 w-3.5" />
                                {tabs.find((tab) => tab.key === post.tab)?.label ?? post.tab}
                              </span>
                            </div>
                            <div>
                              <h3 className="text-xl font-semibold tracking-tight text-slate-950">{post.title}</h3>
                              <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-700">{post.description}</p>
                            </div>
                          </div>
                          <div className="rounded-2xl border border-white/80 bg-white/70 p-3 shadow-sm">
                            <Icon className="h-5 w-5 text-emerald-700" />
                          </div>
                        </div>

                        <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                          <div className="rounded-2xl bg-white/70 px-3 py-2">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Posted time</div>
                            <div className="mt-1 font-medium text-slate-800">{post.datePosted}</div>
                          </div>
                          <div className="rounded-2xl bg-white/70 px-3 py-2">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Location</div>
                            <div className="mt-1 font-medium text-slate-800">{post.location}</div>
                          </div>
                        </div>

                        <div className="mt-auto flex flex-wrap gap-2">
                          <MiniActionButton icon={Eye} label="View" onClick={() => setPreviewPost(post)} />
                          <MiniActionButton icon={Pencil} label="Edit" onClick={() => setEditingPost(post)} />
                          <MiniActionButton icon={Trash2} label="Delete" destructive onClick={() => setDeleteTarget(post)} />
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
          </div>

          {!isLoading && posts.length === 0 ? (
            <div className="mt-6 rounded-[28px] border border-dashed border-slate-300 bg-slate-50/80 p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">Nothing published here yet</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                This tab is ready for future activity, analytics, reputation scoring, and neighborhood storytelling.
              </p>
            </div>
          ) : null}

          {hasMore ? (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-800 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50"
              >
                Load more posts
              </button>
            </div>
          ) : null}
        </section>

        <EditProfileModal
          open={isEditModalOpen}
          profile={profile}
          isSaving={isSavingProfile}
          onOpenChange={setIsEditModalOpen}
          onSave={updateProfile}
        />

        <AnimatePresence>
          {previewPost ? <PostPreviewModal post={previewPost} onClose={() => setPreviewPost(null)} /> : null}
        </AnimatePresence>

        <AnimatePresence>
          {editingPost ? (
            <PostEditorModal
              post={editingPost}
              isSaving={isUpdatingPost}
              onClose={() => setEditingPost(null)}
              onSave={handleUpdatePost}
            />
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {deleteTarget ? (
            <ConfirmDeleteModal
              post={deleteTarget}
              onClose={() => setDeleteTarget(null)}
              onConfirm={handleDeletePost}
            />
          ) : null}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

const HeroMetric = ({ label, value, sublabel }: { label: string; value: string; sublabel: string }) => (
  <div className="rounded-2xl border border-white/60 bg-white/55 px-4 py-3 backdrop-blur">
    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
    <p className="mt-1 text-sm text-slate-600">{sublabel}</p>
  </div>
);

const ActionButton = ({
  icon: Icon,
  label,
  onClick,
  variant = 'secondary',
}: {
  icon: typeof UserRound;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}) => (
  <motion.button
    type="button"
    whileHover={{ y: -2, scale: 1.01 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={cn(
      'inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium shadow-sm transition-colors',
      variant === 'primary'
        ? 'bg-slate-950 text-white hover:bg-slate-800'
        : 'border border-white/70 bg-white/75 text-slate-800 hover:bg-white',
    )}
  >
    <Icon className="h-4 w-4" />
    {label}
  </motion.button>
);

const SectionEyebrow = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Protibeshi account</p>
    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{subtitle}</p>
  </div>
);

const InfoTile = ({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof UserRound;
}) => (
  <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4">
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
      <Icon className="h-4 w-4 text-emerald-700" />
      {label}
    </div>
    <div className="mt-3 text-base font-medium text-slate-900">{value}</div>
  </div>
);

const MiniActionButton = ({
  icon: Icon,
  label,
  onClick,
  destructive = false,
}: {
  icon: typeof UserRound;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) => (
  <motion.button
    type="button"
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className={cn(
      'inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors',
      destructive
        ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
        : 'border-white/70 bg-white/80 text-slate-700 hover:bg-white',
    )}
  >
    <Icon className="h-4 w-4" />
    {label}
  </motion.button>
);

const ModalShell = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
  <motion.div
    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={onClose}
  >
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.98 }}
      transition={{ duration: 0.22 }}
      onClick={(event) => event.stopPropagation()}
      className="w-full max-w-2xl rounded-[28px] border border-white/70 bg-white/95 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.25)]"
    >
      {children}
    </motion.div>
  </motion.div>
);

const PostPreviewModal = ({ post, onClose }: { post: UserPost; onClose: () => void }) => {
  const meta = tabMeta[post.tab];
  const Icon = meta.icon;

  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Post Preview</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{post.title}</h3>
        </div>
        <button type="button" onClick={onClose} className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className={cn('mt-5 rounded-3xl border border-slate-200 bg-linear-to-br p-5', meta.accent)}>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Icon className="h-4 w-4 text-emerald-700" />
          {post.datePosted}
          <span className="h-1 w-1 rounded-full bg-slate-300" />
          {post.location}
        </div>
        <p className="mt-4 text-sm leading-7 text-slate-700">{post.description}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className={cn('rounded-full border px-3 py-1 text-xs font-semibold capitalize', statusStyles[post.status])}>{post.status}</span>
          {post.category ? <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-700">{post.category}</span> : null}
          {post.price ? <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-700">{post.price}</span> : null}
          {post.priceRange ? <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-700">{post.priceRange}</span> : null}
          {post.bedrooms ? <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-700">{post.bedrooms} bedrooms</span> : null}
        </div>
      </div>
    </ModalShell>
  );
};

const PostEditorModal = ({
  post,
  isSaving,
  onClose,
  onSave,
}: {
  post: UserPost;
  isSaving: boolean;
  onClose: () => void;
  onSave: (payload: PostEditorState) => Promise<void>;
}) => {
  const [form, setForm] = useState<PostEditorState>({
    title: post.title,
    description: post.description,
    location: post.location,
    status: post.status,
  });

  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Edit Post</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Refine your content</h3>
        </div>
        <button type="button" onClick={onClose} className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-6 grid gap-4">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Title
          <input
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0 transition focus:border-emerald-400"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Description
          <textarea
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            rows={5}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0 transition focus:border-emerald-400"
          />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Location
            <input
              value={form.location}
              onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0 transition focus:border-emerald-400"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Status
            <select
              value={form.status}
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as PostStatus }))}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0 transition focus:border-emerald-400"
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="expired">Closed</option>
              <option value="open">Open</option>
            </select>
          </label>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button type="button" onClick={onClose} className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void onSave(form)}
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-70"
        >
          {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </ModalShell>
  );
};

const ConfirmDeleteModal = ({
  post,
  onClose,
  onConfirm,
}: {
  post: UserPost;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) => (
  <ModalShell onClose={onClose}>
    <div className="mx-auto flex max-w-lg flex-col items-center text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600">
        <Trash2 className="h-6 w-6" />
      </div>
      <h3 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">Delete this post?</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        You are about to remove <span className="font-semibold text-slate-800">{post.title}</span>. This action cannot be undone.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={onClose} className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Cancel
        </button>
        <button type="button" onClick={() => void onConfirm()} className="rounded-full bg-rose-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-rose-700">
          Delete
        </button>
      </div>
    </div>
  </ModalShell>
);
