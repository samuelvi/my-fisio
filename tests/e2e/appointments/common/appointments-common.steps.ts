import { expect } from '@playwright/test';
import { Given, When, Then } from '../../common/bdd';

// =============================================================================
// Calendar Setup
// =============================================================================

Given('the calendar is loaded', async ({ page }) => {
  await page.waitForSelector('.fc');
});

Given('I should see a heading matching {string}', async ({ page }, pattern: string) => {
  await expect(page.getByRole('heading', { name: new RegExp(pattern, 'i') })).toBeVisible();
});

// =============================================================================
// Appointment Form Steps (shared)
// =============================================================================

When('I click the new appointment button', async ({ page }) => {
  await page.getByTestId('new-appointment-btn').click();
});

When('I click on the appointment {string} in the calendar', async ({ page }, titleText: string) => {
  const event = page.locator('.fc-event').filter({ hasText: titleText }).first();
  await expect(event).toBeVisible({ timeout: 10000 });
  await event.click({ force: true });
});

When('I click the delete appointment button', async ({ page }) => {
  await page.locator('button[title*="Delete"], button[title*="Borrar"]').click();
});

When('I confirm the deletion', async ({ page }) => {
  const confirmBtn = page.getByRole('button', { name: /Borrar|Delete/i }).last();
  await confirmBtn.click();
});

// =============================================================================
// Calendar Assertions (shared)
// =============================================================================

Then('the appointment {string} should appear in the calendar', async ({ page }, titleText: string) => {
  await expect(page.locator('.fc-event').filter({ hasText: titleText }).first()).toBeVisible({ timeout: 15000 });
});

Then('the appointment {string} should not appear in the calendar', async ({ page }, titleText: string) => {
  await expect(page.locator('.fc-event').filter({ hasText: titleText })).toHaveCount(0);
});
