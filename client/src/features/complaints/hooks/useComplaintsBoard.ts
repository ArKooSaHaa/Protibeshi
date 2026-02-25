import { useMemo, useState } from 'react';
import { complaintsData, complaintFormLimits } from '../mock/complaintsData';
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

const getNextId = (items: ComplaintItem[]) => {
  const year = new Date().getFullYear();
  const base = items.length + 12;
  return `CMP-${year}-${String(base).padStart(4, '0')}`;
};

const buildUpdates = (status: ComplaintStatus) => {
  const today = new Date().toISOString().split('T')[0];
  if (status === 'Resolved') {
    return [
      { stage: 'Reported', date: today },
      { stage: 'Under Review', date: today },
      { stage: 'Resolved', date: today },
    ];
  }
  return [{ stage: 'Reported', date: today }];
};

export const useComplaintsBoard = () => {
  const [complaints, setComplaints] = useState<ComplaintItem[]>(complaintsData);
  const [filters, setFilters] = useState<ComplaintFilterState>(defaultFilters);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formState, setFormState] = useState<ComplaintFormState>(defaultFormState);
  const [formErrors, setFormErrors] = useState<ComplaintFormErrors>({});
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  const [supportedIds, setSupportedIds] = useState<string[]>([]);
  const [commentedIds, setCommentedIds] = useState<string[]>([]);

  const filteredComplaints = useMemo(
    () => filterComplaints(complaints, filters, currentUser),
    [complaints, filters],
  );

  const updateFormValue = <K extends keyof ComplaintFormState>(key: K, value: ComplaintFormState[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const validateForm = () => {
    const errors: ComplaintFormErrors = {};
    if (!formState.title.trim()) errors.title = 'Title is required.';
    if (!formState.category) errors.category = 'Category is required.';
    if (!formState.description.trim()) errors.description = 'Description is required.';
    if (!formState.location.trim()) errors.location = 'Location is required.';
    if (!formState.priority) errors.priority = 'Priority is required.';

    if (formState.title.length > complaintFormLimits.title) {
      errors.title = `Keep title under ${complaintFormLimits.title} characters.`;
    }

    if (formState.description.length > complaintFormLimits.description) {
      errors.description = `Keep description under ${complaintFormLimits.description} characters.`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormState(defaultFormState);
    setFormErrors({});
  };

  const handleSubmit = () => {
    if (!validateForm()) return false;

    const newComplaint: ComplaintItem = {
      id: getNextId(complaints),
      title: formState.title.trim(),
      category: formState.category as ComplaintItem['category'],
      description: formState.description.trim(),
      priority: formState.priority as ComplaintPriority,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      distance: 80,
      upvotes: 0,
      comments: 0,
      reportedBy: currentUser,
      verified: false,
      visibility: formState.visibility as ComplaintVisibility,
      location: formState.location.trim(),
      updates: buildUpdates('Pending'),
      attachments: formState.photo ? [formState.photo.name] : [],
    };

    setComplaints((prev) => [newComplaint, ...prev]);
    resetForm();
    setIsFormOpen(false);
    return true;
  };

  const handleSupportToggle = (id: string) => {
    const wasSupported = supportedIds.includes(id);

    setSupportedIds((prev) =>
      wasSupported ? prev.filter((item) => item !== id) : [...prev, id],
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
    setFollowedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
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
        const nextThread = item.commentThread ? [newComment, ...item.commentThread] : [newComment];
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
    formState,
    formErrors,
    updateFormValue,
    handleSubmit,
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
