import { ENV } from '@/config/env';

const LOCALHOST_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]']);

export type ResolveMediaUrlOptions = {
  defaultStoragePrefix?: string;
};

export const getBackendOrigin = (): string => {
  return String(ENV.API_BASE_URL || '').trim().replace(/\/$/, '');
};

const sanitizePath = (value: string): string => {
  return value.replace(/\\/g, '/').trim();
};

const isAbsoluteHttpUrl = (value: string): boolean => {
  return /^https?:\/\//i.test(value);
};

const normalizeStoragePrefix = (value: string | undefined): string => {
  if (!value) {
    return '';
  }

  return value.trim().replace(/^\/+|\/+$/g, '');
};

const rewriteLocalhostAbsoluteUrl = (absoluteUrl: string, backendOrigin: string): string => {
  try {
    const parsedAbsoluteUrl = new URL(absoluteUrl);
    const hostname = parsedAbsoluteUrl.hostname.toLowerCase();

    if (!LOCALHOST_HOSTS.has(hostname)) {
      return absoluteUrl;
    }

    const parsedBackendUrl = new URL(backendOrigin);
    return `${parsedBackendUrl.origin}${parsedAbsoluteUrl.pathname}${parsedAbsoluteUrl.search}${parsedAbsoluteUrl.hash}`;
  } catch {
    return absoluteUrl;
  }
};

const buildStorageUrl = (
  backendOrigin: string,
  normalizedPath: string,
  options: ResolveMediaUrlOptions,
): string => {
  let storagePath = normalizedPath.replace(/^\/+/, '');

  if (storagePath.startsWith('public/storage/')) {
    storagePath = storagePath.slice('public/storage/'.length);
  } else if (storagePath.startsWith('storage/')) {
    storagePath = storagePath.slice('storage/'.length);
  }

  const storagePrefix = normalizeStoragePrefix(options.defaultStoragePrefix);
  const shouldApplyPrefix = Boolean(storagePrefix) && !storagePath.includes('/');

  const finalStoragePath = shouldApplyPrefix ? `${storagePrefix}/${storagePath}` : storagePath;
  return `${backendOrigin}/storage/${finalStoragePath}`;
};

export const resolveMediaUrl = (
  rawPath: string | null | undefined,
  options: ResolveMediaUrlOptions = {},
): string | null => {
  if (typeof rawPath !== 'string') {
    return null;
  }

  const normalizedPath = sanitizePath(rawPath);
  if (!normalizedPath) {
    return null;
  }

  if (normalizedPath.startsWith('data:') || normalizedPath.startsWith('blob:')) {
    return normalizedPath;
  }

  const backendOrigin = getBackendOrigin();
  if (!backendOrigin) {
    return normalizedPath;
  }

  if (isAbsoluteHttpUrl(normalizedPath)) {
    return rewriteLocalhostAbsoluteUrl(normalizedPath, backendOrigin);
  }

  if (normalizedPath.startsWith('/')) {
    return `${backendOrigin}${normalizedPath}`;
  }

  return buildStorageUrl(backendOrigin, normalizedPath, options);
};
