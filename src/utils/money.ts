/** Minor units (cents) to a two-decimal string, e.g. 1999 -> "19.99". No currency symbol. */
export function formatCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * A price typed by a superadmin (major units, e.g. "19.99") to integer cents, or null when
 * it is not a number or is negative. Rounds to the nearest cent.
 *
 * Current behaviour, kept as-is: an empty or whitespace-only field parses as 0, because
 * Number('') === 0. On the plan-pricing page that means clearing a field and saving sets
 * that price to zero.
 */
export function parseAmountToCents(input: string): number | null {
  const cents = Math.round(Number(input) * 100);
  if (isNaN(cents) || cents < 0) return null;
  return cents;
}

/** An order's display total: totalCents when present, otherwise subtotalCents, e.g. "12.50 EUR". */
export function formatOrderTotal(order: { totalCents?: number | null; subtotalCents: number; currency: string }): string {
  return `${formatCents(order.totalCents ?? order.subtotalCents)} ${order.currency.toUpperCase()}`;
}
