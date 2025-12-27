// @ts-check
import { test, expect } from '@playwright/test';

async function resetDb(request) {
  // Use standard reset-db to have some patients
  const response = await request.post('/api/test/reset-db');
  expect(response.ok()).toBeTruthy();
}

async function login(page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'tina@tinafisio.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
}

test('patient search is case-insensitive', async ({ page, request }) => {
  await page.addInitScript(() => {
    localStorage.setItem('app_locale', 'en');
  });

  await resetDb(request);
  await login(page);

  await page.goto('/patients');

  // Search for "afirst" (lowercase) which should match "AFirst Patient"
  await page.fill('input[placeholder*="Search"]', 'afirst');
  // Wait for network request
  await page.waitForResponse(resp => resp.url().includes('/api/patients') && resp.url().includes('search=afirst'));
  
  // Expect to find the patient
  await expect(page.getByText('AFirst Patient')).toBeVisible();

  // Search for "zlast" (lowercase) which should match "ZLast Patient"
  await page.fill('input[placeholder*="Search"]', 'zlast');
  await page.waitForResponse(resp => resp.url().includes('/api/patients') && resp.url().includes('search=zlast'));
  
  await expect(page.getByText('ZLast Patient')).toBeVisible();
});
