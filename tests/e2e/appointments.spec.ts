// @ts-check
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './common/auth';

test.use({ timezoneId: 'Europe/Madrid' });

async function resetDbEmpty(request) {
  const response = await request.post('/api/test/reset-db-empty');
  expect(response.ok()).toBeTruthy();
}

async function apiFetch(page, url, options = {}) {
  return await page.evaluate(async ({ url, options }) => {
    const token = localStorage.getItem('token');
    const headers = {
      Accept: 'application/ld+json',
      ...(options.headers || {}),
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const response = await fetch(url, {
      ...options,
      headers,
    });
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('json') ? await response.json() : await response.text();
    return {
      status: response.status,
      data,
      contentType,
    };
  }, { url, options });
}

async function getAppointment(page, id) {
  return apiFetch(page, `/api/appointments/${id}`);
}

function inputByLabel(page, labelRegex) {
  return page.locator('label').filter({ hasText: labelRegex }).locator('..').locator('input');
}

function textareaByLabel(page, labelRegex) {
  return page.locator('label').filter({ hasText: labelRegex }).locator('..').locator('textarea');
}

async function setInputValue(input, value) {
  await input.fill(value);
}

async function setDatePickerValue(page, labelRegex, value) {
  const input = inputByLabel(page, labelRegex);
  await setInputValue(input, value);
  await input.press('Enter');
  await page.waitForTimeout(500);
}

async function buildLocalDateTime(page, { year, month, day, hour, minute }) {
  return await page.evaluate(({ year, month, day, hour, minute }) => {
    const pad = (num) => String(num).padStart(2, '0');
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
  }, { year, month, day, hour, minute });
}

async function addMinutesLocal(page, { year, month, day, hour, minute }, minutesToAdd) {
  return await page.evaluate(({ year, month, day, hour, minute, minutesToAdd }) => {
    const date = new Date(year, month - 1, day, hour, minute, 0, 0);
    date.setMinutes(date.getMinutes() + minutesToAdd);
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
    };
  }, { year, month, day, hour, minute, minutesToAdd });
}

async function openCalendarModal(page, titleText) {
  const event = page.locator('.fc-event').filter({ hasText: titleText }).first();
  await expect(event).toBeVisible({ timeout: 10000 });
  await event.click({ force: true });
}

function formatSlotTime(hour, minute) {
  const normalizedHour = hour % 12 || 12;
  return `${normalizedHour}:${String(minute).padStart(2, '0')}`;
}

function formatTimeRange(start, end) {
  return `${formatSlotTime(start.hour, start.minute)} - ${formatSlotTime(end.hour, end.minute)}`;
}

async function parsePickerValue(page, value) {
  return await page.evaluate((inputValue) => {
    // Attempt to parse Spanish format DD/MM/YYYY or English MM/DD/YYYY
    const parts = inputValue.split(/[/\s,:]+/);
    let date;
    if (localStorage.getItem('app_locale') === 'es') {
        // ES: [DD, MM, YYYY, HH, mm]
        date = new Date(parts[2], parts[1] - 1, parts[0], parts[3], parts[4]);
    } else {
        date = new Date(inputValue);
    }
    const pad = (num) => String(num).padStart(2, '0');
    return {
      dateKey: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
      hour: date.getHours(),
      minute: date.getMinutes(),
    };
  }, value);
}

async function diffMinutes(page, startValue, endValue) {
  const start = await parsePickerValue(page, startValue);
  const end = await parsePickerValue(page, endValue);
  
  return await page.evaluate(({ s, e }) => {
      const d1 = new Date(2000, 0, 1, s.hour, s.minute);
      const d2 = new Date(2000, 0, 1, e.hour, e.minute);
      return Math.round((d2.getTime() - d1.getTime()) / 60000);
  }, { s: start, e: end });
}

