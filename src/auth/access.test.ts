import { describe, expect, it } from 'vitest';
import { decideAccess, isPlatformOperator, type AccessInput } from './access';

const settled: AccessInput = { msalSettled: true, isAuthenticated: true, profileLoading: false, profile: { platformAccess: 'write' } };

describe('decideAccess — the platform-operator route gate', () => {
  it('grants a signed-in platform operator with write access', () => {
    expect(decideAccess(settled)).toBe('granted');
  });

  it("grants a read-only operator (platformAccess 'read') — the console hides write controls itself", () => {
    expect(decideAccess({ ...settled, profile: { platformAccess: 'read' } })).toBe('granted');
  });

  it('denies a customer-token profile (platformAccess undefined)', () => {
    expect(decideAccess({ ...settled, profile: { platformAccess: undefined } })).toBe('denied');
  });

  it('denies a profile with no platformAccess field at all', () => {
    expect(decideAccess({ ...settled, profile: {} })).toBe('denied');
  });

  it('denies any platformAccess value that is not exactly "read" or "write"', () => {
    for (const value of ['readonly', 'READ', 'Write', 'write ', 'superadmin', '']) {
      // Simulate an unexpected value from the API, beyond what the TS type admits.
      const profile = { platformAccess: value } as unknown as AccessInput['profile'];
      expect(decideAccess({ ...settled, profile }), value).toBe('denied');
    }
  });

  it('never grants while MSAL is still processing, even with an operator profile cached', () => {
    expect(decideAccess({ ...settled, msalSettled: false })).toBe('signing-in');
  });

  it('sends an unauthenticated visitor to login, whatever profile data is lying around', () => {
    expect(decideAccess({ ...settled, isAuthenticated: false })).toBe('login');
  });

  it('waits while the profile loads', () => {
    expect(decideAccess({ ...settled, profileLoading: true })).toBe('loading-profile');
  });

  it('fails closed when /users/me returned nothing (e.g. a 401/403): no access, keeps waiting', () => {
    // Current behaviour: the user sees the loading screen indefinitely rather than an error.
    expect(decideAccess({ ...settled, profile: undefined })).toBe('loading-profile');
  });
});

describe('isPlatformOperator', () => {
  it("is true for 'read' and 'write'", () => {
    expect(isPlatformOperator({ platformAccess: 'read' })).toBe(true);
    expect(isPlatformOperator({ platformAccess: 'write' })).toBe(true);
  });

  it('is false for a missing profile or a missing field', () => {
    expect(isPlatformOperator(undefined)).toBe(false);
    expect(isPlatformOperator({})).toBe(false);
  });
});
