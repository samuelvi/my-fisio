// @ts-check
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

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
    const body = await page.locator('body').textContent();
    expect(body).not.toContain('Sign in to your account');
    expect(body).not.toContain('Inicia sesión en tu cuenta');
  }
});