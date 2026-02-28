/** 
 * src/features/relief/types/relief.types.ts 
*/

// ─── Enumerations ───────────────────────────────────────────────────────────── 

export const reliefHelpTypes = [
    'Food',
    'Medical',
    'Shelter',
    'Transportation',
    'Financial',
    'Utilities',
    'Disaster Relief',
    'Other',
] as const;

export const reliefUrgencyLevels = ['Normal', 'Important', 'Urgent',
    'Critical'] as const;

export const reliefStatuses = [
    'Open',
    'Volunteers Assigned',
    'In Progress',
    'Completed',
    'Expired',
] as const;

export const reliefVisibilityOptions = ['Public', 'Only verified neighbors'] as const;

export const reliefContactPreferences = ['In-app message', 'Phone'] as
    const;

export const reliefTimeSensitivities = ['Immediate', 'Within 24 hours',
    'Flexible'] as const;

export const reliefTimeRanges = ['Today', 'This week', 'This month',
    'All'] as const;

export const reliefAvailabilities = [
    'Today only',
    'This week',
    'Weekends',
    'On-call',
    'Recurring',
] as const;

// ─── Derived Types ──────────────────────────────────────────────────────────── 

export type ReliefHelpType = (typeof reliefHelpTypes)[number];
export type ReliefUrgency = (typeof reliefUrgencyLevels)[number];
export type ReliefStatus = (typeof reliefStatuses)[number];
export type ReliefVisibility = (typeof
    reliefVisibilityOptions)[number];
export type ReliefContactPreference = (typeof
    reliefContactPreferences)[number];
export type ReliefTimeSensitivity = (typeof
    reliefTimeSensitivities)[number];
export type ReliefTimeRange = (typeof reliefTimeRanges)[number];
export type ReliefAvailability = (typeof reliefAvailabilities)[number];

export type ReliefTabView = 'requests' | 'offers';

// ─── Domain Models ──────────────────────────────────────────────────────────── 

export interface ReliefTimelineEntry {
    stage: string;
    date: string;
    note?: string;
}

export interface ReliefComment {
    id: string;
    author: string;
    avatarInitials: string;
    message: string;
    createdAt: string;
}

export interface ReliefVolunteer {
    id: string;
    name: string;
    avatarInitials: string;
    verifiedNeighbor: boolean;
    joinedAt: string;
}

export interface ReliefRequest {
    id: string;
    type: 'request';
    helpType: ReliefHelpType;
    title: string;
    description: string;
    urgency: ReliefUrgency;
    status: ReliefStatus;
    visibility: ReliefVisibility;
    contactPreference: ReliefContactPreference;
    timeSensitivity: ReliefTimeSensitivity;
    location: string;
    distance: number; // metres 
    createdAt: string;
    updatedAt: string;
    postedBy: string;
    avatarInitials: string;
    verified: boolean;
    anonymous: boolean;
    volunteerCount: number;
    volunteers: ReliefVolunteer[];
    timeline: ReliefTimelineEntry[];
    comments: ReliefComment[];
    photos: string[];
    resolutionSummary?: string;
}

export interface HelpOffer {
    id: string;
    type: 'offer';
    helpType: ReliefHelpType;
    title: string;
    description: string;
    availability: ReliefAvailability;
    serviceRadius: number; // km 
    contactPreference: ReliefContactPreference;
    isRecurring: boolean;
    location: string;
    distance: number; // metres 
    createdAt: string;
    postedBy: string;
    avatarInitials: string;
    verified: boolean;
}

// Union type for cards 
export type ReliefPost = ReliefRequest | HelpOffer;

// ─── Filter State ───────────────────────────────────────────────────────────── 

export interface ReliefFilterState {
    helpTypes: ReliefHelpType[];
    urgencies: ReliefUrgency[];
    statuses: ReliefStatus[];
    distance: number;
    timeRange: ReliefTimeRange;
    verifiedOnly: boolean;
    tab: ReliefTabView;
}

// ─── Form States ────────────────────────────────────────────────────────────── 

export interface ReliefRequestFormState {
    title: string;
    helpType: ReliefHelpType | '';
    description: string;
    urgency: ReliefUrgency | '';
    location: string;
    visibility: ReliefVisibility;
    contactPreference: ReliefContactPreference;
    timeSensitivity: ReliefTimeSensitivity;
    photo?: File | null;
    phone?: string;
}

export interface HelpOfferFormState {
    title: string;
    helpType: ReliefHelpType | '';
    description: string;
    availability: ReliefAvailability | '';
    serviceRadius: number;
    contactPreference: ReliefContactPreference;
    isRecurring: boolean;
    phone?: string;
}

export type ReliefFormErrors<T> = Partial<Record<keyof T, string>>;

