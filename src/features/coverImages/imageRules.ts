/** Fixed shape of a cover image; the backend enforces the same output size (COVER_IMAGE_WRONG_SIZE). */
export interface ImageRule {
  /** Crop frame ratio, width / height. */
  aspect: number;
  outputWidth: number;
  outputHeight: number;
  /** Smallest source photo that is accepted (smaller would look blurry). */
  minWidth: number;
  minHeight: number;
  /** Ratio (width / height) of the "safe area" shown on phones, centred in the frame. */
  safeAspect: number;
  outputMime: 'image/jpeg';
  outputQuality: number;
}

/** Shop cover (storefront banner): 3:1, phones show the centre 2:1. Mirrors rs-admin's COVER_IMAGE_RULE. */
export const COVER_IMAGE_RULE: ImageRule = {
  aspect: 3,
  outputWidth: 1920,
  outputHeight: 640,
  minWidth: 1200,
  minHeight: 400,
  safeAspect: 2,
  outputMime: 'image/jpeg',
  outputQuality: 0.85,
};

/** Server-side cap on library size (MAX_COVER_LIBRARY_IMAGES). */
export const MAX_COVER_LIBRARY_IMAGES = 50;
export const COVER_NAME_MAX_LENGTH = 100;
export const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** True when the source photo is at least the rule's minimum size. */
export function meetsMinimumSize(width: number, height: number, rule: ImageRule): boolean {
  return width >= rule.minWidth && height >= rule.minHeight;
}

/** Trimmed name if valid (1-100 chars), otherwise null. */
export function validCoverName(name: string): string | null {
  const trimmed = name.trim();
  return trimmed.length >= 1 && trimmed.length <= COVER_NAME_MAX_LENGTH ? trimmed : null;
}

export const WRONG_SIZE_CODES = ['COVER_IMAGE_WRONG_SIZE'] as const;

function errorData(error: unknown): { code?: unknown; error?: unknown } | null {
  if (typeof error !== 'object' || error === null) return null;
  const { data } = error as { data?: unknown };
  return typeof data === 'object' && data !== null ? (data as { code?: unknown; error?: unknown }) : null;
}

/** True when a failed API call (RTK Query error) was the server refusing the image's pixel size. */
export function isWrongSizeError(error: unknown): boolean {
  const code = errorData(error)?.code;
  return (WRONG_SIZE_CODES as readonly unknown[]).includes(code);
}

/** True when the server refused because the library is full. */
export function isLimitReachedError(error: unknown): boolean {
  const data = errorData(error);
  if (data?.code === 'LIMIT_REACHED') return true;
  return typeof error === 'object' && error !== null && (error as { status?: unknown }).status === 409;
}
