export function normalizeRentListing(raw: any): any;

export function createRentListing(formData: FormData, token: string): Promise<{
  message: string;
  listing: any;
}>;

export function getRentListings(): Promise<any[]>;

export function deleteRentListing(id: string | number, token: string): Promise<any>;

export function reportRentListing(
  listingId: number | string,
  reason?: string,
  token?: string,
): Promise<{
  message: string;
  reportId: number;
}>;

export function getAdminRentListings(token?: string): Promise<any[]>;

export function hideAdminRentListing(
  listingId: number | string,
  reason?: string,
  token?: string,
): Promise<{
  message: string;
  listing: unknown;
}>;

export function banRentListingOwner(
  listingId: number | string,
  reason?: string,
  token?: string,
): Promise<{
  message: string;
  affectedListings: number;
  seller: unknown;
}>;
