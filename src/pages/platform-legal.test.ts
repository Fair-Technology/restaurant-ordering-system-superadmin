import { describe, expect, it } from 'vitest';
import type { PlatformLegalIdentityResponse } from '../services/api';
import { toPlatformLegalBody, toPlatformLegalForm } from './platform-legal';

// Placeholder values only — not real operator data.
const identity: PlatformLegalIdentityResponse = {
  platformName: 'Example Platform',
  salesSiteUrl: 'https://example.test',
  operator: { legalName: 'Example GmbH', address: '1 Example St', email: 'legal@example.test' },
  euRepresentative: { name: 'EU Rep Ltd', address: '2 Rep Rd', email: 'rep@example.test' },
  updatedAt: null,
  updatedBy: null,
};

describe('platform legal identity form ⇄ body (the operator identity shown on every tenant’s legal pages)', () => {
  it('round-trips unchanged data', () => {
    expect(toPlatformLegalBody(toPlatformLegalForm(identity))).toEqual({
      platformName: identity.platformName,
      salesSiteUrl: identity.salesSiteUrl,
      operator: identity.operator,
      euRepresentative: identity.euRepresentative,
    });
  });

  it('trims every field', () => {
    const form = { ...toPlatformLegalForm(identity), platformName: '  X  ', operatorEmail: ' a@b.test ', euName: ' R ' };
    const body = toPlatformLegalBody(form);
    expect(body.platformName).toBe('X');
    expect(body.operator.email).toBe('a@b.test');
    expect(body.euRepresentative?.name).toBe('R');
  });

  it('sends null for a blank sales-site URL', () => {
    expect(toPlatformLegalBody({ ...toPlatformLegalForm(identity), salesSiteUrl: '   ' }).salesSiteUrl).toBeNull();
  });

  it('drops the EU representative when unticked, even if its fields still hold text', () => {
    const form = { ...toPlatformLegalForm(identity), euAppointed: false };
    expect(form.euName).toBe('EU Rep Ltd');
    expect(toPlatformLegalBody(form).euRepresentative).toBeNull();
  });

  it('loads a missing EU representative as unticked with empty fields', () => {
    const form = toPlatformLegalForm({ ...identity, euRepresentative: null, salesSiteUrl: null });
    expect(form.euAppointed).toBe(false);
    expect([form.euName, form.euAddress, form.euEmail, form.salesSiteUrl]).toEqual(['', '', '', '']);
  });
});
