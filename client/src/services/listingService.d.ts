export function createListing(formData: FormData, token: string): Promise<{
  message: string;
  listing: unknown;
}>;

export function getListings(): Promise<any[]>;

export function reportListing(
  listingId: number | string,
  reason?: string,
  token?: string,
): Promise<{
  message: string;
  reportId: number | null;
}>;
