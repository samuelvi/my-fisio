/**
 * E2E Test Helpers - Authentication
 */

import { Page, BrowserContext, expect } from '@playwright/test';
import { AUTH_CREDENTIALS } from './constants';

/**
 * Login as admin user bypassing the UI form for speed and stability.
 */
export async function loginAsAdmin(page: Page, _context: BrowserContext): Promise<void> {
  await page.goto('/login');

  await page.locator('input[type="email"]').first().fill(AUTH_CREDENTIALS.username);
  await page.locator('input[type="password"]').first().fill(AUTH_CREDENTIALS.password);
  await page.getByRole('button', { name: /Sign In|Iniciar sesi[oó]n|Entrar|Login/i }).first().click();

  await page.waitForURL('**/dashboard', { timeout: 30000 });
  await expect(page.locator('body')).toContainText(/Bienvenido|Welcome/i, { timeout: 30000 });
  await page.waitForLoadState('networkidle');
}
