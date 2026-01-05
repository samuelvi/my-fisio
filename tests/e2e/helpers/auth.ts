/**
 * E2E Test Helpers - Authentication
 */

import { Page, BrowserContext, expect } from '@playwright/test';

/**
 * Login as admin user (tina@tinafisio.com)
 */
export async function loginAsAdmin(page: Page, context: BrowserContext): Promise<void> {
  // Set locale before navigating
  await page.addInitScript(() => {
    localStorage.setItem('app_locale', 'en');
  });

  await page.goto('/login');
  await page.fill('input[name="email"]', 'tina@tinafisio.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
}
