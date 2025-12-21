// @ts-check
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ request }) => {
  // Reset Database before each test
  const response = await request.post('/api/test/reset-db');
  expect(response.ok()).toBeTruthy();
});

test('has title and login works', async ({ page }) => {
  await page.goto('/login');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Physio Clinic Manager/);

  // Fill login form
  await page.fill('input[name="email"]', 'admin@example.com');
  await page.fill('input[name="password"]', 'password');
  
  await page.click('button[type="submit"]');

  // Expect to be redirected to dashboard
  await expect(page).toHaveURL('/');
  await expect(page.locator('text=Welcome back')).toBeVisible();
});
