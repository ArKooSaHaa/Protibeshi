import { motion } from 'framer-motion';

interface ProfileStatsProps {
  stats: {
    totalPosts: number;
    marketplaceListings: number;
    servicesOffered: number;
    rentListings: number;
    complaintsSubmitted: number;
    reliefPosts: number;
  };
}

const statCards: Array<{ key: keyof ProfileStatsProps['stats']; label: string; accent: string }> = [
  { key: 'totalPosts', label: 'Posts Created', accent: 'from-emerald-50 to-emerald-100' },
  { key: 'marketplaceListings', label: 'Marketplace Listings', accent: 'from-cyan-50 to-cyan-100' },
  { key: 'servicesOffered', label: 'Services Offered', accent: 'from-sky-50 to-sky-100' },
  { key: 'rentListings', label: 'Rent Listings', accent: 'from-amber-50 to-amber-100' },
  { key: 'complaintsSubmitted', label: 'Complaints Submitted', accent: 'from-rose-50 to-rose-100' },
  { key: 'reliefPosts', label: 'Relief Requests', accent: 'from-violet-50 to-violet-100' },
];

export const ProfileStats = ({ stats }: ProfileStatsProps) => {
  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {statCards.map((card, index) => (
        <motion.article
          key={card.key}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.03 * index, duration: 0.25 }}
          className={`rounded-xl border border-slate-200 bg-linear-to-br ${card.accent} p-3 shadow-sm`}
        >
          <p className="text-xs text-slate-600">{card.label}</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{stats[card.key]}</p>
        </motion.article>
      ))}
    </section>
  );
};
