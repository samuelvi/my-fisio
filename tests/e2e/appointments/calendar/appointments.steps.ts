import { expect } from '@playwright/test';
import { When, Then } from '../../common/bdd';

// =============================================================================
// Appointment Form Steps (calendar-specific)
// =============================================================================

When('I fill the appointment form with:', async ({ page }, dataTable) => {
  const rows = dataTable.rowsHash();

  if (rows['Title']) {
    const titleInput = page.locator('label').filter({ hasText: /Title|T.tulo/i }).locator('..').locator('input');
    await titleInput.fill(rows['Title']);
  }

  if (rows['Type']) {
    const typeLabel = rows['Type'] === 'Appointment' ? /Appointment|Cita/i :
                      rows['Type'] === 'Other' ? /Other|Otro/i : new RegExp(rows['Type'], 'i');
    await page.locator('label').filter({ hasText: typeLabel }).click();
  }

  if (rows['Notes']) {
    const notesTextarea = page.locator('label').filter({ hasText: /Notes|Notas/i }).locator('..').locator('textarea');
    await notesTextarea.fill(rows['Notes']);
  }
});

When('I set the appointment start time to today at {int}:{int}', async ({ page }, hour: number, minute: number) => {
  const dateTime = await buildLocalDateTime(page, { hour, minute });
  const input = page.locator('label').filter({ hasText: /Start|Inicio/i }).locator('..').locator('input');
  await input.fill(dateTime.picker);
  await input.press('Enter');
  await page.waitForTimeout(500);
});

When('I set the appointment end time to today at {int}:{int}', async ({ page }, hour: number, minute: number) => {
  const dateTime = await buildLocalDateTime(page, { hour, minute });
  const input = page.locator('label').filter({ hasText: /End|Fin/i }).locator('..').locator('input');
  await input.fill(dateTime.picker);
  await input.press('Enter');
  await page.waitForTimeout(500);
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
  await expect(page.locator('.fixed.inset-0')).toBeHidden({ timeout: 10000 });
  await page.waitForTimeout(2000);
});

// =============================================================================
// Calendar Assertions (calendar-specific)
// =============================================================================

Then('the appointment {string} should be scheduled for today', async ({ page }, titleText: string) => {
  const slotInfo = await getEventSlotInfo(page, titleText);
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

async function getEventSlotInfo(page, titleText: string) {
  return await page.evaluate((title) => {
    const eventEl = Array.from(document.querySelectorAll('.fc-event'))
      .find((el) => el.textContent && el.textContent.includes(title));
    if (!eventEl) return null;
    const timeEl = eventEl.querySelector('.fc-event-time');
    const timeText = (timeEl?.textContent || eventEl.textContent || '').trim();
    const column = eventEl.closest('.fc-timegrid-col');
    return {
      timeText,
      date: column?.getAttribute('data-date') || null,
    };
  }, titleText);
}
