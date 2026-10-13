import { describe, expect, it } from 'vitest';
import { getShopStatus } from './shop-status';

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
