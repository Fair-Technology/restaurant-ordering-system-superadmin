import { describe, expect, it } from 'vitest';
import { apiErrorMessage } from './apiError';

describe('apiErrorMessage', () => {
  it("returns the server's error text", () => {
    expect(
      apiErrorMessage({ status: 409, data: { error: 'Plan key already exists' } }, 'Failed to create plan'),
    ).toBe('Plan key already exists');
  });
  it('falls back when the server sent an empty message', () => {
    expect(apiErrorMessage({ status: 400, data: { error: '' } }, 'Failed to save')).toBe('Failed to save');
  });
  it('falls back when the error field is not text', () => {
    expect(apiErrorMessage({ status: 500, data: { error: { code: 'X' } } }, 'Failed to save')).toBe('Failed to save');
  });
  it('falls back for a network failure with no body', () => {
    expect(
      apiErrorMessage({ status: 'FETCH_ERROR', error: 'TypeError: Failed to fetch' }, 'Failed to save'),
    ).toBe('Failed to save');
  });
  it('falls back for null, undefined and a thrown Error', () => {
    expect(apiErrorMessage(null, 'Failed')).toBe('Failed');
    expect(apiErrorMessage(undefined, 'Failed')).toBe('Failed');
    expect(apiErrorMessage(new Error('boom'), 'Failed')).toBe('Failed');
  });
});
