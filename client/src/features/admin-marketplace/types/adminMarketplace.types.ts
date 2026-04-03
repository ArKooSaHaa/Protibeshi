export type AdminListingStatus = 'active' | 'reported';

export type AdminReportReason = 'Spam' | 'Fraud' | 'Misleading' | 'Inappropriate';

export type AdminReportSeverity = 'low' | 'medium' | 'high';

export type AdminMarketplaceTab = 'all' | 'reported';

export type AdminMarketplaceSort = 'latest' | 'most_reported' | 'oldest';

export type ActivityTone = 'info' | 'success' | 'warning' | 'danger';

export type ConfirmActionType = 'delete' | 'bulk-delete' | 'ban';

export interface AdminListingReport {
  id: string;
  reporterName: string;
  reason: AdminReportReason;
  message: string;
  severity: AdminReportSeverity;
  createdAt: string;
}

export interface AdminSellerProfile {
  id: string;
  name: string;
  username: string;
  profileImage: string | null;
  totalListings: number;
  joinDate: string;
  isVerified: boolean;
  isBanned: boolean;
  warningCount: number;
}

export interface AdminMarketplaceListing {
  id: string;
  title: string;
  price: number;
  location: string;
  category: string;
  description: string;
  image: string;
  status: AdminListingStatus;
  reportCount: number;
  reports: AdminListingReport[];
  createdAt: string;
  updatedAt: string;
  seller: AdminSellerProfile;
  isDeleted: boolean;
  aiTag: 'potential_spam' | null;
}

export interface AdminMarketplaceStats {
  totalListings: number;
  reportedListings: number;
  totalReports: number;
  activeUsers: number;
}

export interface AdminMarketplaceActivity {
  id: string;
  message: string;
  tone: ActivityTone;
  createdAt: string;
}

export interface ConfirmActionState {
  type: ConfirmActionType;
  listingIds: string[];
  sellerId?: string;
}
