import { describe, expect, it } from 'vitest';
import { actionLabel, entityTypeLabel } from './shop-activity-labels';

const BACKEND_ACTIONS_ADDED = [
  'shop.delete',
  'shop.restore',
  'shop.missed_orders_pause_limit',
  'shop.orders_auto_paused',
  'shop.offline_by_superadmin',
  'shop.nameChange.requested',
  'shop.nameChange.approved',
  'shop.nameChange.rejected',
  'staff.create',
  'staff.update',
  'staff.delete',
  'staff.password_reset',
  'reference_lists.update',
  'role_permissions.update',
  'platform_legal_identity.update',
];

describe('actionLabel', () => {
  it('labels every audit action the backend writes that used to render raw', () => {
    for (const action of BACKEND_ACTIONS_ADDED) {
      const label = actionLabel(action);
      expect(label, action).not.toBe(action);
      expect(label.trim(), action).not.toBe('');
    }
  });
  it('keeps existing labels unchanged', () => {
    expect(actionLabel('shop.busy_mode')).toBe('switched busy mode');
    expect(actionLabel('product.create')).toBe('created product');
  });
  it('does not claim the pause-limit setting paused ordering', () => {
    expect(actionLabel('shop.missed_orders_pause_limit')).not.toMatch(/^paused/);
  });
  it('falls back to the raw key for an unknown action', () => {
    expect(actionLabel('shop.something_new')).toBe('shop.something_new');
  });
});

describe('entityTypeLabel', () => {
  it('labels the platform-level entity types', () => {
    expect(entityTypeLabel('reference_lists')).toBe('Reference list');
    expect(entityTypeLabel('role_permissions')).toBe('Role permissions');
    expect(entityTypeLabel('platform_legal_identity')).toBe('Platform legal identity');
  });
  it('keeps existing labels unchanged', () => {
    expect(entityTypeLabel('shop')).toBe('Shop');
  });
  it('falls back to the raw value for an unknown entity type', () => {
    expect(entityTypeLabel('mystery_thing')).toBe('mystery_thing');
  });
});
