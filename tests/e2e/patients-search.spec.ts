// @ts-check
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './common/auth';

async function resetDb(request) {
  const response = await request.post('/api/test/reset-db');
  expect(response.ok()).toBeTruthy();
}

test.describe('Patient Search', () => {
  test.beforeEach(async ({ page, request, context }) => {
    await resetDb(request);
    await loginAsAdmin(page, context);
  });

  test('normal search is case-insensitive', async ({ page }) => {
    await page.goto('/patients');
    await page.locator('input[type="text"]').first().fill('afirst');
    await page.locator('button[type="submit"]').first().click();
    
    await expect(page.getByText('AFirst Patient').first()).toBeVisible();
  });

  test('search without accent finds accented name', async ({ page }) => {
    await page.goto('/patients');
    await page.locator('input[type="text"]').first().fill('jose');
    await page.locator('button[type="submit"]').first().click();
    
    await expect(page.getByText('José García').first()).toBeVisible();
  });

  test('clear button resets search', async ({ page }) => {
    await page.goto('/patients');
    await page.locator('input[type="text"]').first().fill('jose');
    await page.locator('button[type="submit"]').first().click();
    
    await expect(page.locator('tbody tr:not(:has-text("No patients found"))')).toHaveCount(1);

    await page.click('button:has-text("Limpiar"), button:has-text("Clear")');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('input[type="text"]').first()).toHaveValue('');
    // Base fixtures have 15 patients
    await expect(page.locator('tbody tr:not(:has-text("No patients found"))')).toHaveCount(4);
  });
});