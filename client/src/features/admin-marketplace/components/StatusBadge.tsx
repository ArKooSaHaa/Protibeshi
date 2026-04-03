import { ShieldAlert, ShieldCheck } from 'lucide-react';
import type { AdminListingStatus } from '../types/adminMarketplace.types';

interface StatusBadgeProps {
  status: AdminListingStatus;
}

const statusLabel: Record<AdminListingStatus, string> = {
  active: 'Live',
  reported: 'Reported',
};

const statusIcon = {
  active: ShieldCheck,
  reported: ShieldAlert,
} as const;

const statusClass: Record<AdminListingStatus, string> = {
  active: 'amp-status-approved',
  reported: 'amp-status-reported',
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
