
// src/features/relief/utils/relief.utils.ts 
import type { ReliefStatus, ReliefUrgency } from
    '../types/relief.types';

export const urgencyConfig: Record<
    ReliefUrgency,
    { label: string; colorClass: string; dotClass: string }
> = {
    Normal: {
        label: 'Normal', colorClass: 'urgNormal', dotClass:
            'dotNormal'
    },
    Important: {
        label: 'Important', colorClass: 'urgImportant', dotClass:
            'dotImportant'
    },
    Urgent: {
        label: 'Urgent', colorClass: 'urgUrgent', dotClass:
            'dotUrgent'
    },
    Critical: {
        label: 'Critical', colorClass: 'urgCritical', dotClass:
            'dotCritical'
    },
};

export const statusConfig: Record<
    ReliefStatus,
    { label: string; colorClass: string }
> = {
    Open: { label: 'Open', colorClass: 'statusOpen' },
    'Volunteers Assigned': {
        label: 'Volunteers Assigned', colorClass:
            'statusVolunteers'
    },
    'In Progress': {
        label: 'In Progress', colorClass: 'statusInProgress'
    },
    Completed: { label: 'Completed', colorClass: 'statusCompleted' },
    Expired: { label: 'Expired', colorClass: 'statusExpired' },
};

export function formatDistance(metres: number): string {
    if (metres < 1000) return `${metres}m`;
    return `${(metres / 1000).toFixed(1)}km`;
}

export function formatRelativeTime(isoDate: string): string {
    const diff = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

