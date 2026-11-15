import { describe, expect, it } from 'vitest';
import { decideAccess, type AccessInput } from './access';

const settled: AccessInput = { msalSettled: true, isAuthenticated: true, profileLoading: false, profileError: false, profile: { systemRole: 'superadmin' } };

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

  it('shows an error (not a permanent loading state) when /users/me returned nothing', () => {
    expect(decideAccess({ ...settled, profile: undefined, profileError: false })).toBe('profile-error');
  });

  it('still waits while the profile is loading', () => {
    expect(decideAccess({ ...settled, profile: undefined, profileLoading: true, profileError: false })).toBe(
      'loading-profile',
    );
  });

  it('reports profile-error when the /users/me query failed', () => {
    expect(decideAccess({ ...settled, profile: undefined, profileError: true, profileLoading: false })).toBe(
      'profile-error',
    );
  });

  it('never grants off stale profile data when the query errored', () => {
    expect(decideAccess({ ...settled, profileError: true })).toBe('profile-error');
  });
});
