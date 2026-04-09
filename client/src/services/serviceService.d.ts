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

export function reportService(
  serviceId: number | string,
  reason?: string,
  token?: string,
): Promise<{
  message: string;
  reportId: number;
}>;

export function getAdminServices(token?: string): Promise<any[]>;

export function hideAdminService(
  serviceId: number | string,
  reason?: string,
  token?: string,
): Promise<{
  message: string;
  service: any;
}>;

export function verifyAdminService(
  serviceId: number | string,
  token?: string,
): Promise<{
  message: string;
  service: any;
  clearedReports: number;
}>;

export function flagAdminService(
  serviceId: number | string,
  reason?: string,
  token?: string,
): Promise<{
  message: string;
  service: any;
}>;

export function dismissAdminServiceReports(
  serviceId: number | string,
  token?: string,
): Promise<{
  message: string;
  service: any;
  clearedReports: number;
}>;

export function banServiceProvider(
  serviceId: number | string,
  reason?: string,
  token?: string,
): Promise<{
  message: string;
  affectedServices: number;
  seller: any;
}>;
