/** The server's own error text from a failed RTK Query call, or `fallback` when there is none
 *  (network failure, empty message, non-string error, thrown Error, null/undefined). */
export function apiErrorMessage(err: unknown, fallback: string): string {
  const message = (err as { data?: { error?: unknown } } | null | undefined)?.data?.error;
  return typeof message === 'string' && message.length > 0 ? message : fallback;
}
