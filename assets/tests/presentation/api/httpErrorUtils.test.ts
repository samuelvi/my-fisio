import { describe, expect, it } from 'vitest';
import { isNetworkError, isUnauthorizedError } from '../../../presentation/api/utils/httpErrorUtils';

describe('httpErrorUtils', () => {
  it('detects unauthorized errors from HTTP status', () => {
    expect(isUnauthorizedError({ response: { status: 401 } })).toBe(true);
    expect(isUnauthorizedError({ response: { status: 500 } })).toBe(false);
  });

  it('detects network errors by response absence and known codes', () => {
    expect(isNetworkError({ response: null })).toBe(true);
    expect(isNetworkError({ response: { status: 422 }, code: 'ERR_NETWORK' })).toBe(true);
    expect(isNetworkError({ response: { status: 422 }, code: 'ERR_BAD_RESPONSE' })).toBe(false);
  });
});