async function getEventSlotInfo(page, titleText) {
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

test('appointments calendar flow', async ({ page, request, context }) => {
  test.setTimeout(120000);

  await resetDbEmpty(request);
  await loginAsAdmin(page, context);

  await page.goto('/appointments');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: /Clinic Calendar|Calendario de la Cl.nica/i })).toBeVisible();

  const baseParts = await page.evaluate(() => {
    const date = new Date();
    date.setHours(9, 0, 0, 0);
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour: 9,
      minute: 0,
    };
  });
  const baseStart = await buildLocalDateTime(page, baseParts);
  const baseEndParts = await addMinutesLocal(page, baseParts, 60);
  const baseEnd = await buildLocalDateTime(page, baseEndParts);
  const baseRange = formatTimeRange(baseParts, baseEndParts);

  // 1. Create a New Appointment
  await page.getByTestId('new-appointment-btn').click();
  await expect(page.getByRole('heading', { name: /New Appointment|Nueva Cita/i })).toBeVisible();
  await setInputValue(inputByLabel(page, /Title|T.tulo/i), 'Slot Test A');
  await page.locator('label').filter({ hasText: /Appointment|Cita/i }).click();
  await setDatePickerValue(page, /Start|Inicio/i, baseStart.picker);
  await setDatePickerValue(page, /End|Fin/i, baseEnd.picker);
  await setInputValue(textareaByLabel(page, /Notes|Notas/i), 'Initial notes');
  
  const createdStartValue = await inputByLabel(page, /Start|Inicio/i).inputValue();
  const createdStartInfo = await parsePickerValue(page, createdStartValue);
  const createdRange = formatTimeRange(createdStartInfo, addMinutesToTime(createdStartInfo.hour, createdStartInfo.minute, 60));

  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('/api/appointments') &&
      response.request().method() === 'POST' &&
      response.status() === 201
    ),
    page.getByTestId('save-appointment-btn').click(),
  ]);

  await expect(page.locator('.fixed.inset-0')).toBeHidden({ timeout: 10000 });
  await page.waitForTimeout(2000);
  await expect(page.locator('.fc-event').filter({ hasText: 'Slot Test A' }).first()).toBeVisible({ timeout: 15000 });

  const createdSlot = await getEventSlotInfo(page, 'Slot Test A');
  expect(createdSlot?.date).toBe(createdStartInfo.dateKey);

  // 2) Modify all appointment data
  await openCalendarModal(page, 'Slot Test A');
  await setInputValue(inputByLabel(page, /Title|T.tulo/i), 'Slot Test B');
  await page.locator('label').filter({ hasText: /Other|Otro/i }).click();

  const updatedParts = { ...baseParts, hour: 11, minute: 0 };
  const updatedStart = await buildLocalDateTime(page, updatedParts);
  const updatedEndParts = await addMinutesLocal(page, updatedParts, 75);
  const updatedEnd = await buildLocalDateTime(page, updatedEndParts);
  await setDatePickerValue(page, /Start|Inicio/i, updatedStart.picker);
  await setDatePickerValue(page, /End|Fin/i, updatedEnd.picker);
  
  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('/api/appointments/') &&
      response.request().method() === 'PUT' &&
      response.status() === 200
    ),
    page.getByTestId('save-appointment-btn').click(),
  ]);

  await page.reload();
  await expect(page.locator('.fc-event').filter({ hasText: 'Slot Test B' }).first()).toBeVisible();

  // 5) Delete appointment and confirm
  await openCalendarModal(page, 'Slot Test B');
  await page.locator('button[title*="Delete"], button[title*="Borrar"]').click();
  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('/api/appointments/') &&
      response.request().method() === 'DELETE' &&
      response.status() === 204
    ),
    page.getByRole('button', { name: /Delete|Borrar/i }).last().click(),
  ]);

  await expect(page.locator('.fc-event').filter({ hasText: 'Slot Test B' })).toHaveCount(0);
});

function addMinutesToTime(hour, minute, minutesToAdd) {
  const totalMinutes = (hour * 60) + minute + minutesToAdd;
  const normalized = ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);
  return {
    hour: Math.floor(normalized / 60),
    minute: normalized % 60,
  };
}