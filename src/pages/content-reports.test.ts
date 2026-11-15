import { describe, expect, it } from 'vitest';
import type { ContentReportCategory, ContentReportStatus } from '../services/api';
import {
  ALREADY_DECIDED_MESSAGE,
  CONTENT_REPORT_PAGE_SIZE,
  DECISION_REASON_MAX,
  EMPTY_FILTER_MESSAGE,
  EMPTY_PAST_END_MESSAGE,
  STATUS_FILTERS,
  categoryLabel,
  decisionErrorMessage,
  formatReceivedAt,
  hasMorePages,
  isAlreadyDecidedError,
  isDecided,
  isEmptyPastEnd,
  statusBadgeClass,
  statusLabel,
  validateDecisionReason,
} from './content-reports';

const STATUSES: ContentReportStatus[] = ['received', 'actioned', 'dismissed'];
const CATEGORIES: ContentReportCategory[] = [
  'illegal_goods',
  'fraud_or_scam',
  'hate_or_harassment',
  'copyright_or_trademark',
  'personal_data',
  'other',
];

describe('statusLabel', () => {
  it('labels every status', () => {
    expect(STATUSES.map(statusLabel)).toEqual(['Received', 'Actioned', 'Dismissed']);
  });

  it('gives every status a badge class', () => {
    for (const status of STATUSES) expect(statusBadgeClass(status)).toMatch(/bg-\S+ text-\S+/);
  });
});

describe('categoryLabel', () => {
  it('labels every category', () => {
    expect(CATEGORIES.map(categoryLabel)).toEqual([
      'Illegal goods',
      'Fraud or scam',
      'Hate or harassment',
      'Copyright or trademark',
      'Personal data',
      'Other',
    ]);
  });
});

describe('out-of-enum values', () => {
  // Reachable only if the stored enum and the client drift — a blank cell hides the report.
  it('falls back to the raw value rather than an empty string', () => {
    expect(categoryLabel('does_not_exist')).toBe('does_not_exist');
    expect(statusLabel('bogus_status')).toBe('bogus_status');
  });

  it('gives an unknown status a neutral badge class', () => {
    expect(statusBadgeClass('bogus_status')).toMatch(/bg-\S+ text-\S+/);
  });

  it('reads an empty or non-string value as Unknown', () => {
    expect(categoryLabel('')).toBe('Unknown');
    expect(statusLabel('   ')).toBe('Unknown');
    expect(statusLabel(undefined as unknown as string)).toBe('Unknown');
  });
});

describe('STATUS_FILTERS', () => {
  it('offers All first, then the three statuses in order', () => {
    expect(STATUS_FILTERS.map((f) => f.value)).toEqual(['', 'received', 'actioned', 'dismissed']);
    expect(STATUS_FILTERS[0].label).toBe('All');
  });
});

describe('isDecided', () => {
  it('only received reports are undecided', () => {
    expect(isDecided({ status: 'received' })).toBe(false);
    expect(isDecided({ status: 'actioned' })).toBe(true);
    expect(isDecided({ status: 'dismissed' })).toBe(true);
  });
});

describe('isAlreadyDecidedError', () => {
  it('recognises the RTK Query 409 shape', () => {
    expect(isAlreadyDecidedError({ status: 409, data: { error: 'Already decided' } })).toBe(true);
  });

  it('is false for other failures and for nothing at all', () => {
    expect(isAlreadyDecidedError({ status: 500, data: { error: 'boom' } })).toBe(false);
    expect(isAlreadyDecidedError({ status: 'FETCH_ERROR', error: 'offline' })).toBe(false);
    expect(isAlreadyDecidedError(null)).toBe(false);
    expect(isAlreadyDecidedError(undefined)).toBe(false);
    expect(isAlreadyDecidedError(new Error('boom'))).toBe(false);
  });
});

describe('decisionErrorMessage', () => {
  it('replaces the 409 message with the already-decided notice', () => {
    expect(decisionErrorMessage({ status: 409, data: { error: 'Already decided' } }, 'fallback')).toBe(
      ALREADY_DECIDED_MESSAGE,
    );
  });

  it('uses the API message for any other failure', () => {
    expect(decisionErrorMessage({ status: 400, data: { error: 'Reason is required' } }, 'fallback')).toBe(
      'Reason is required',
    );
  });

  it('falls back when there is no message', () => {
    expect(decisionErrorMessage({ status: 500, data: {} }, 'fallback')).toBe('fallback');
    expect(decisionErrorMessage({ status: 'FETCH_ERROR' }, 'fallback')).toBe('fallback');
    expect(decisionErrorMessage(null, 'fallback')).toBe('fallback');
  });
});

describe('validateDecisionReason', () => {
  it('requires a non-blank reason', () => {
    expect(validateDecisionReason('')).not.toBeNull();
    expect(validateDecisionReason('   \n\t ')).not.toBeNull();
  });

  it('accepts DECISION_REASON_MAX characters and rejects one more', () => {
    expect(validateDecisionReason('a'.repeat(DECISION_REASON_MAX))).toBeNull();
    expect(validateDecisionReason('a'.repeat(DECISION_REASON_MAX + 1))).not.toBeNull();
  });

  it('accepts an ordinary reason', () => {
    expect(validateDecisionReason('Listing sells counterfeit goods')).toBeNull();
  });
});

describe('hasMorePages', () => {
  it('a full page means there may be another one', () => {
    expect(hasMorePages(Array.from({ length: CONTENT_REPORT_PAGE_SIZE }))).toBe(true);
    expect(hasMorePages(Array.from({ length: CONTENT_REPORT_PAGE_SIZE }), CONTENT_REPORT_PAGE_SIZE)).toBe(true);
  });

  it('a short page — including an empty one — is the last', () => {
    expect(hasMorePages(Array.from({ length: CONTENT_REPORT_PAGE_SIZE - 1 }))).toBe(false);
    expect(hasMorePages([])).toBe(false);
    expect(hasMorePages(Array.from({ length: 5 }), 5)).toBe(true);
  });
});

describe('isEmptyPastEnd', () => {
  it('is the past-the-end state only on a later page with no rows', () => {
    expect(isEmptyPastEnd(0, 2)).toBe(true);
    expect(isEmptyPastEnd(0, 5)).toBe(true);
  });

  it('is false for a genuinely empty filter (page 1) and for any page with rows', () => {
    expect(isEmptyPastEnd(0, 1)).toBe(false);
    expect(isEmptyPastEnd(CONTENT_REPORT_PAGE_SIZE, 1)).toBe(false);
    expect(isEmptyPastEnd(CONTENT_REPORT_PAGE_SIZE, 3)).toBe(false);
  });

  it('keeps the two empty states distinct', () => {
    expect(EMPTY_FILTER_MESSAGE).not.toBe(EMPTY_PAST_END_MESSAGE);
  });
});

describe('formatReceivedAt', () => {
  it('formats a fixed ISO timestamp with the shared day/month/year hour:minute shape', () => {
    const formatted = formatReceivedAt('2026-11-15T03:30:00.000Z');
    expect(formatted).toMatch(/^\d{1,2} Nov 2026, \d{2}:\d{2}$/);
  });
});
