import { describe, expect, it } from 'vitest';
import {
  COUNTRY_SUBDIVISIONS,
  countryRequiresState,
  isKnownState,
  subdivisionName,
  subdivisionsForCountry,
} from './subdivisions';

describe('subdivisionsForCountry / countryRequiresState', () => {
  it('returns the list for DE, AU and US (case/whitespace insensitive)', () => {
    expect(subdivisionsForCountry('DE')).toHaveLength(16);
    expect(subdivisionsForCountry(' au ')).toHaveLength(8);
    expect(subdivisionsForCountry('us')).toHaveLength(51);
    expect(countryRequiresState('DE')).toBe(true);
  });
  it('returns null for countries without a list or empty input', () => {
    expect(subdivisionsForCountry('FR')).toBeNull();
    expect(subdivisionsForCountry('')).toBeNull();
    expect(subdivisionsForCountry(null)).toBeNull();
    expect(subdivisionsForCountry('toString')).toBeNull();
    expect(countryRequiresState(undefined)).toBe(false);
  });
  it('has unique codes per country', () => {
    for (const list of Object.values(COUNTRY_SUBDIVISIONS)) {
      expect(new Set(list.map((s) => s.code)).size).toBe(list.length);
    }
  });
});

describe('subdivisionName', () => {
  it('matches by code or name, ignoring case, diacritics and spacing', () => {
    expect(subdivisionName('by', 'DE')).toBe('Bayern');
    expect(subdivisionName('Baden-Wurttemberg', 'DE')).toBe('Baden-Württemberg');
    expect(subdivisionName('new  south wales', 'AU')).toBe('New South Wales');
  });
  it('returns null for unknown, empty or list-less countries', () => {
    expect(subdivisionName('Oberbayern', 'DE')).toBeNull();
    expect(subdivisionName('', 'DE')).toBeNull();
    expect(subdivisionName('Bayern', 'FR')).toBeNull();
  });
});

describe('isKnownState', () => {
  it('accepts known codes and names', () => {
    expect(isKnownState('NSW', 'AU')).toBe(true);
    expect(isKnownState('Texas', 'US')).toBe(true);
  });
  it('rejects unknown or empty values where a list exists', () => {
    expect(isKnownState('Atlantis', 'US')).toBe(false);
    expect(isKnownState('', 'DE')).toBe(false);
  });
  it('accepts anything where the country has no list', () => {
    expect(isKnownState('whatever', 'FR')).toBe(true);
    expect(isKnownState('', 'FR')).toBe(true);
  });
});
