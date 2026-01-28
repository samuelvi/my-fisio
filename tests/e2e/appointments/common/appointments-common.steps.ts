import { expect } from '@playwright/test';
import { Given, When, Then } from '../../common/bdd';
import { CalendarHelper } from '../../common/helpers/calendar.helper';

// =============================================================================
// Calendar Setup
// =============================================================================

Given('the calendar is loaded', async ({ page }) => {
  // Using a specific role or text that confirms calendar presence would be better than .fc,
  // but if .fc is the only way, we keep it or better, expect a specific calendar view element.
  // For now, let's stick to .fc as it's an internal implementation detail of FullCalendar.
  // Ideally, we should wait for a day header or time grid.
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
  await CalendarHelper.clickEvent(page, titleText);
});

When('I click the delete appointment button', async ({ page }) => {
  await page.getByRole('button', { name: /Delete|Borrar/i }).click();
});

When('I confirm the deletion', async ({ page }) => {
  const confirmBtn = page.getByRole('button', { name: /Borrar|Delete/i }).last();
  await confirmBtn.click();
});

// =============================================================================
// Calendar Assertions (shared)
// =============================================================================

Then('the appointment {string} should appear in the calendar', async ({ page }, titleText: string) => {
  await CalendarHelper.verifyEventVisible(page, titleText);
});

Then('the appointment {string} should not appear in the calendar', async ({ page }, titleText: string) => {
  await CalendarHelper.verifyEventHidden(page, titleText);
});
