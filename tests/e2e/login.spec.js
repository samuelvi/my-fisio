/**
 * E2E Tests - Login Flow
 */

import { test, expect } from '@playwright/test';

test('has title and login works', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('app_locale', 'es');
  });
  await page.goto('/login');

  // Fill login form
  await page.fill('input[name="email"]', 'tina@tinafisio.com');
  await page.fill('input[name="password"]', 'password');
  
  await page.getByRole('button', { name: /Sign in|Entrar/i }).click();

  // Expect to be redirected to dashboard
  await page.waitForURL('**/dashboard', { timeout: 30000 });
  await page.waitForLoadState('networkidle');
});

test('failed login shows error and does not redirect', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('app_locale', 'es');
  });
  await page.goto('/login');

  // Fill login form with invalid credentials
  await page.fill('input[name="email"]', 'wrong@user.com');
  await page.fill('input[name="password"]', 'wrongpassword');
  
  await page.getByRole('button', { name: /Sign in|Entrar/i }).click();

  // Expect to still be on login page
  await expect(page).toHaveURL(/\/login/);
  
  // Expect error message to be visible (regex for both languages)
  await expect(page.locator('body')).toContainText(/Invalid credentials|Credenciales inv.lidas/i);
  
  // Verify dashboard is NOT accessible directly (should redirect back to login if no token)
  await page.goto('/dashboard');
  await page.waitForURL(/\/login(\?expired=1)?/);
});