import { expect } from '@playwright/test';
import { When, Then } from '../bdd';

// =============================================================================
// Common Search Steps
// =============================================================================

When('I click the clear button', async ({ page }) => {
  await page.click('button:has-text("Limpiar"), button:has-text("Clear")');
  await page.waitForLoadState('networkidle');
});

Then('the search field should be empty', async ({ page }) => {
  await expect(page.locator('input[type="text"]').first()).toHaveValue('');
});
