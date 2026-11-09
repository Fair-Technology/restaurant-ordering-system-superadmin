export const LIMIT_KEYS = ['ORDERS_PER_MONTH', 'STAFF_ACCOUNTS'] as const;
export type LimitKey = (typeof LIMIT_KEYS)[number];

/** A date-only input means "through the end of that day" in the superadmin's local time. */
export function endOfDayIso(date: string): string {
  return new Date(`${date}T23:59:59`).toISOString();
}

export function limitLabel(value: number): string {
  return value === -1 ? 'unlimited' : String(value);
}

/** Validation for "Apply Override" (plan override). Returns the error to show, or null. */
export function planOverrideError(selectedPlanId: string, reason: string): string | null {
  if (!selectedPlanId) return 'Please select a plan';
  if (!reason.trim()) return 'Override reason is required';
  return null;
}

/** Validation for "Set Limit Override". Returns the error to show, or null. */
export function limitOverrideError(limitValue: string, reason: string): string | null {
  const value = Number(limitValue);
  if (limitValue.trim() === '' || !Number.isInteger(value) || value < -1) {
    return 'Enter a whole number, -1 or higher';
  }
  if (!reason.trim()) return 'Reason is required';
  return null;
}

/**
 * The body sent to PUT .../limit-override. It carries exactly one limit: the backend
 * REPLACES the shop's whole limitOverride with this list, so setting one key drops any
 * other key that was overridden before.
 */
export function buildLimitOverrideBody(key: LimitKey, limitValue: string, reason: string, expiresAt: string) {
  return {
    limits: [{ key, value: Number(limitValue) }],
    reason: reason.trim(),
    expiresAt: expiresAt ? endOfDayIso(expiresAt) : null,
  };
}
