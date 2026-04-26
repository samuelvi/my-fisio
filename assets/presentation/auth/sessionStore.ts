export const AUTH_TOKEN_KEY = 'token';

export function getSessionToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function hasSessionToken(): boolean {
  return Boolean(getSessionToken());
}

export function setSessionToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearSessionToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}
