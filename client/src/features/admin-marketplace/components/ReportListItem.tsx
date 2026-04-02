import { Flag, UserRound } from 'lucide-react';
import type { AdminListingReport } from '../types/adminMarketplace.types';

interface ReportListItemProps {
  report: AdminListingReport;
}

const severityClass = {
  low: 'amp-severity-low',
  medium: 'amp-severity-medium',
  high: 'amp-severity-high',
} as const;

const formatTime = (isoDate: string): string => {
  return new Date(isoDate).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const ReportListItem = ({ report }: ReportListItemProps) => {
  return (
    <article className="amp-report-item">
      <header className="amp-report-head">
        <p>
          <Flag size={13} />
          {report.reason}
        </p>
        <span className={`amp-severity-chip ${severityClass[report.severity]}`}>
          {report.severity}
        </span>
      </header>
      <p className="amp-report-message">{report.message || 'No additional message provided.'}</p>
      <footer className="amp-report-meta">
        <span>
          <UserRound size={12} />
          {report.reporterName}
        </span>
        <span>{formatTime(report.createdAt)}</span>
      </footer>
    </article>
  );
};
