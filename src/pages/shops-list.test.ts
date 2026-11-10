import { describe, expect, it } from 'vitest';
import type { ShopSummaryDto } from '../services/api';
import { PAGE_SIZE, buildSuperadminOfflineRequest, filterShops, pageOf } from './shops-list';

// Only the fields these helpers read are filled in; the cast stands in for the rest of the summary.
const shop = (over: Partial<ShopSummaryDto>): ShopSummaryDto =>
  ({
    id: 'id',
    name: 'Shop',
    slug: 'shop',
    isDeleted: false,
    ...over,
  }) as ShopSummaryDto;

describe('buildSuperadminOfflineRequest — the platform offline lock', () => {
  it('takes an unlocked shop offline, with the trimmed reason', () => {
    expect(buildSuperadminOfflineRequest(shop({ id: 's1' }), '  Fraud review ')).toEqual({
      shopId: 's1',
      offline: true,
      reason: 'Fraud review',
    });
  });

  it('treats an owner-paused (but not platform-locked) shop as unlocked, so the action takes it offline', () => {
    expect(buildSuperadminOfflineRequest(shop({ id: 's1', isPaused: true }), '').offline).toBe(true);
  });

  it('brings a locked shop back online and never sends the typed reason', () => {
    expect(buildSuperadminOfflineRequest(shop({ id: 's2', offlineBySuperadmin: true }), 'stale text')).toEqual({
      shopId: 's2',
      offline: false,
      reason: undefined,
    });
  });

  it('targets the shop it was given (no cross-shop mixups)', () => {
    expect(buildSuperadminOfflineRequest(shop({ id: 'abc-123' }), '').shopId).toBe('abc-123');
  });

  it('sends an empty string when going offline with no reason (the backend treats it as no reason)', () => {
    expect(buildSuperadminOfflineRequest(shop({}), '   ').reason).toBe('');
  });
});

describe('filterShops', () => {
  const shops = [
    shop({ id: '1', name: 'Ma Pasta' }),
    shop({ id: '2', name: 'Burger Barn' }),
    shop({ id: '3', name: 'Old Pasta Place', isDeleted: true }),
  ];

  it('hides deleted shops by default', () => {
    expect(filterShops(shops, '', false).map((s) => s.id)).toEqual(['1', '2']);
  });

  it('shows deleted shops when asked', () => {
    expect(filterShops(shops, '', true).map((s) => s.id)).toEqual(['1', '2', '3']);
  });

  it('searches case-insensitively by substring', () => {
    expect(filterShops(shops, 'PASTA', false).map((s) => s.id)).toEqual(['1']);
    expect(filterShops(shops, 'pasta', true).map((s) => s.id)).toEqual(['1', '3']);
  });
});

describe('pageOf', () => {
  const items = Array.from({ length: 45 }, (_, i) => i);

  it('uses 20 per page', () => {
    expect(PAGE_SIZE).toBe(20);
    expect(pageOf(items, 1).pageItems).toEqual(items.slice(0, 20));
    expect(pageOf(items, 3).pageItems).toEqual([40, 41, 42, 43, 44]);
    expect(pageOf(items, 1).totalPages).toBe(3);
  });

  it('returns no pages for an empty list', () => {
    expect(pageOf([], 1)).toEqual({ pageItems: [], totalPages: 0 });
  });

  it('a page past the end is empty (the page number is not clamped)', () => {
    expect(pageOf(items, 4).pageItems).toEqual([]);
  });
});
