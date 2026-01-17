// @ts-check
import { test, expect } from '@playwright/test';

const protectedRoutes = [
  '/dashboard',
  '/patients',
  '/appointments',
  '/invoices',
  '/invoices/gaps',
];

test('unauthenticated users cannot access protected routes', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem('token');
  });

  for (const route of protectedRoutes) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  }
});
