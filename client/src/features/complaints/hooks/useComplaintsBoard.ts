// src/features/complaints/hooks/useComplaintsBoard.ts
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    createComplaint,
    deleteComplaint,
    getComplaints,
} from '@/services/complaintService';
import { complaintFormLimits } from '../mock/complaintsData';
import {
    ComplaintComment,
    ComplaintFilterState,
    ComplaintFormErrors,
    ComplaintFormState,
    ComplaintItem,
    ComplaintPriority,
    ComplaintStatus,
    ComplaintVisibility,
} from '../types/complaint.types';
import { filterComplaints } from './useComplaintFilters';

const defaultFilters: ComplaintFilterState = {
    categories: [],
    statuses: [],
    priorities: [],
    distance: 2000,
    timeRange: 'All',
    myComplaints: false,
};

const defaultFormState: ComplaintFormState = {
    title: '',
    category: '',
    description: '',
    location: 'Motijheel, Dhaka',
    priority: '',
    visibility: 'Public',
    photo: null,
};

const currentUser = 'Test User';

const statusMap: Record<string, ComplaintStatus> = {
    pending: 'Pending',
    under_review: 'Under Review',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    rejected: 'Rejected',
};

const priorityMap: Record<string, ComplaintPriority> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
};

const visibilityMap: Record<string, ComplaintVisibility> = {
    public: 'Public',
    private: 'Only admins',
    only_admins: 'Only admins',
    admins_only: 'Only admins',
};

const categoryLookup: Record<string, ComplaintItem['category']> = {
    garbage: 'Garbage',
    'water supply': 'Water supply',
    electricity: 'Electricity',
    'road damage': 'Road damage',
    noise: 'Noise',
    safety: 'Safety',
    'illegal activity': 'Illegal activity',
    other: 'Other',
};

const decodeCurrentUserIdFromToken = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    const token = window.localStorage.getItem('token');
    if (!token) {
        return null;
    }

    try {
        const payloadSegment = token.split('.')[1];
        if (!payloadSegment) {
            return null;
        }

        const normalizedPayload = payloadSegment
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        const paddedPayload = normalizedPayload.padEnd(
            normalizedPayload.length + (4 - (normalizedPayload.length % 4 || 4)),
            '=',
        );

        const payload = JSON.parse(atob(paddedPayload));
        const userId = Number(payload?.sub ?? payload?.user_id ?? payload?.id);

        return Number.isFinite(userId) ? userId : null;
    } catch {
        return null;
    }
};

const toTitleCase = (value: string): string =>
    value
        .split(' ')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');

const normalizeCategory = (rawCategory: unknown): ComplaintItem['category'] => {
    const category = String(rawCategory || '').trim();
    if (!category) {
        return 'Other';
    }

    const normalizedKey = category.replace(/_/g, ' ').toLowerCase();
    return categoryLookup[normalizedKey] || categoryLookup[toTitleCase(category).toLowerCase()] || 'Other';
};

const normalizeComplaint = (raw: Record<string, unknown>): ComplaintItem => {
    const statusKey = String(raw.status || '').toLowerCase();
    const priorityKey = String(raw.priority || '').toLowerCase();
    const visibilityKey = String(raw.visibility || '').toLowerCase().replace(/\s+/g, '_');
    const photoPath = typeof raw.photo === 'string' ? raw.photo : null;
    const attachmentName =
        photoPath && photoPath.includes('/') ? photoPath.split('/').pop() || photoPath : photoPath;

    const resolvedByName =
        raw.user && typeof raw.user === 'object' && raw.user !== null
            ? String((raw.user as { name?: unknown }).name || '').trim()
            : '';

    const code = String(raw.complaint_code || raw.id || `CMP-${Date.now()}`);
    const numericId = Number(raw.id);
    const userIdFromPayload =
        raw.user && typeof raw.user === 'object' && raw.user !== null
            ? Number((raw.user as { id?: unknown }).id)
            : NaN;

    return {
        id: code,
        recordId: Number.isFinite(numericId) ? numericId : undefined,
        userId: Number.isFinite(userIdFromPayload) ? userIdFromPayload : undefined,
        title: String(raw.title || 'Untitled complaint'),
        category: normalizeCategory(raw.category),
        description: String(raw.description || ''),
        priority: priorityMap[priorityKey] || 'Medium',
        status: statusMap[statusKey] || 'Pending',
        createdAt: String(raw.created_at || new Date().toISOString()),
        distance: Number(raw.distance ?? 0),
        upvotes: 0,
        comments: 0,
        reportedBy: resolvedByName || 'Anonymous',
        verified: false,
        visibility: visibilityMap[visibilityKey] || 'Public',
        location: String(raw.location || ''),
        photoUrl: photoPath,
        photoPath,
        updates: [{
            stage: 'Reported',
            date: String(raw.created_at || new Date().toISOString()).split('T')[0],
        }],
        attachments: attachmentName ? [attachmentName] : [],
    };
};

