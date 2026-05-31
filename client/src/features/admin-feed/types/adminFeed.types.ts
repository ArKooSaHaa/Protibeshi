export type AdminPostStatus = 'pending' | 'verified' | 'reported' | 'rejected';

export type AdminFilterTab = 'all' | 'pending' | 'verified' | 'reported' | 'rejected';

export type AdminDateFilter = 'all' | '24h' | '7d' | '30d';

export type ActivityTone = 'info' | 'success' | 'warning' | 'danger';

export type ToastTone = 'success' | 'danger' | 'info';

export interface AdminPostUser {
  id: string;
  name: string;
  avatar_url: string | null;
}

export interface PostReport {
  id: string;
  reason: string;
  reported_by: string;
  created_at: string;
  details: string;
}

export interface AdminFeedPost {
  id: string;
  user: AdminPostUser;
  title?: string | null;
  short_description?: string | null;
  content: string;
  created_at: string;
  location: string;
  status: AdminPostStatus;
  moderation_source?: string | null;
  moderation_note?: string | null;
  report_count: number;
  is_deleted: boolean;
  reports: PostReport[];
  pinned: boolean;
}

export interface AdminFeedStats {
  totalPosts: number;
  pendingPosts: number;
  reportedPosts: number;
  deletedPosts: number;
}

export interface AdminActivityItem {
  id: string;
  message: string;
  created_at: string;
  tone: ActivityTone;
}

export interface AdminToast {
  id: string;
  message: string;
  tone: ToastTone;
}
