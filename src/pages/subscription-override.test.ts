import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildLimitOverrideBody,
  endOfDayIso,
  limitLabel,
  limitOverrideError,
  planOverrideError,
} from './subscription-override';

describe('planOverrideError', () => {
  it('requires a plan', () => {
    expect(planOverrideError('', 'reason')).toBe('Please select a plan');
  });
  it('requires a non-blank reason', () => {
    expect(planOverrideError('plan-1', '')).toBe('Override reason is required');
    expect(planOverrideError('plan-1', '   ')).toBe('Override reason is required');
  });
  it('accepts a plan and a reason', () => {
    expect(planOverrideError('plan-1', 'Partner trial')).toBeNull();
  });
});

describe('limitOverrideError', () => {
  it('accepts -1 (unlimited), 0 and positive whole numbers', () => {
    for (const v of ['-1', '0', '1', '500']) expect(limitOverrideError(v, 'r'), v).toBeNull();
  });
  it('rejects blank, fractional, below -1 and non-numeric values', () => {
    for (const v of ['', '  ', '1.5', '-2', 'abc', 'NaN', 'Infinity']) {
      expect(limitOverrideError(v, 'r'), v).toBe('Enter a whole number, -1 or higher');
    }
  });
  it('checks the value before the reason', () => {
    expect(limitOverrideError('', '')).toBe('Enter a whole number, -1 or higher');
  });
  it('requires a non-blank reason', () => {
    expect(limitOverrideError('10', ' ')).toBe('Reason is required');
  });
});

describe('limitLabel', () => {
  it('renders -1 as unlimited', () => {
    expect(limitLabel(-1)).toBe('unlimited');
    expect(limitLabel(0)).toBe('0');
    expect(limitLabel(25)).toBe('25');
  });
});

describe('endOfDayIso — expiry "through the end of that day" in the operator’s local time', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('Berlin (CET, UTC+1 in winter)', () => {
    vi.stubEnv('TZ', 'Europe/Berlin');
    expect(endOfDayIso('2026-12-31')).toBe('2026-12-31T22:59:59.000Z');
  });

  it('Sydney (AEDT, UTC+11): the instant lands on the same calendar day in UTC', () => {
    vi.stubEnv('TZ', 'Australia/Sydney');
    expect(endOfDayIso('2026-12-31')).toBe('2026-12-31T12:59:59.000Z');
  });

  it('UTC', () => {
    vi.stubEnv('TZ', 'UTC');
    expect(endOfDayIso('2026-07-01')).toBe('2026-07-01T23:59:59.000Z');
  });
});

describe('buildLimitOverrideBody', () => {
  beforeEach(() => {
    vi.stubEnv('TZ', 'UTC');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('sends exactly one limit, trimmed reason, and null expiry when none picked', () => {
    expect(buildLimitOverrideBody('ORDERS_PER_MONTH', '200', '  Opening week ', '')).toEqual({
      limits: [{ key: 'ORDERS_PER_MONTH', value: 200 }],
      reason: 'Opening week',
      expiresAt: null,
    });
  });

  it('converts the expiry date to end of day', () => {
    expect(buildLimitOverrideBody('STAFF_ACCOUNTS', '-1', 'r', '2026-12-01').expiresAt).toBe('2026-12-01T23:59:59.000Z');
  });

  it('KNOWN GAP: the body never carries a second key, and the backend replaces the whole override', () => {
    // Setting STAFF_ACCOUNTS on a shop that already overrides ORDERS_PER_MONTH drops the latter.
    // See the PR description; this test pins the payload shape so a fix is a deliberate change.
    expect(buildLimitOverrideBody('STAFF_ACCOUNTS', '5', 'r', '').limits).toHaveLength(1);
  });
});