const extractComplaintsFromResponse = (payload: unknown): ComplaintItem[] => {
    if (Array.isArray(payload)) {
        return payload
            .map((item) => normalizeComplaint(item as Record<string, unknown>));
    }

    if (payload && typeof payload === 'object') {
        const maybeObject = payload as { complaints?: unknown };
        if (Array.isArray(maybeObject.complaints)) {
            return maybeObject.complaints
                .map((item) => normalizeComplaint(item as Record<string, unknown>));
        }
    }

    return [];
};

export const useComplaintsBoard = () => {
    const [complaints, setComplaints] = useState<ComplaintItem[]>([]);

    const [filters, setFilters] =
        useState<ComplaintFilterState>(defaultFilters);

    const [selectedComplaint, setSelectedComplaint] =
        useState<ComplaintItem | null>(null);

    const [isFilterDrawerOpen, setIsFilterDrawerOpen] =
        useState(false);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingComplaintId, setDeletingComplaintId] = useState<number | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    const [formState, setFormState] =
        useState<ComplaintFormState>(defaultFormState);

    const [formErrors, setFormErrors] =
        useState<ComplaintFormErrors>({});

    const [followedIds, setFollowedIds] = useState<string[]>([]);
    const [supportedIds, setSupportedIds] = useState<string[]>([]);
    const [commentedIds, setCommentedIds] = useState<string[]>([]);

    const loadComplaints = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage(null);

        try {
            const data = await getComplaints();
            setComplaints(extractComplaintsFromResponse(data));
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Failed to load complaints';
            setErrorMessage(message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        setCurrentUserId(decodeCurrentUserIdFromToken());
        void loadComplaints();
    }, [loadComplaints]);

    const filteredComplaints = useMemo(
        () => filterComplaints(complaints, filters, currentUser, currentUserId),
        [complaints, filters, currentUserId],
    );

    const updateFormValue = <K extends keyof ComplaintFormState>(
        key: K,
        value: ComplaintFormState[K],
    ) => {
        setFormState((prev) => ({ ...prev, [key]: value }));
    };

    const validateForm = () => {
        const errors: ComplaintFormErrors = {};

        if (!formState.title.trim())
            errors.title = 'Title is required.';

        if (!formState.category)
            errors.category = 'Category is required.';

        if (!formState.description.trim())
            errors.description = 'Description is required.';

        if (!formState.location.trim())
            errors.location = 'Location is required.';

        if (!formState.priority)
            errors.priority = 'Priority is required.';

        if (formState.title.length > complaintFormLimits.title) {
            errors.title = `Keep title under ${complaintFormLimits.title} characters.`;
        }

        if (
            formState.description.length >
            complaintFormLimits.description
        ) {
            errors.description = `Keep description under ${complaintFormLimits.description} characters.`;
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const resetForm = () => {
        setFormState(defaultFormState);
        setFormErrors({});
    };

    const handleSubmit = async () => {
        if (!validateForm()) return false;

        const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
        if (!token) {
            setErrorMessage('You need to sign in before reporting an issue.');
            return false;
        }

        setIsSubmitting(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        const formData = new FormData();
        formData.append('title', formState.title.trim());
        formData.append('category', formState.category);
        formData.append('description', formState.description.trim());
        formData.append('location', formState.location.trim());
        formData.append('priority', formState.priority.toLowerCase());
        formData.append('visibility', formState.visibility === 'Only admins' ? 'private' : 'public');

        if (formState.photo) {
            formData.append('photo', formState.photo);
        }

        try {
            const response = await createComplaint(formData, token);
            const createdComplaint =
                response && typeof response === 'object' && 'complaint' in response
                    ? normalizeComplaint((response as { complaint: Record<string, unknown> }).complaint)
                    : null;

            setSuccessMessage(
                response && typeof response === 'object' && 'message' in response
                    ? String((response as { message?: unknown }).message || 'Complaint submitted successfully')
                    : 'Complaint submitted successfully',
            );

            if (createdComplaint) {
                setComplaints((prev) => [createdComplaint, ...prev]);
            }

            await loadComplaints();

            resetForm();
            setIsFormOpen(false);

            return true;
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Failed to submit complaint';
            setErrorMessage(message);
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    const onDeleteComplaint = useCallback(async (recordId: number) => {
        const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;

        if (!token) {
            setErrorMessage('You need to sign in before deleting a complaint.');
            return;
        }

        setDeletingComplaintId(recordId);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            const response = await deleteComplaint(recordId, token);
            setSuccessMessage(
                response && typeof response === 'object' && 'message' in response
                    ? String((response as { message?: unknown }).message || 'Complaint deleted successfully')
                    : 'Complaint deleted successfully',
            );

            setComplaints((prev) => prev.filter((item) => item.recordId !== recordId));
            setSelectedComplaint((prev) => (prev?.recordId === recordId ? null : prev));
            await loadComplaints();
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Failed to delete complaint';
            setErrorMessage(message);
        } finally {
            setDeletingComplaintId(null);
        }
    }, [loadComplaints]);

    const clearFeedback = () => {
        setErrorMessage(null);
        setSuccessMessage(null);
    };

    const handleSupportToggle = (id: string) => {
        const wasSupported = supportedIds.includes(id);

        setSupportedIds((prev) =>
            wasSupported
                ? prev.filter((item) => item !== id)
                : [...prev, id],
        );

        setComplaints((prev) =>
            prev.map((item) => {
                if (item.id !== id) return item;

                const nextUpvotes = wasSupported
                    ? Math.max(0, item.upvotes - 1)
                    : item.upvotes + 1;

                return { ...item, upvotes: nextUpvotes };
            }),
        );
    };

    const handleFollow = (id: string) => {
        setFollowedIds((prev) =>
            prev.includes(id)
                ? prev.filter((item) => item !== id)
                : [...prev, id],
        );
    };

    const handleCommentClick = (complaint: ComplaintItem) => {
        setCommentedIds((prev) => {
            if (!prev.includes(complaint.id)) {
                return [...prev, complaint.id];
            }
            return prev;
        });

        setSelectedComplaint(complaint);
    };

    const handleAddComment = (id: string, message: string) => {
        if (!message.trim()) return;

        const newComment: ComplaintComment = {
            id: `comment-${Date.now()}`,
            author: currentUser,
            message: message.trim(),
            createdAt: new Date().toISOString(),
        };

        setComplaints((prev) =>
            prev.map((item) => {
                if (item.id !== id) return item;

                const nextThread = item.commentThread
                    ? [newComment, ...item.commentThread]
                    : [newComment];

                return {
                    ...item,
                    comments: item.comments + 1,
                    commentThread: nextThread,
                };
            }),
        );
    };

    return {
        complaints,
        filteredComplaints,
        filters,
        setFilters,
        selectedComplaint,
        setSelectedComplaint,
        isFilterDrawerOpen,
        setIsFilterDrawerOpen,
        isFormOpen,
        setIsFormOpen,
        isLoading,
        isSubmitting,
        deletingComplaintId,
        errorMessage,
        successMessage,
        currentUserId,
        formState,
        formErrors,
        updateFormValue,
        handleSubmit,
        loadComplaints,
        onDeleteComplaint,
        clearFeedback,
        handleSupportToggle,
        handleFollow,
        handleCommentClick,
        handleAddComment,
        followedIds,
        supportedIds,
        commentedIds,
        currentUser,
    };
};