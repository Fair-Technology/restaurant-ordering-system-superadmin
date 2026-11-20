import { describe, expect, it } from 'vitest';
import { getShopStatus, offlineActionLabel } from './shop-status';

describe('getShopStatus', () => {
  it('a shop with no flags is online', () => {
    expect(getShopStatus({})).toEqual({ kind: 'online', label: 'Online', ordersPaused: false });
  });
  it('platform offline wins over owner offline', () => {
    expect(getShopStatus({ isPaused: true, offlineBySuperadmin: true })).toEqual({
      kind: 'offline-platform',
      label: 'Offline (platform)',
      ordersPaused: false,
    });
  });
  it('owner offline', () => {
    expect(getShopStatus({ isPaused: true })).toEqual({
      kind: 'offline-owner',
      label: 'Offline (owner)',
      ordersPaused: false,
    });
  });
  it('orders paused is carried through', () => {
    expect(getShopStatus({ ordersPaused: true })).toEqual({ kind: 'online', label: 'Online', ordersPaused: true });
  });
});

describe('offlineActionLabel', () => {
  const label = (shop: Parameters<typeof getShopStatus>[0]) =>
    offlineActionLabel(shop, getShopStatus(shop));
  it('online shop: Take offline', () => {
    expect(label({})).toBe('Take offline');
  });
  it('owner-offline, not platform-offline: Force offline', () => {
    expect(label({ isPaused: true })).toBe('Force offline');
  });
  it('platform-offline: Bring back online (even if owner-offline too)', () => {
    expect(label({ offlineBySuperadmin: true })).toBe('Bring back online');
    expect(label({ isPaused: true, offlineBySuperadmin: true })).toBe('Bring back online');
  });
});
