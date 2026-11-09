import { describe, expect, it } from 'vitest';
import { decideAccess, type AccessInput } from './access';

const settled: AccessInput = { msalSettled: true, isAuthenticated: true, profileLoading: false, profile: { systemRole: 'superadmin' } };

describe('decideAccess — the superadmin route gate', () => {
  it('grants a signed-in superadmin', () => {
    expect(decideAccess(settled)).toBe('granted');
  });

  it("denies a signed-in user whose systemRole is 'user'", () => {
    expect(decideAccess({ ...settled, profile: { systemRole: 'user' } })).toBe('denied');
  });

  it('denies any role string that is not exactly "superadmin"', () => {
    for (const role of ['Superadmin', 'SUPERADMIN', 'superadmin ', 'admin', 'owner', '']) {
      // Simulate an unexpected value from the API, beyond what the TS type admits.
      const profile = { systemRole: role } as unknown as AccessInput['profile'];
      expect(decideAccess({ ...settled, profile }), role).toBe('denied');
    }
  });

  it('never grants while MSAL is still processing, even with a superadmin profile cached', () => {
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
