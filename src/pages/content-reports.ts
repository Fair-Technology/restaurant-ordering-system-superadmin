import type { ContentReport, ContentReportCategory, ContentReportStatus } from '../services/api';
import { apiErrorMessage } from '../utils/apiError';

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

export const statusLabel = (status: ContentReportStatus): string => STATUS_LABELS[status];

export const statusBadgeClass = (status: ContentReportStatus): string => STATUS_BADGE[status];

export const categoryLabel = (category: ContentReportCategory): string => CATEGORY_LABELS[category];

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

const RECEIVED_AT_FORMAT: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

/** One timestamp format for the list and the detail, so the two always agree. */
export const formatReceivedAt = (iso: string): string =>
  new Date(iso).toLocaleString('en-GB', RECEIVED_AT_FORMAT);
