export const complaintCategories = [
  'Garbage',
  'Water supply',
  'Electricity',
  'Road damage',
  'Noise',
  'Safety',
  'Illegal activity',
  'Other',
] as const;

export const complaintPriorities = ['Low', 'Medium', 'High', 'Urgent'] as const;

export const complaintStatuses = [
  'Pending',
  'Under Review',
  'In Progress',
  'Resolved',
  'Rejected',
] as const;

export const complaintTimeRanges = ['Today', 'This week', 'This month', 'All'] as const;

export const complaintVisibilityOptions = ['Public', 'Only admins'] as const;

export type ComplaintCategory = (typeof complaintCategories)[number];
export type ComplaintPriority = (typeof complaintPriorities)[number];
export type ComplaintStatus = (typeof complaintStatuses)[number];
export type ComplaintTimeRange = (typeof complaintTimeRanges)[number];
export type ComplaintVisibility = (typeof complaintVisibilityOptions)[number];

export interface ComplaintUpdate {
  stage: string;
  date: string;
  note?: string;
}

export interface ComplaintComment {
  id: string;
  author: string;
  message: string;
  createdAt: string;
}

export interface ComplaintItem {
  id: string;
  title: string;
  category: ComplaintCategory;
  description: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  createdAt: string;
  distance: number;
  upvotes: number;
  comments: number;
  reportedBy: string;
  verified: boolean;
  visibility: ComplaintVisibility;
  location: string;
  updates: ComplaintUpdate[];
  attachments?: string[];
  resolutionSummary?: string;
  commentThread?: ComplaintComment[];
}

export interface ComplaintFilterState {
  categories: ComplaintCategory[];
  statuses: ComplaintStatus[];
  priorities: ComplaintPriority[];
  distance: number;
  timeRange: ComplaintTimeRange;
  myComplaints: boolean;
}

export interface ComplaintFormState {
  title: string;
  category: ComplaintCategory | '';
  description: string;
  location: string;
  priority: ComplaintPriority | '';
  visibility: ComplaintVisibility;
  photo: File | null;
}

export interface ComplaintFormErrors {
  title?: string;
  category?: string;
  description?: string;
  location?: string;
  priority?: string;
}
