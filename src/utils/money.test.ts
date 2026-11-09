import { describe, expect, it } from 'vitest';
import { formatCents, formatOrderTotal, parseAmountToCents } from './money';

describe('formatCents', () => {
  it('formats minor units with two decimals', () => {
    expect(formatCents(0)).toBe('0.00');
    expect(formatCents(5)).toBe('0.05');
    expect(formatCents(1999)).toBe('19.99');
    expect(formatCents(100000)).toBe('1000.00');
  });
});

describe('parseAmountToCents', () => {
  it('converts a typed price to integer cents', () => {
    expect(parseAmountToCents('19.99')).toBe(1999);
    expect(parseAmountToCents('0')).toBe(0);
    expect(parseAmountToCents('7')).toBe(700);
  });

  it('rounds binary floating-point error to the intended cent', () => {
    // 0.29 * 100 === 28.999999999999996, 1.15 * 100 === 114.99999999999999
    expect(parseAmountToCents('0.29')).toBe(29);
    expect(parseAmountToCents('1.15')).toBe(115);
    expect(parseAmountToCents('4.35')).toBe(435);
  });

  it('always returns an integer, as the backend requires', () => {
    for (const input of ['0.1', '0.2', '9.995', '12.345', '100.01']) {
      expect(Number.isInteger(parseAmountToCents(input)), input).toBe(true);
    }
  });

  it('rejects negative and non-numeric input', () => {
    expect(parseAmountToCents('-1')).toBeNull();
    expect(parseAmountToCents('-0.01')).toBeNull();
    expect(parseAmountToCents('abc')).toBeNull();
    expect(parseAmountToCents('12,50')).toBeNull(); // a comma decimal is not accepted
  });

  it('CURRENT BEHAVIOUR (hazard): an empty field parses as 0, so saving it sets the price to zero', () => {
    expect(parseAmountToCents('')).toBe(0);
    expect(parseAmountToCents('   ')).toBe(0);
  });

  it('accepts exponent notation that a number input allows', () => {
    expect(parseAmountToCents('1e2')).toBe(10000);
  });
});

describe('formatOrderTotal', () => {
  it('uses totalCents when present', () => {
    expect(formatOrderTotal({ totalCents: 2450, subtotalCents: 2000, currency: 'eur' })).toBe('24.50 EUR');
  });
  it('falls back to subtotalCents when totalCents is null or undefined', () => {
    expect(formatOrderTotal({ totalCents: null, subtotalCents: 2000, currency: 'eur' })).toBe('20.00 EUR');
    expect(formatOrderTotal({ subtotalCents: 2000, currency: 'aud' })).toBe('20.00 AUD');
  });
  it('keeps a zero total rather than falling back', () => {
    expect(formatOrderTotal({ totalCents: 0, subtotalCents: 2000, currency: 'eur' })).toBe('0.00 EUR');
  });
});
