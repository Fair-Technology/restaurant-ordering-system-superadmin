import { describe, expect, it } from 'vitest';
import { formatDate, formatDateTime } from './date';

// Midday UTC keeps the calendar day stable across timezones.
const ISO = '2026-10-02T12:41:02.000Z';

describe('formatDate', () => {
  it('formats as day, short month, year (never numeric)', () => {
    expect(formatDate(ISO)).toMatch(/^2 Oct 2026$/);
  });
});

describe('formatDateTime', () => {
  it('formats as day, short month, year with 24h hour:minute', () => {
    expect(formatDateTime(ISO)).toMatch(/^2 Oct 2026, \d{2}:\d{2}$/);
  });
});
