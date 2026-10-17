import type { ShopResponse } from '../services/api';

/** Auto-pause limits a superadmin can pick: 0 = off, 1-10 = pause after that many missed orders. */
export const MISSED_ORDERS_LIMIT_OPTIONS: readonly number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const DEFAULT_LIMIT = 3;

/** The shop's limit; an absent value means the platform default of 3. */
export function missedOrdersLimitOf(shop: Pick<ShopResponse, 'missedOrdersPauseLimit'>): number {
  const v = shop.missedOrdersPauseLimit;
  return typeof v === 'number' && Number.isInteger(v) ? v : DEFAULT_LIMIT;
}

export function missedOrdersLimitLabel(limit: number): string {
  return limit === 0 ? 'Auto-pause: off' : `Auto-pause: after ${limit}`;
}
