import { motion } from 'framer-motion';
import {
  Eye,
  Flag,
  MapPin,
  Trash2,
  UserRound,
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import type { AdminMarketplaceListing, AdminReportSeverity } from '../types/adminMarketplace.types';

interface AdminListingCardProps {
  listing: AdminMarketplaceListing;
  isSelected: boolean;
  isAdmin: boolean;
  onToggleSelect: (listingId: string) => void;
  onViewDetails: (listingId: string) => void;
  onDelete: (listingId: string) => void;
  onOpenReports: (listingId: string) => void;
}

const resolveHighestSeverity = (listing: AdminMarketplaceListing): AdminReportSeverity | null => {
  if (listing.reports.length === 0) {
    return null;
  }

  if (listing.reports.some((report) => report.severity === 'high')) {
    return 'high';
  }

  if (listing.reports.some((report) => report.severity === 'medium')) {
    return 'medium';
  }

  return 'low';
};

const severityClass = {
  low: 'amp-severity-low',
  medium: 'amp-severity-medium',
  high: 'amp-severity-high',
} as const;

const formatPrice = (price: number): string => {
  return `BDT ${price.toLocaleString()}`;
};

export const AdminListingCard = ({
  listing,
  isSelected,
  isAdmin,
  onToggleSelect,
  onViewDetails,
  onDelete,
  onOpenReports,
}: AdminListingCardProps) => {
  const severity = resolveHighestSeverity(listing);

  return (
    <motion.article
      className={`amp-card ${listing.status === 'reported' ? 'amp-card-reported' : ''}`}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <div className="amp-card-image-wrap">
        <img src={listing.image} alt={listing.title} className="amp-card-image" />

        {isAdmin ? (
          <div className="amp-card-quick-actions">
            <button type="button" onClick={() => onDelete(listing.id)}>
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        ) : null}
      </div>

      <div className="amp-card-body">
        <header className="amp-card-top">
          {isAdmin ? (
            <label className="amp-select-check">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect(listing.id)}
                aria-label={`Select listing ${listing.id}`}
              />
              <span>Select</span>
            </label>
          ) : null}

          <StatusBadge status={listing.status} />
        </header>

        <h3 className="amp-card-title">{listing.title}</h3>
        <p className="amp-card-price">{formatPrice(listing.price)}</p>

        <div className="amp-card-meta">
          <span>
            <MapPin size={13} />
            {listing.location}
          </span>
          <span>{listing.category}</span>
        </div>

        <div className="amp-card-meta">
          <span>
            <UserRound size={13} />
            {listing.seller.name}
          </span>
          {listing.reportCount > 0 ? (
            <span className="amp-report-count">
              <Flag size={12} />
              {listing.reportCount}
            </span>
          ) : null}
        </div>

        {severity ? (
          <div className="amp-card-severity">
            <span className={`amp-severity-chip ${severityClass[severity]}`}>Severity: {severity}</span>
          </div>
        ) : null}

        {listing.aiTag ? <p className="amp-ai-flag">Potential spam</p> : null}

        <footer className="amp-card-actions">
          <button type="button" className="amp-action-btn" onClick={() => onViewDetails(listing.id)}>
            <Eye size={14} />
            View Details
          </button>

          {isAdmin ? (
            <button type="button" className="amp-action-btn amp-action-danger" onClick={() => onDelete(listing.id)}>
              <Trash2 size={14} />
              Delete
            </button>
          ) : null}

          {isAdmin ? (
            <button
              type="button"
              className="amp-action-btn amp-action-warning"
              onClick={() => onOpenReports(listing.id)}
            >
              <Flag size={14} />
              Reports
            </button>
          ) : null}
        </footer>
      </div>
    </motion.article>
  );
};
