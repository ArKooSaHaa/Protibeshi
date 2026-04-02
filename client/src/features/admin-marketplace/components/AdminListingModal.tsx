import { AnimatePresence, motion } from 'framer-motion';
import {
  Ban,
  CalendarClock,
  Flag,
  MapPin,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { ReportListItem } from './ReportListItem';
import { StatusBadge } from './StatusBadge';
import type { AdminMarketplaceListing } from '../types/adminMarketplace.types';

interface AdminListingModalProps {
  listing: AdminMarketplaceListing | null;
  isOpen: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onDelete: (listingId: string) => void;
  onBanUser: (sellerId: string) => void;
}

const formatDateTime = (isoDate: string): string => {
  return new Date(isoDate).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatJoinDate = (isoDate: string): string => {
  return new Date(isoDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatPrice = (price: number): string => {
  return `BDT ${price.toLocaleString()}`;
};

export const AdminListingModal = ({
  listing,
  isOpen,
  isAdmin,
  onClose,
  onDelete,
  onBanUser,
}: AdminListingModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && listing ? (
        <motion.div
          className="amp-drawer-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.aside
            className="amp-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Listing details"
          >
            <header className="amp-drawer-header">
              <div>
                <p className="amp-kicker">Listing Details</p>
                <h2>{listing.title}</h2>
                <p className="amp-drawer-meta">
                  <StatusBadge status={listing.status} />
                  <span>{formatPrice(listing.price)}</span>
                </p>
              </div>

              <button type="button" className="amp-icon-btn" onClick={onClose}>
                <X size={18} />
              </button>
            </header>

            <div className="amp-drawer-content">
              <img src={listing.image} alt={listing.title} className="amp-drawer-image" />

              <section className="amp-drawer-section">
                <h3>Basic Info</h3>
                <div className="amp-detail-grid">
                  <div>
                    <span>Title</span>
                    <p>{listing.title}</p>
                  </div>
                  <div>
                    <span>Price</span>
                    <p>{formatPrice(listing.price)}</p>
                  </div>
                  <div>
                    <span>Category</span>
                    <p>{listing.category}</p>
                  </div>
                  <div>
                    <span>Description</span>
                    <p>{listing.description || 'No description provided.'}</p>
                  </div>
                </div>
              </section>

              <section className="amp-drawer-section">
                <h3>Seller Info</h3>
                <div className="amp-seller-box">
                  <div className="amp-seller-avatar">
                    {listing.seller.profileImage ? (
                      <img src={listing.seller.profileImage} alt={listing.seller.name} />
                    ) : (
                      <UserRound size={18} />
                    )}
                  </div>

                  <div className="amp-seller-meta">
                    <p>{listing.seller.name}</p>
                    <span>@{listing.seller.username}</span>
                    <span>{listing.seller.totalListings} listings</span>
                    <span>Joined {formatJoinDate(listing.seller.joinDate)}</span>
                    <span>{listing.seller.isVerified ? 'Verified seller' : 'Not verified'}</span>
                    {listing.seller.isBanned ? <span className="amp-banned-note">User is currently banned</span> : null}
                  </div>
                </div>
              </section>

              <section className="amp-drawer-section">
                <h3>Listing Metadata</h3>
                <div className="amp-meta-list">
                  <p>
                    <MapPin size={14} />
                    {listing.location}
                  </p>
                  <p>
                    <CalendarClock size={14} />
                    Created {formatDateTime(listing.createdAt)}
                  </p>
                  <p>
                    <CalendarClock size={14} />
                    Updated {formatDateTime(listing.updatedAt)}
                  </p>
                </div>
              </section>

              {listing.reportCount > 0 ? (
                <section className="amp-drawer-section amp-reports-panel">
                  <h3>
                    <Flag size={14} />
                    Report Section
                  </h3>
                  <p className="amp-report-summary">Total reports: {listing.reportCount}</p>
                  <div className="amp-report-list">
                    {listing.reports.map((report) => (
                      <ReportListItem key={report.id} report={report} />
                    ))}
                  </div>
                </section>
              ) : (
                <section className="amp-drawer-section amp-no-report">
                  <h3>
                    <Flag size={14} />
                    Report Section
                  </h3>
                  <p>No reports for this listing.</p>
                </section>
              )}

              {isAdmin ? (
                <section className="amp-drawer-section amp-admin-panel">
                  <h3>Admin Action Panel</h3>
                  <div className="amp-admin-actions">
                    <button
                      type="button"
                      className="amp-btn amp-btn-danger"
                      onClick={() => onDelete(listing.id)}
                    >
                      <Trash2 size={14} />
                      Delete Listing
                    </button>
                    <button
                      type="button"
                      className="amp-btn amp-btn-danger-outline"
                      onClick={() => onBanUser(listing.seller.id)}
                    >
                      <Ban size={14} />
                      Ban User
                    </button>
                  </div>
                </section>
              ) : null}
            </div>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
