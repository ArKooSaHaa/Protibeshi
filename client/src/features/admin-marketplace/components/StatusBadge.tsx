import { ShieldAlert, ShieldCheck, ShieldX, Timer } from 'lucide-react';
import type { AdminListingStatus } from '../types/adminMarketplace.types';

interface StatusBadgeProps {
  status: AdminListingStatus;
}

const statusLabel: Record<AdminListingStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  reported: 'Reported',
  rejected: 'Rejected',
};

const statusIcon = {
  pending: Timer,
  approved: ShieldCheck,
  reported: ShieldAlert,
  rejected: ShieldX,
} as const;

const statusClass: Record<AdminListingStatus, string> = {
  pending: 'amp-status-pending',
  approved: 'amp-status-approved',
  reported: 'amp-status-reported',
  rejected: 'amp-status-rejected',
};

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const Icon = statusIcon[status];

  return (
    <span className={`amp-status-badge ${statusClass[status]}`}>
      <Icon size={13} />
      {statusLabel[status]}
    </span>
  );
};
