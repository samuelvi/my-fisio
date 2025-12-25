// @ts-check
import { test, expect } from '@playwright/test';

// test.beforeEach(async ({ request }) => {
//   // Reset Database before each test
//   const response = await request.post('/api/test/reset-db');
//   expect(response.ok()).toBeTruthy();
// });

test('has title and login works', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('app_locale', 'en');
  });
  await page.goto('/login');

  // Fill login form
  await page.fill('input[name="email"]', 'tina@tinafisio.com');
  await page.fill('input[name="password"]', 'password');
  
  await page.click('button[type="submit"]');

  // Expect to be redirected to dashboard
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('text=Dashboard')).toBeVisible();
});

test('failed login shows error and does not redirect', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('app_locale', 'en');
  });
  await page.goto('/login');

  // Fill login form with invalid credentials
  await page.fill('input[name="email"]', 'wrong@user.com');
  await page.fill('input[name="password"]', 'wrongpassword');
  
  await page.click('button[type="submit"]');

  // Expect to still be on login page
  await expect(page).toHaveURL('/login');
  
  // Expect error message to be visible
  await expect(page.locator('text=Invalid credentials')).toBeVisible();
  
  // Verify dashboard is NOT accessible directly (should redirect back to login if no token)
  await page.goto('/dashboard');
  await expect(page).toHaveURL('/login');
});
