import { expect } from '@playwright/test';
import { Then } from '../../common/bdd';

// =============================================================================
// Protected Route Access Steps
// =============================================================================

Then('I should be able to access the following routes:', async ({ page }, dataTable) => {
  const routes = dataTable.raw().map(row => row[0]);

  for (const route of routes) {
    await page.goto(route);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain(route);
    await expect(page.getByRole('heading', { name: /Sign in to your account|Inicia sesión en tu cuenta/i })).toHaveCount(0);
  }
});
