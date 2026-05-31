import { animate, motion } from 'framer-motion';
import { BarChart3, Clock3, ShieldAlert, Trash2, type LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { AdminFeedStats } from '../types/adminFeed.types';

interface AdminStatsCardsProps {
  stats: AdminFeedStats;
}

interface StatMeta {
  key: keyof AdminFeedStats;
  label: string;
  hint: string;
  icon: LucideIcon;
  iconClass: string;
}

const statCards: StatMeta[] = [
  {
    key: 'totalPosts',
    label: 'Total Posts',
    hint: 'Visible in moderation queue',
    icon: BarChart3,
    iconClass: 'afd-stat-icon-total',
  },
  {
    key: 'pendingPosts',
    label: 'Pending Posts',
    hint: 'Awaiting review decision',
    icon: Clock3,
    iconClass: 'afd-stat-icon-pending',
  },
  {
    key: 'reportedPosts',
    label: 'Reported Posts',
    hint: 'Flagged by residents',
    icon: ShieldAlert,
    iconClass: 'afd-stat-icon-reported',
  },
  {
    key: 'deletedPosts',
    label: 'Deleted Posts',
    hint: 'Archived by admins',
    icon: Trash2,
    iconClass: 'afd-stat-icon-deleted',
  },
];

const AnimatedCount = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplayValue(Math.round(latest)),
    });

    return () => controls.stop();
  }, [value]);

  return <span className="afd-stat-value">{displayValue}</span>;
};

export const AdminStatsCards = ({ stats }: AdminStatsCardsProps) => {
  return (
    <section className="afd-stats-grid" aria-label="Moderation statistics">
      {statCards.map((card, index) => {
        const Icon = card.icon;

        return (
          <motion.article
            key={card.key}
            className="afd-stat-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.06 }}
            whileHover={{ y: -4 }}
          >
            <div className="afd-stat-header">
              <div className={`afd-stat-icon ${card.iconClass}`}>
                <Icon size={16} />
              </div>
              <p className="afd-stat-label">{card.label}</p>
            </div>
            <AnimatedCount value={stats[card.key]} />
            <p className="afd-stat-hint">{card.hint}</p>
          </motion.article>
        );
      })}
    </section>
  );
};
