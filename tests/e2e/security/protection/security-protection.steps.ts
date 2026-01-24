import { expect } from '@playwright/test';
import { Given, Then } from '../../common/bdd';

// =============================================================================
// Unauthenticated State Steps
// =============================================================================

Given('I am not logged in', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem('token');
  });
});

// =============================================================================
// Route Protection Assertions
// =============================================================================

Then('I should be redirected to login when accessing:', async ({ page }, dataTable) => {
  const routes = dataTable.raw().map(row => row[0]);

  for (const route of routes) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  }
});
