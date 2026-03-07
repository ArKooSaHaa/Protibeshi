import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

export const CivicHeroBanner = () => {
  return (
    <motion.section
      className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-linear-to-br from-emerald-50 via-sky-50 to-white px-6 py-6 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.55)] md:px-8"
      initial={{ opacity: 0, y: 26, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="pointer-events-none absolute -left-12 -top-16 h-48 w-48 rounded-full bg-emerald-300/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-14 top-0 h-56 w-56 rounded-full bg-sky-300/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-20 w-28 rounded-full bg-cyan-200/25 blur-2xl" />

      <div className="relative">
        <div className="space-y-3">
          <motion.div
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-3 py-1 text-xs font-semibold text-emerald-700 backdrop-blur"
            animate={{
              boxShadow: [
                '0 0 0 rgba(16,185,129,0)',
                '0 0 24px rgba(16,185,129,0.3)',
                '0 0 0 rgba(16,185,129,0)',
              ],
            }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ShieldCheck size={14} /> Civic-grade reporting
          </motion.div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
            Community Complaints
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
            Report neighborhood issues, track civic response, and build transparent accountability with
            your community.
          </p>
        </div>
      </div>
    </motion.section>
  );
};
