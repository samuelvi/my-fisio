import { expect } from '@playwright/test';
import { When, Then } from '../bdd';

// =============================================================================
// Common Search Steps
// =============================================================================

When('I click the clear button', async ({ page }) => {
  await page.getByRole('button', { name: /Limpiar|Clear/i }).click();
  await page.waitForLoadState('networkidle');
});

Then('the search field should be empty', async ({ page }) => {
  // Assuming the search field is the first textbox.
  // If possible, we should refine this with a label or placeholder if known.
  // But given it's a "Common" step, it might be used in contexts where the label varies.
  // However, usually search inputs have a "Search" label or placeholder.
  // I will use getByRole('textbox').first() to match the original behavior of locator('input...').first().
  await expect(page.getByRole('textbox').first()).toHaveValue('');
});
