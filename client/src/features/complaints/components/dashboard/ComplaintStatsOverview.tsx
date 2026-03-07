import { animate, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { type LucideIcon } from 'lucide-react';

interface StatItem {
  id: string;
  label: string;
  value: number;
  suffix?: string;
  hint: string;
  icon: LucideIcon;
  tone: string;
  ring: string;
}

interface ComplaintStatsOverviewProps {
  stats: StatItem[];
}

const CountUpValue = ({ value, suffix }: { value: number; suffix?: string }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplayValue(Math.round(latest)),
    });

    return () => controls.stop();
  }, [value]);

  return (
    <motion.span className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
      {displayValue}
      {suffix || ''}
    </motion.span>
  );
};

export const ComplaintStatsOverview = ({ stats }: ComplaintStatsOverviewProps) => {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.article
            key={stat.id}
            className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.45)] backdrop-blur"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.05 }}
            whileHover={{ y: -4, scale: 1.02 }}
          >
            <div className={`absolute -right-8 -top-8 h-20 w-20 rounded-full blur-2xl ${stat.ring}`} />
            <div className="relative flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{stat.label}</p>
                <CountUpValue value={stat.value} suffix={stat.suffix} />
              </div>
              <div className={`rounded-xl p-2 ${stat.tone}`}>
                <Icon size={16} />
              </div>
            </div>
            <p className="mt-1 text-xs text-slate-500">{stat.hint}</p>
          </motion.article>
        );
      })}
    </section>
  );
};
