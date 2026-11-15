import type { GetMeResultDto } from '../services/api';

export type AccessDecision = 'signing-in' | 'login' | 'loading-profile' | 'profile-error' | 'denied' | 'granted';

export interface AccessInput {
  /** MSAL has no interaction in progress (InteractionStatus.None). */
  msalSettled: boolean;
  isAuthenticated: boolean;
  profileLoading: boolean;
  /** The /users/me query failed (e.g. 401/403, network). */
  profileError: boolean;
  profile: Pick<GetMeResultDto, 'systemRole'> | undefined;
}

/**
 * The routing decision RequireAuth makes, in order. Only a profile whose systemRole is
 * exactly 'superadmin' is let in; everything else is denied or kept waiting.
 *
 * A failed or empty /users/me is 'profile-error' (never a permanent loading state); error wins
 * over any stale profile. 'granted' requires an explicit superadmin profile, so it fails closed.
 */
/**
 * Whether the signed-in operator may use write affordances. Fails closed: only an explicit
 * `platformAccess === 'write'` counts, so a missing field (older API) or 'read' is read-only.
 * The API enforces the same split (403 on writes for Platform.ReadOnly); this just stops the
 * console offering buttons that cannot work.
 */
export function canWrite(profile: Pick<GetMeResultDto, 'platformAccess'> | undefined): boolean {
  return profile?.platformAccess === 'write';
}

export function decideAccess({ msalSettled, isAuthenticated, profileLoading, profileError, profile }: AccessInput): AccessDecision {
  if (!msalSettled) return 'signing-in';
  if (!isAuthenticated) return 'login';
  if (profileLoading) return 'loading-profile';
  if (profileError || !profile) return 'profile-error';
  if (profile.systemRole !== 'superadmin') return 'denied';
  return 'granted';
}
