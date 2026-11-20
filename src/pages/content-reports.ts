import type { ContentReport, ContentReportCategory, ContentReportStatus } from '../services/api';
import { apiErrorMessage } from '../utils/apiError';
import { formatDateTime } from '../utils/date';

/** The API's default page size for the content-report queue. */
export const CONTENT_REPORT_PAGE_SIZE = 20;

/** The API's cap on the recorded decision reason. */
export const DECISION_REASON_MAX = 2000;

/** Shown in place of the server's message when the POST lost a race and the report is already decided. */
export const ALREADY_DECIDED_MESSAGE =
  'This report was already decided — the list has been refreshed.';

/** '' means "no status filter" — the API treats an empty status as "all". */
export type StatusFilter = '' | ContentReportStatus;

export const STATUS_FILTERS: ReadonlyArray<{ value: StatusFilter; label: string }> = [
  { value: '', label: 'All' },
  { value: 'received', label: 'Received' },
  { value: 'actioned', label: 'Actioned' },
  { value: 'dismissed', label: 'Dismissed' },
];

const STATUS_LABELS: Record<ContentReportStatus, string> = {
  received: 'Received',
  actioned: 'Actioned',
  dismissed: 'Dismissed',
};

const STATUS_BADGE: Record<ContentReportStatus, string> = {
  received: 'bg-amber-100 text-amber-700',
  actioned: 'bg-green-100 text-green-700',
  dismissed: 'bg-gray-100 text-gray-600',
};

const CATEGORY_LABELS: Record<ContentReportCategory, string> = {
  illegal_goods: 'Illegal goods',
  fraud_or_scam: 'Fraud or scam',
  hate_or_harassment: 'Hate or harassment',
  copyright_or_trademark: 'Copyright or trademark',
  personal_data: 'Personal data',
  other: 'Other',
};

/** Neutral badge for a status the client doesn't recognise (enum drift). */
const UNKNOWN_STATUS_BADGE = 'bg-gray-100 text-gray-600';

const hasOwn = (table: object, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(table, key);

const lookup = (table: Record<string, string>, key: string): string | undefined =>
  hasOwn(table, key) ? table[key] : undefined;

/** A stored value the client can't map is shown as-is — never as a blank cell. */
const rawOrUnknown = (value: unknown): string =>
  typeof value === 'string' && value.trim() !== '' ? value : 'Unknown';

export const statusLabel = (status: ContentReportStatus | string): string =>
  lookup(STATUS_LABELS, status) ?? rawOrUnknown(status);

export const statusBadgeClass = (status: ContentReportStatus | string): string =>
  lookup(STATUS_BADGE, status) ?? UNKNOWN_STATUS_BADGE;

export const categoryLabel = (category: ContentReportCategory | string): string =>
  lookup(CATEGORY_LABELS, category) ?? rawOrUnknown(category);

/** A report is undecided only while its status is 'received'. */
export const isDecided = (report: Pick<ContentReport, 'status'>): boolean => report.status !== 'received';

/** RTK Query surfaces a non-2xx as { status: 409, data }; anything else is not this error. */
export const isAlreadyDecidedError = (err: unknown): boolean =>
  typeof err === 'object' && err !== null && (err as { status?: unknown }).status === 409;

/** The API's own message, except that a 409 becomes ALREADY_DECIDED_MESSAGE. */
export function decisionErrorMessage(err: unknown, fallback: string): string {
  if (isAlreadyDecidedError(err)) return ALREADY_DECIDED_MESSAGE;
  return apiErrorMessage(err, fallback);
}

/** Reason is required (non-blank) and at most DECISION_REASON_MAX characters. */
export function validateDecisionReason(reason: string): string | null {
  if (reason.trim().length === 0) return 'Enter a reason for the decision.';
  if (reason.length > DECISION_REASON_MAX) {
    return `Keep the reason to ${DECISION_REASON_MAX} characters or fewer.`;
  }
  return null;
}

/** A full page came back, so there may be another one. */
export function hasMorePages(reports: readonly unknown[], pageSize: number = CONTENT_REPORT_PAGE_SIZE): boolean {
  return reports.length >= pageSize;
}

/** Shown when page 1 comes back empty — the selected filter really has no reports. */
export const EMPTY_FILTER_MESSAGE = 'No content reports for this filter.';

/** Shown when a later page comes back empty — the operator just stepped past the end. */
export const EMPTY_PAST_END_MESSAGE = 'No reports on this page.';

/**
 * The API sends no total, so a full last page still offers Next. Landing on an empty page past
 * the end must not reuse the filter-empty copy: the filter does have reports, on an earlier page.
 */
export const isEmptyPastEnd = (reportCount: number, page: number): boolean =>
  reportCount === 0 && page > 1;

/** One timestamp format for the list and the detail, so the two always agree. */
export const formatReceivedAt = formatDateTime;
