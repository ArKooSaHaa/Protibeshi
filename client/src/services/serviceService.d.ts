import { ServiceItem } from '@/features/services/types/service.types';

export function normalizeService(raw: unknown): ServiceItem;

export function createService(formData: FormData, token: string): Promise<{
  message: string;
  service: ServiceItem | null;
}>;

export function getServices(): Promise<ServiceItem[]>;

export function deleteService(
  id: string,
  token: string,
): Promise<{ message?: string } | null>;
