import { motion } from 'framer-motion';
import { Compass, MapPinned } from 'lucide-react';
import { type ComplaintItem } from '../../types/complaint.types';

interface NeighborhoodMapPreviewProps {
  complaints: ComplaintItem[];
  onSelectComplaint: (complaint: ComplaintItem) => void;
}

export const NeighborhoodMapPreview = ({ complaints, onSelectComplaint }: NeighborhoodMapPreviewProps) => {
  const visibleMarkers = complaints.slice(0, 6);

  return (
    <motion.section
      className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_16px_30px_-24px_rgba(15,23,42,0.45)]"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.12 }}
    >
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-3">
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
          <MapPinned size={16} className="text-emerald-600" /> Neighborhood Map Preview
        </div>
        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
          <Compass size={12} /> Live marker preview
        </span>
      </div>

      <div className="relative h-48 bg-[radial-gradient(circle_at_14%_24%,rgba(16,185,129,0.18),transparent_34%),radial-gradient(circle_at_78%_40%,rgba(59,130,246,0.18),transparent_30%),linear-gradient(135deg,#f8fafc,#eef2ff)]">
        <div className="absolute inset-0 bg-size-[40px_40px] bg-[linear-gradient(to_right,rgba(148,163,184,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.18)_1px,transparent_1px)] opacity-50" />

        {visibleMarkers.map((complaint, index) => {
          const left = 14 + ((index * 17) % 72);
          const top = 18 + ((index * 23) % 56);

          return (
            <button
              key={complaint.id}
              type="button"
              style={{ left: `${left}%`, top: `${top}%` }}
              onClick={() => onSelectComplaint(complaint)}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              aria-label={`Open ${complaint.id}`}
            >
              <span className="relative flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-emerald-200/70">
                <span className="absolute inline-flex h-5 w-5 animate-ping rounded-full bg-emerald-400/40" />
              </span>
            </button>
          );
        })}
      </div>
    </motion.section>
  );
};
