/**
 * E2E Test Helpers - Authentication
 */

import { Page, BrowserContext, expect } from '@playwright/test';

/**
 * Login as admin user (tina@tinafisio.com) bypassing the UI form for speed and stability.
 */
export async function loginAsAdmin(page: Page, context: BrowserContext): Promise<void> {
  // 1. Get token via API using context request
  const loginResponse = await context.request.post('/api/login_check', {
    data: {
      username: 'tina@tinafisio.com',
      password: 'password'
    }
  });
  
  if (!loginResponse.ok()) {
    throw new Error(`Login API failed with status ${loginResponse.status()}`);
  }
  
  const { token } = await loginResponse.json();

  // 2. Inject token and locale into EVERY page in this context
  await context.addInitScript(({ jwt }) => {
    localStorage.setItem('token', jwt);
    localStorage.setItem('app_locale', 'es');
  }, { jwt: token });

  // 3. Navigate directly to dashboard
  await page.goto('/dashboard');
  await page.waitForURL('**/dashboard', { timeout: 30000 });
  await expect(page.locator('body')).toContainText(/Bienvenido|Welcome/i, { timeout: 30000 });
  await page.waitForLoadState('networkidle');
}
