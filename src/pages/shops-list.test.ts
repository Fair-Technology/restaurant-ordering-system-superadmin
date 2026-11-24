import { describe, expect, it } from 'vitest';
import type { ShopSummaryDto } from '../services/api';
import { PAGE_SIZE, buildSuperadminOfflineRequest, countShops, filterShops, pageOf } from './shops-list';

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

  it('trims leading/trailing whitespace from the search term', () => {
    expect(filterShops(shops, 'pasta ', false).map((s) => s.id)).toEqual(['1']);
    expect(filterShops(shops, '  ma  ', false).map((s) => s.id)).toEqual(['1']);
    expect(filterShops(shops, '   ', false).map((s) => s.id)).toEqual(['1', '2']);
    expect(filterShops(shops, '   ', true).map((s) => s.id)).toEqual(['1', '2', '3']);
  });

  it('ignores accents: "cafe" finds "Café am Rhein"', () => {
    const list = [...shops, shop({ id: '4', name: 'Café am Rhein', slug: 'cafe-am-rhein' })];
    expect(filterShops(list, 'cafe', false).map((s) => s.id)).toEqual(['4']);
    expect(filterShops(list, 'CAFÉ', false).map((s) => s.id)).toEqual(['4']);
  });

  it('matches a slug fragment that is not in the name', () => {
    const list = [...shops, shop({ id: '5', name: 'Zum Fährmann', slug: 'rhein-faehre' })];
    expect(filterShops(list, 'rhein', false).map((s) => s.id)).toEqual(['5']);
  });
});

describe('countShops', () => {
  it('counts nothing for an empty list', () => {
    expect(countShops([])).toEqual({ active: 0, deleted: 0 });
  });

  it('counts every shop as active when none are deleted', () => {
    expect(countShops([shop({ id: '1' }), shop({ id: '2' })])).toEqual({ active: 2, deleted: 0 });
  });

  it('separates active from soft-deleted shops', () => {
    const shops = [shop({ id: '1' }), shop({ id: '2', isDeleted: true }), shop({ id: '3' })];
    expect(countShops(shops)).toEqual({ active: 2, deleted: 1 });
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
