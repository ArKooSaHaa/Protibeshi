export function normalizeRentListing(raw: any): any;

export function createRentListing(formData: FormData, token: string): Promise<{
  message: string;
  listing: any;
}>;

export function getRentListings(): Promise<any[]>;

export function deleteRentListing(id: string | number, token: string): Promise<any>;
