import type { OwnerSummaryDto } from '../services/api';

export const OWNERS_PAGE_SIZE = 20;
export const SEARCH_DEBOUNCE_MS = 300;

/** A plain positive integer (>= 1), as typed. Rejects empty, 0, negatives, decimals and exponents. */
export function parsePositiveInt(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const n = Number(trimmed);
  return Number.isSafeInteger(n) && n >= 1 ? n : null;
}

/** "At limit" never applies to unlimited (-1) owners. */
export function isAtLimit(owner: Pick<OwnerSummaryDto, 'shopCount' | 'effectiveLimit'>): boolean {
  return owner.effectiveLimit !== -1 && owner.shopCount >= owner.effectiveLimit;
}

export function overrideLabel(maxShops: number | null): string {
  if (maxShops === null) return 'Global default';
  if (maxShops === -1) return 'Unlimited';
  return String(maxShops);
}

export function effectiveLabel(effectiveLimit: number): string {
  return effectiveLimit === -1 ? 'Unlimited' : String(effectiveLimit);
}
