export function createComplaint(
  formData: FormData,
  token: string,
): Promise<{
  success?: boolean;
  message?: string;
  complaint?: unknown;
}>;

export function getComplaints(): Promise<unknown>;

export function getAdminComplaints(
  token?: string,
  options?: {
    page?: number;
    perPage?: number;
    search?: string;
    status?: string;
    priority?: string;
    category?: string;
    visibility?: string;
    tab?: string;
    sort?: string;
  },
): Promise<unknown>;

export function getAdminComplaintDetails(
  complaintId: number,
  token?: string,
): Promise<unknown>;

export function updateAdminComplaintStatus(
  complaintId: number,
  payload: {
    status: string;
    note?: string | null;
  },
  token?: string,
): Promise<unknown>;

export function bulkUpdateAdminComplaintStatus(
  complaintIds: number[],
  payload: {
    status: string;
    note?: string | null;
  },
  token?: string,
): Promise<unknown>;

export function deleteComplaint(
  id: number,
  token: string,
): Promise<{
  success?: boolean;
  message?: string;
} | null>;
