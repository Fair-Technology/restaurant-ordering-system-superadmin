import { describe, expect, it } from 'vitest';
import {
  MISSED_ORDERS_LIMIT_OPTIONS,
  missedOrdersLimitLabel,
  missedOrdersLimitOf,
} from './missed-orders';

describe('missedOrdersLimitOf', () => {
  it('defaults to 3 when absent', () => {
    expect(missedOrdersLimitOf({})).toBe(3);
  });
  it('keeps 0 (off)', () => {
    expect(missedOrdersLimitOf({ missedOrdersPauseLimit: 0 })).toBe(0);
  });
  it('falls back to 3 for a non-integer value', () => {
    expect(missedOrdersLimitOf({ missedOrdersPauseLimit: 2.5 })).toBe(3);
    expect(missedOrdersLimitOf({ missedOrdersPauseLimit: Number.NaN })).toBe(3);
    expect(missedOrdersLimitOf({ missedOrdersPauseLimit: '5' as unknown as number })).toBe(3);
  });
  it('keeps a set value', () => {
    expect(missedOrdersLimitOf({ missedOrdersPauseLimit: 7 })).toBe(7);
  });
});

describe('missedOrdersLimitLabel', () => {
  it('says off for 0', () => {
    expect(missedOrdersLimitLabel(0)).toBe('Auto-pause: off');
  });
  it('says after N otherwise', () => {
    expect(missedOrdersLimitLabel(3)).toBe('Auto-pause: after 3');
  });
});

describe('MISSED_ORDERS_LIMIT_OPTIONS', () => {
  it('runs 0 to 10', () => {
    expect(MISSED_ORDERS_LIMIT_OPTIONS).toHaveLength(11);
    expect(MISSED_ORDERS_LIMIT_OPTIONS[0]).toBe(0);
    expect(MISSED_ORDERS_LIMIT_OPTIONS[10]).toBe(10);
  });
});
