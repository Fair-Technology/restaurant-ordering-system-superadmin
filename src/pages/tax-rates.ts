import type { FulfilmentModeKey, TaxRateRowDto } from '../services/api';

export const FULFILMENT_MODES: FulfilmentModeKey[] = ['collection', 'delivery', 'dine_in'];

/** "19" (percent) -> 1900 basis points. No range check here; the backend enforces 0..10000. */
export function percentToBasisPoints(pct: string): number {
  return Math.round(Number(pct) * 100);
}

export function formatBasisPoints(bp: number): string {
  return `${(bp / 100).toFixed(2)}%`;
}

/**
 * The rows the "Add rate" form appends: one per fulfilment mode ('all' = all three), or null
 * when a field is missing. `startsAt` is a date-only input, which `new Date()` parses as
 * midnight UTC (not local midnight).
 */
export function buildTaxRateRows(input: {
  taxClassId: string;
  mode: FulfilmentModeKey | 'all';
  pct: string;
  startsAt: string;
}): TaxRateRowDto[] | null {
  const { taxClassId, mode, pct, startsAt } = input;
  if (!taxClassId || !pct || !startsAt) return null;
  const modes: FulfilmentModeKey[] = mode === 'all' ? FULFILMENT_MODES : [mode];
  const rateBasisPoints = percentToBasisPoints(pct);
  const effectiveFrom = new Date(startsAt).toISOString();
  return modes.map((fulfilmentMode) => ({ taxClassId, fulfilmentMode, rateBasisPoints, effectiveFrom }));
}
