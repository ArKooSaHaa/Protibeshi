// src/features/relief/components/ReliefList.tsx 
import { AnimatePresence } from 'framer-motion';
import { HeartOff } from 'lucide-react';
import type { HelpOffer, ReliefRequest, ReliefTabView } from
  '../types/relief.types';
import { HelpOfferCard } from './HelpOfferCard';
import styles from './ReliefList.module.css';
import { ReliefRequestCard } from './ReliefRequestCard';

interface ReliefListProps {
  tab: ReliefTabView;
  requests: ReliefRequest[];
  offers: HelpOffer[];
  onViewRequest: (r: ReliefRequest) => void;
  onVolunteer: (r: ReliefRequest) => void;
  offeringRequestId?: string | null;
  currentUserId?: number | null;
  deletingRequestId?: string | null;
  onDeleteRequest?: (r: ReliefRequest) => void;
  onViewOffer: (o: HelpOffer) => void;
  onRequestSupport: (o: HelpOffer) => void;
}

export const ReliefList = ({
  tab,
  requests,
  offers,
  onViewRequest,
  onVolunteer,
  offeringRequestId,
  currentUserId,
  deletingRequestId,
  onDeleteRequest,
  onViewOffer,
  onRequestSupport,
}: ReliefListProps) => {
  if (tab === 'requests') {
    if (requests.length === 0) {
      return (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <HeartOff size={24} />
          </div>
          <p className={styles.emptyTitle}>No active relief requests</p>
          <p className={styles.emptyText}>
            All current requests have been handled or no requests match
            your filters.
          </p>
        </div>
      );
    }
    return (
      <div className={styles.list}>
        <AnimatePresence mode="popLayout">
          {requests.map((r) => (
            <ReliefRequestCard
              key={r.id}
              request={r}
              onViewDetails={onViewRequest}
              onVolunteer={onVolunteer}
              isOffering={offeringRequestId === r.id}
              canDelete={typeof currentUserId === 'number' && r.userId === currentUserId}
              isDeleting={deletingRequestId === r.id}
              onDelete={onDeleteRequest}
            />
          ))}
        </AnimatePresence>
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>
          <HeartOff size={24} />
        </div>
        <p className={styles.emptyTitle}>No help offers yet</p>
        <p className={styles.emptyText}>
          Be the first to offer your support to neighbors in need.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      <AnimatePresence mode="popLayout">
        {offers.map((o) => (
          <HelpOfferCard
            key={o.id}
            offer={o}
            onViewDetails={onViewOffer}
            onRequestSupport={onRequestSupport}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};