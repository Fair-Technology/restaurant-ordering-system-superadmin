import { describe, expect, it } from 'vitest';
import { PERMISSION_ROWS, togglePermission } from './role-permissions';

describe('togglePermission — the platform-wide manager/staff permission matrix', () => {
  it('adds a missing key', () => {
    expect(togglePermission(['view_orders'], 'refund_orders')).toEqual(['view_orders', 'refund_orders']);
  });

  it('removes a present key', () => {
    expect(togglePermission(['view_orders', 'refund_orders'], 'refund_orders')).toEqual(['view_orders']);
  });

  it('toggling twice restores the original set', () => {
    const start = ['view_orders', 'manage_menu'];
    expect(togglePermission(togglePermission(start, 'manage_billing'), 'manage_billing')).toEqual(start);
  });

  it('preserves keys this page has no row for, so a save cannot silently strip them for every tenant', () => {
    const fromServer = ['view_orders', 'future_permission'];
    expect(togglePermission(fromServer, 'view_orders')).toEqual(['future_permission']);
  });

  it('does not mutate the input array', () => {
    const start = ['view_orders'];
    togglePermission(start, 'refund_orders');
    togglePermission(start, 'view_orders');
    expect(start).toEqual(['view_orders']);
  });

  it('never produces duplicates', () => {
    let list: string[] = [];
    for (let i = 0; i < 5; i++) list = togglePermission(list, 'view_orders');
    expect(list).toEqual(['view_orders']);
  });
});

describe('PERMISSION_ROWS', () => {
  it('has unique keys', () => {
    const keys = PERMISSION_ROWS.map((r) => r.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('includes the money-moving permissions', () => {
    const keys = PERMISSION_ROWS.map((r) => r.key);
    expect(keys).toContain('refund_orders');
    expect(keys).toContain('manage_billing');
  });
});
