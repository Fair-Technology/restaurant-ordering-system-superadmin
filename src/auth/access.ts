import type { GetMeResultDto } from '../services/api';

export type AccessDecision =
  | 'signing-in'
  | 'login'
  | 'loading-profile'
  | 'profile-error'
  | 'denied'
  | 'granted';

export interface AccessInput {
  /** MSAL has no interaction in progress (InteractionStatus.None). */
  msalSettled: boolean;
  isAuthenticated: boolean;
  profileLoading: boolean;
  /** The /users/me query failed (e.g. 401/403, network) — t_ceb7b8e1. */
  profileError: boolean;
  profile: Pick<GetMeResultDto, 'platformAccess'> | undefined;
}

/**
 * Whether the signed-in operator may use write affordances. Fails closed: only an explicit
 * `platformAccess === 'write'` counts, so a missing field (older API) or 'read' is read-only.
 * The API enforces the same split (403 on writes for Platform.ReadOnly); this just stops the
 * console offering buttons that cannot work.
 */
export function canWrite(profile: Pick<GetMeResultDto, 'platformAccess'> | undefined): boolean {
  return profile?.platformAccess === 'write';
}

/**
 * Whether the profile is a platform operator at all (either access level). Fails closed: a
 * customer-tenant token gets a /users/me 200 with no `platformAccess`, and must not reach the console.
 */
export function isPlatformOperator(profile: Pick<GetMeResultDto, 'platformAccess'> | undefined): boolean {
  return profile?.platformAccess === 'read' || profile?.platformAccess === 'write';
}

/**
 * The routing decision RequireAuth makes, in order. Only a profile that carries a
 * `platformAccess` value ('read' or 'write') is let in; a customer-token profile (a /users/me
 * 200 with no `platformAccess`) is 'denied'. A 'read' operator is granted — the console then
 * hides its write controls (see `canWrite`).
 *
 * A failed /users/me is reported as 'profile-error' (never a permanent loading state) and the
 * error wins over any stale profile; 'granted' requires an explicit platform operator, so the
 * gate fails closed either way. The caller renders a retry/sign-out page for 'profile-error'.
 */
export function decideAccess({ msalSettled, isAuthenticated, profileLoading, profileError, profile }: AccessInput): AccessDecision {
  if (!msalSettled) return 'signing-in';
  if (!isAuthenticated) return 'login';
  if (profileLoading) return 'loading-profile';
  if (profileError || !profile) return 'profile-error';
  if (!isPlatformOperator(profile)) return 'denied';
  return 'granted';
}
