import type { ShopSummaryDto } from '../services/api';

export const PAGE_SIZE = 20;

/** Deleted shops are hidden unless showDeleted; name search is case-insensitive substring. */
export function filterShops(shops: readonly ShopSummaryDto[], search: string, showDeleted: boolean): ShopSummaryDto[] {
  const needle = search.toLowerCase();
  return shops.filter((s) => (showDeleted || !s.isDeleted) && s.name.toLowerCase().includes(needle));
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
