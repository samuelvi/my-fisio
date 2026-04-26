import { beforeEach, describe, expect, it } from 'vitest';
import {
  AUTH_TOKEN_KEY,
  clearSessionToken,
  getSessionToken,
  hasSessionToken,
  setSessionToken,
} from '../../../presentation/auth/sessionStore';

describe('sessionStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores and reads JWT token', () => {
    setSessionToken('jwt-token');

    expect(getSessionToken()).toBe('jwt-token');
    expect(hasSessionToken()).toBe(true);
  });

  it('clears JWT token', () => {
    localStorage.setItem(AUTH_TOKEN_KEY, 'jwt-token');

    clearSessionToken();

    expect(getSessionToken()).toBeNull();
    expect(hasSessionToken()).toBe(false);
  });
});
