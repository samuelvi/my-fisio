import { expect } from '@playwright/test';
import { When, Then } from '../../common/bdd';
import { CalendarHelper } from '../../common/helpers/calendar.helper';

// =============================================================================
// Appointment Form Steps (calendar-specific)
// =============================================================================

When('I fill the appointment form with:', async ({ page }, dataTable) => {
  const rows = dataTable.rowsHash();

  if (rows['Title']) {
    await page.getByLabel(/Title|T.tulo/i).fill(rows['Title']);
  }

  if (rows['Type']) {
    const typeLabel = rows['Type'] === 'Appointment' ? /Appointment|Cita/i :
                      rows['Type'] === 'Other' ? /Other|Otro/i : new RegExp(rows['Type'], 'i');
    // Using getByLabel might click the input associated with the label.
    // If it's a radio button or similar, getByLabel should work.
    // If it's a custom component where label is separate, we might need more care.
    // Assuming standard accessible form controls.
    // Since the input might be sr-only (visually hidden) for custom styling, we force the click.
    await page.getByLabel(typeLabel).click({ force: true });
  }

  if (rows['Notes']) {
    await page.getByLabel(/Notes|Notas/i).fill(rows['Notes']);
  }
});

When('I set the appointment start time to today at {int}:{int}', async ({ page }, hour: number, minute: number) => {
  const dateTime = await buildLocalDateTime(page, { hour, minute });
  const input = page.getByLabel(/Start|Inicio/i);
  await input.fill(dateTime.picker);
  await input.press('Enter');
});

When('I set the appointment end time to today at {int}:{int}', async ({ page }, hour: number, minute: number) => {
  const dateTime = await buildLocalDateTime(page, { hour, minute });
  const input = page.getByLabel(/End|Fin/i);
  await input.fill(dateTime.picker);
  await input.press('Enter');
});

When('I save the appointment', async ({ page }) => {
  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('/api/appointments') &&
      ['POST', 'PUT'].includes(response.request().method()) &&
      [200, 201].includes(response.status())
    ),
    page.getByTestId('save-appointment-btn').click(),
  ]);
  // Use a more generic check for modal/overlay disappearance
  // If the overlay has no role, we might need a test id or fallback to locator if it's structural.
  // Using getByRole('dialog') is preferred if available.
  // If not, we might check that the form is hidden.
  // The original checked .fixed.inset-0. Let's try checking if the form is hidden or dialog is hidden.
  // Or check if the "New Appointment" heading is hidden.
  await expect(page.getByRole('heading', { name: /New Appointment|Nueva Cita/i })).toBeHidden({ timeout: 10000 });
});

// =============================================================================
// Calendar Assertions (calendar-specific)
// =============================================================================

Then('the appointment {string} should be scheduled for today', async ({ page }, titleText: string) => {
  const slotInfo = await CalendarHelper.getEventSlotInfo(page, titleText);
  const today = await page.evaluate(() => {
    const date = new Date();
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  });
  expect(slotInfo?.date).toBe(today);
});

// =============================================================================
// Helper Functions
// =============================================================================

async function buildLocalDateTime(page, { hour, minute }: { hour: number; minute: number }) {
  return await page.evaluate(({ hour, minute }) => {
    const pad = (num: number) => String(num).padStart(2, '0');
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const date = new Date(year, month - 1, day, hour, minute, 0, 0);
    const locale = localStorage.getItem('app_locale') === 'es' ? 'es-ES' : 'en-US';
    return {
      isoLocal: `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}`,
      picker: date.toLocaleString(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: 'numeric',
        minute: '2-digit',
        hour12: locale === 'en-US',
      }),
      dateKey: `${year}-${pad(month)}-${pad(day)}`,
    };
  }, { hour, minute });
}

