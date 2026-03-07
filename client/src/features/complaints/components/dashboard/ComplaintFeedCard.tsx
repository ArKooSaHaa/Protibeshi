import { motion } from 'framer-motion';
import { ArrowRight, CalendarDays, MapPin, ShieldCheck, Timer } from 'lucide-react';
import { type ComplaintItem } from '../../types/complaint.types';

interface ComplaintFeedCardProps {
  complaint: ComplaintItem;
  onViewDetails: (complaint: ComplaintItem) => void;
}

const statusTone: Record<ComplaintItem['status'], string> = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  'Under Review': 'bg-blue-50 text-blue-700 border-blue-200',
  'In Progress': 'bg-orange-50 text-orange-700 border-orange-200',
  Resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejected: 'bg-rose-50 text-rose-700 border-rose-200',
};

const priorityTone: Record<ComplaintItem['priority'], string> = {
  Low: 'bg-slate-100 text-slate-700 border-slate-200',
  Medium: 'bg-sky-50 text-sky-700 border-sky-200',
  High: 'bg-amber-50 text-amber-700 border-amber-200',
  Urgent: 'bg-rose-50 text-rose-700 border-rose-200',
};

const reporterTag = (complaint: ComplaintItem) => {
  if (complaint.reportedBy === 'Anonymous') {
    return 'Anonymous reporter';
  }

  if (complaint.verified) {
    return 'Verified resident';
  }

  return 'Resident report';
};

export const ComplaintFeedCard = ({ complaint, onViewDetails }: ComplaintFeedCardProps) => {
  return (
    <motion.article
      className="group relative rounded-2xl bg-linear-to-br from-white to-slate-50/60 p-px shadow-[0_22px_35px_-26px_rgba(15,23,42,0.52)]"
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
    >
      <div className="relative rounded-2xl border border-slate-200/80 bg-white p-4">
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-r from-emerald-100/0 via-sky-100/0 to-indigo-100/0 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

        <div className="relative flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-500">
            <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-700">{complaint.id}</span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">{complaint.category}</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusTone[complaint.status]}`}
            >
              {complaint.status}
            </span>
            <motion.span
              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${priorityTone[complaint.priority]}`}
              animate={
                complaint.priority === 'Urgent'
                  ? { scale: [1, 1.04, 1], opacity: [1, 0.88, 1] }
                  : undefined
              }
              transition={{ duration: 1.8, repeat: Infinity }}
            >
              {complaint.priority}
            </motion.span>
          </div>
        </div>

        <div className="relative mt-3 space-y-2">
          <h3 className="text-lg font-semibold tracking-tight text-slate-900">{complaint.title}</h3>
          <p className="line-clamp-3 text-sm leading-6 text-slate-600">{complaint.description}</p>
        </div>

        <div className="relative mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
          <div className="inline-flex items-center gap-1.5">
            <MapPin size={13} className="text-emerald-600" /> {complaint.location}
          </div>
          <div className="inline-flex items-center gap-1.5">
            <Timer size={13} className="text-blue-600" /> {complaint.distance}m away
          </div>
          <div className="inline-flex items-center gap-1.5">
            <CalendarDays size={13} className="text-indigo-600" />
            {new Date(complaint.createdAt).toLocaleDateString()}
          </div>
          <div className="inline-flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-emerald-600" /> {reporterTag(complaint)}
          </div>
        </div>

        <div className="relative mt-3 flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-600">
          {complaint.verified && (
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">Verified resident</span>
          )}
          <span className="rounded-full bg-indigo-50 px-2 py-1 text-indigo-700">Civic authority tag</span>
          {complaint.reportedBy === 'Anonymous' && (
            <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">Anonymous reporter</span>
          )}
        </div>

        <div className="relative mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onViewDetails(complaint)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            View Details
          </button>
          <button
            type="button"
            onClick={() => onViewDetails(complaint)}
            className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
          >
            Track Progress <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </motion.article>
  );
};
