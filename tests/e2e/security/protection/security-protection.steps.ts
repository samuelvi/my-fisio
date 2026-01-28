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
    
    // The critical security requirement is that the user is redirected to /login
    // We wait for the URL to change to /login (with or without parameters)
    await expect(page).toHaveURL(/\/login/);
  }
});
