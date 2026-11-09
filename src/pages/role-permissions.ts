export const PERMISSION_ROWS: Array<{ key: string; label: string }> = [
  { key: 'view_orders', label: 'View orders' },
  { key: 'refund_orders', label: 'Refund orders' },
  { key: 'view_reports', label: 'View reports and takings' },
  { key: 'manage_menu', label: 'Edit menu and prices' },
  { key: 'manage_shop', label: 'Restaurant settings' },
  { key: 'manage_staff', label: 'Manage staff logins' },
  { key: 'manage_billing', label: 'Billing and payments' },
  { key: 'view_audit', label: 'View activity log' },
];

/** Adds `key` if absent, removes it if present. Other keys — including ones this UI has no row
 *  for — are left untouched, so saving never strips a permission the page cannot display. */
export function togglePermission(current: readonly string[], key: string): string[] {
  return current.includes(key) ? current.filter((p) => p !== key) : [...current, key];
}
