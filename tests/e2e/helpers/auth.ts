/**
 * E2E Test Helpers - Authentication
 */

import { Page, BrowserContext, expect } from '@playwright/test';

/**
 * Login as admin user (tina@tinafisio.com) bypassing the UI form for speed and stability.
 */
export async function loginAsAdmin(page: Page, context: BrowserContext): Promise<void> {
  // 1. Get token via API
  const loginResponse = await page.request.post('/api/login_check', {
    data: {
      username: 'tina@tinafisio.com',
      password: 'password'
    }
  });
  
  if (!loginResponse.ok()) {
    throw new Error(`Login API failed with status ${loginResponse.status()}`);
  }
  
  const { token } = await loginResponse.json();

  // 2. Set token and locale in localStorage before any navigation
  await page.addInitScript(({ jwt }) => {
    localStorage.setItem('token', jwt);
    localStorage.setItem('app_locale', 'es');
  }, { jwt: token });

  // 3. Navigate to dashboard
  await page.goto('/dashboard');
  await page.waitForURL('**/dashboard', { timeout: 30000 });
}