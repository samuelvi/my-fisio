// @ts-check
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './common/auth';

const protectedRoutes = [
  '/dashboard',
  '/patients',
  '/patients/new',
  '/appointments',
  '/invoices',
  '/customers',
];

test('authenticated users can access protected routes', async ({ page, context }) => {
  await loginAsAdmin(page, context);

  for (const route of protectedRoutes) {
    await page.goto(route);
    await page.waitForLoadState('networkidle');
    // Ensure we are not redirected back to login
    expect(page.url()).toContain(route);
    await expect(page.getByRole('heading', { name: /Sign in to your account|Inicia sesión en tu cuenta/i })).toHaveCount(0);
  }
});
