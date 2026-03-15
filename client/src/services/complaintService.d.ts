export function createComplaint(
  formData: FormData,
  token: string,
): Promise<{
  success?: boolean;
  message?: string;
  complaint?: unknown;
}>;

export function getComplaints(): Promise<unknown>;

export function deleteComplaint(
  id: number,
  token: string,
): Promise<{
  success?: boolean;
  message?: string;
} | null>;
