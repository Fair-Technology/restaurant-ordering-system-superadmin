import type { ShopSummaryDto } from '../services/api';

export const PAGE_SIZE = 20;

/** Lowercases and strips diacritics so "Café" and "cafe" compare equal. */
export function foldForSearch(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Deleted shops are hidden unless showDeleted; search is a case- and accent-insensitive
 * substring match against the shop's name or slug.
 */
export function filterShops(shops: readonly ShopSummaryDto[], search: string, showDeleted: boolean): ShopSummaryDto[] {
  const needle = foldForSearch(search.trim());
  return shops.filter(
    (s) => (showDeleted || !s.isDeleted) && (foldForSearch(s.name).includes(needle) || foldForSearch(s.slug).includes(needle)),
  );
}

/** Active vs soft-deleted shop counts, derived from the list itself (not the API's `total`). */
export function countShops(shops: readonly ShopSummaryDto[]): { active: number; deleted: number } {
  const deleted = shops.filter((s) => s.isDeleted).length;
  return { active: shops.length - deleted, deleted };
}

export function pageOf<T>(items: readonly T[], page: number, size = PAGE_SIZE): { pageItems: T[]; totalPages: number } {
  return { pageItems: items.slice((page - 1) * size, page * size), totalPages: Math.ceil(items.length / size) };
}

/**
 * The request for the platform offline toggle. The direction comes from the shop's current
 * platform lock: a locked shop is brought back online, anything else is taken offline.
 * A reason is only sent when going offline.
 */
export function buildSuperadminOfflineRequest(
  shop: Pick<ShopSummaryDto, 'id' | 'offlineBySuperadmin'>,
  reason: string,
): { shopId: string; offline: boolean; reason: string | undefined } {
  const goOffline = !shop.offlineBySuperadmin;
  return { shopId: shop.id, offline: goOffline, reason: goOffline ? reason.trim() : undefined };
}
