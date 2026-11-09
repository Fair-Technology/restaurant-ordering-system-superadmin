import { describe, expect, it } from 'vitest';
import { FULFILMENT_MODES, buildTaxRateRows, formatBasisPoints, percentToBasisPoints } from './tax-rates';

describe('percentToBasisPoints / formatBasisPoints', () => {
  it('converts common German VAT rates', () => {
    expect(percentToBasisPoints('19')).toBe(1900);
    expect(percentToBasisPoints('7')).toBe(700);
    expect(percentToBasisPoints('0')).toBe(0);
  });
  it('handles fractional percents and float error', () => {
    expect(percentToBasisPoints('7.5')).toBe(750);
    expect(percentToBasisPoints('5.55')).toBe(555);
  });
  it('formats basis points as a percentage', () => {
    expect(formatBasisPoints(1900)).toBe('19.00%');
    expect(formatBasisPoints(750)).toBe('7.50%');
  });
  it('does no range check client-side (the backend rejects outside 0..10000 and non-integers)', () => {
    expect(percentToBasisPoints('-5')).toBe(-500);
    expect(percentToBasisPoints('abc')).toBeNaN();
  });
});

describe('buildTaxRateRows', () => {
  const base = { taxClassId: 'standard', pct: '19', startsAt: '2027-01-01' };

  it("'all' adds one row per fulfilment mode", () => {
    const rows = buildTaxRateRows({ ...base, mode: 'all' });
    expect(rows?.map((r) => r.fulfilmentMode)).toEqual(FULFILMENT_MODES);
    expect(rows?.every((r) => r.taxClassId === 'standard' && r.rateBasisPoints === 1900)).toBe(true);
  });

  it('a single mode adds one row', () => {
    expect(buildTaxRateRows({ ...base, mode: 'dine_in' })).toEqual([
      { taxClassId: 'standard', fulfilmentMode: 'dine_in', rateBasisPoints: 1900, effectiveFrom: '2027-01-01T00:00:00.000Z' },
    ]);
  });

  it('a date-only start is midnight UTC, regardless of the operator’s time zone', () => {
    expect(buildTaxRateRows({ ...base, mode: 'delivery' })?.[0].effectiveFrom).toBe('2027-01-01T00:00:00.000Z');
  });

  it('returns null when any field is missing', () => {
    expect(buildTaxRateRows({ ...base, mode: 'all', taxClassId: '' })).toBeNull();
    expect(buildTaxRateRows({ ...base, mode: 'all', pct: '' })).toBeNull();
    expect(buildTaxRateRows({ ...base, mode: 'all', startsAt: '' })).toBeNull();
  });
});
