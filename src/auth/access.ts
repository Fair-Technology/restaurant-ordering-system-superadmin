import type { GetMeResultDto } from '../services/api';

export type AccessDecision = 'signing-in' | 'login' | 'loading-profile' | 'denied' | 'granted';

export interface AccessInput {
  /** MSAL has no interaction in progress (InteractionStatus.None). */
  msalSettled: boolean;
  isAuthenticated: boolean;
  profileLoading: boolean;
  profile: Pick<GetMeResultDto, 'systemRole'> | undefined;
}

/**
 * The routing decision RequireAuth makes, in order. Only a profile whose systemRole is
 * exactly 'superadmin' is let in; everything else is denied or kept waiting.
 *
 * Note: a failed /users/me call leaves `profile` undefined and `profileLoading` false,
 * which is reported as 'loading-profile' — the gate fails closed (no access), but the
 * user sees a loading screen rather than an error.
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

export function decideAccess({ msalSettled, isAuthenticated, profileLoading, profile }: AccessInput): AccessDecision {
  if (!msalSettled) return 'signing-in';
  if (!isAuthenticated) return 'login';
  if (profileLoading || !profile) return 'loading-profile';
  if (profile.systemRole !== 'superadmin') return 'denied';
  return 'granted';
}
