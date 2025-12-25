// @ts-check
import { test, expect } from '@playwright/test';

const protectedRoutes = [
  { path: '/dashboard', title: 'Total Patients', level: 3 },
  { path: '/patients', title: 'Patients', level: 1 },
  { path: '/appointments', title: 'Clinic Calendar', level: 2 },
  { path: '/invoices', title: 'Invoices', level: 1 },
  { path: '/invoices/gaps', title: 'Invoice Number Gaps', level: 1 },
];

async function login(page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'tina@tinafisio.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
}

test('authenticated users can access protected routes', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('app_locale', 'en');
  });
  await login(page);

  for (const route of protectedRoutes) {
    await page.goto(route.path);
    await expect(page).toHaveURL(route.path);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { level: route.level, name: route.title })).toBeVisible();
  }
});
