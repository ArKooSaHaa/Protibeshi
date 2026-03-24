export function createListing(formData: FormData, token: string): Promise<{
  message: string;
  listing: unknown;
}>;

export function getListings(): Promise<any[]>;
