export function createListing(formData: FormData, token: string): Promise<{
  message: string;
  listing: unknown;
}>;

export function getListings(): Promise<any[]>;

export function deleteListing(
  listingId: number | string,
  token?: string,
): Promise<{
  message: string;
  listing: unknown;
}>;

export function getAdminListings(token?: string): Promise<any[]>;

export function deleteAdminListing(
  listingId: number | string,
  reason: string,
  token?: string,
): Promise<{
  message: string;
  listing: unknown;
}>;

export function banListingSeller(
  listingId: number | string,
  reason?: string,
  token?: string,
): Promise<{
  message: string;
  affectedListings: number;
  seller: unknown;
}>;

export function reportListing(
  listingId: number | string,
  reason?: string,
  token?: string,
): Promise<{
  message: string;
  reportId: number | null;
}>;
