// @ts-check
import { test, expect } from '@playwright/test';

test.use({ timezoneId: 'Europe/Madrid' });

async function resetDbEmpty(request) {
  const response = await request.post('/api/test/reset-db-empty');
  expect(response.ok()).toBeTruthy();
}

async function login(page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'tina@tinafisio.com');
  await page.fill('input[name="password"]', 'password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('/dashboard');
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

function inputByLabel(page, label) {
  return page.locator(`label:has-text("${label}")`).locator('..').locator('input');
}

function textareaByLabel(page, label) {
  return page.locator(`label:has-text("${label}")`).locator('..').locator('textarea');
}

async function setInputValue(input, value) {
  await input.fill(value);
}

async function setDatePickerValue(page, label, value) {
  const input = inputByLabel(page, label);
  await setInputValue(input, value);
  await input.press('Enter');
  await expect(input).not.toHaveValue('');
}

async function buildLocalDateTime(page, { year, month, day, hour, minute }) {
  return await page.evaluate(({ year, month, day, hour, minute }) => {
    const pad = (num) => String(num).padStart(2, '0');
    const date = new Date(year, month - 1, day, hour, minute, 0, 0);
    return {
      isoLocal: `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}`,
      picker: date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
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
  const event = page.locator('.fc-event', { hasText: titleText }).first();
  await expect(event).toBeVisible();
  await event.click();
}

function formatSlotTime(hour, minute) {
  const normalizedHour = hour % 12 || 12;
  return `${normalizedHour}:${String(minute).padStart(2, '0')}`;
}

function formatTimeRange(start, end) {
  return `${formatSlotTime(start.hour, start.minute)} - ${formatSlotTime(end.hour, end.minute)}`;
}

function addMinutesToTime(hour, minute, minutesToAdd) {
  const totalMinutes = (hour * 60) + minute + minutesToAdd;
  const normalized = ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);
  return {
    hour: Math.floor(normalized / 60),
    minute: normalized % 60,
  };
}

async function parsePickerValue(page, value) {
  return await page.evaluate((inputValue) => {
    const date = new Date(inputValue);
    const pad = (num) => String(num).padStart(2, '0');
    return {
      dateKey: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
      hour: date.getHours(),
      minute: date.getMinutes(),
    };
  }, value);
}

async function diffMinutes(page, startValue, endValue) {
  return await page.evaluate(({ startValue, endValue }) => {
    const start = new Date(startValue);
    const end = new Date(endValue);
    return Math.round((end.getTime() - start.getTime()) / 60000);
  }, { startValue, endValue });
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

test('appointments calendar flow', async ({ page, request }) => {
  test.setTimeout(120000);

  await page.addInitScript(() => {
    localStorage.setItem('app_locale', 'en');
  });

  await resetDbEmpty(request);
  await login(page);

  await page.goto('/appointments');
  await expect(page.getByRole('heading', { name: 'Clinic Calendar' })).toBeVisible();

  const baseParts = await page.evaluate(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
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

  // 1) Create appointment with concrete data
  await page.getByRole('button', { name: 'New Appointment' }).click();
  await setInputValue(inputByLabel(page, 'Title'), 'Slot Test A');
  await page.locator('label', { hasText: 'Appointment' }).click();
  await setDatePickerValue(page, 'Start', baseStart.picker);
  await setDatePickerValue(page, 'End', baseEnd.picker);
  await setInputValue(textareaByLabel(page, 'Notes'), 'Initial notes');
  const createdStartValue = await inputByLabel(page, 'Start').inputValue();
  const createdEndValue = await inputByLabel(page, 'End').inputValue();
  const createdStartInfo = await parsePickerValue(page, createdStartValue);
  const createdEndInfo = await parsePickerValue(page, createdEndValue);
  const createdRange = formatTimeRange(createdStartInfo, createdEndInfo);

  const [createResponse] = await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('/api/appointments') &&
      response.request().method() === 'POST' &&
      response.status() === 201
    ),
    page.getByRole('button', { name: 'Create' }).click(),
  ]);
  const created = await createResponse.json();
  const appointmentId = created.id;
  await expect(page.locator('.fc-event', { hasText: 'Slot Test A' }).first()).toBeVisible();

  await page.reload();
  await expect(page.locator('.fc-event', { hasText: 'Slot Test A' }).first()).toBeVisible();

  const createdFetch = await getAppointment(page, appointmentId);
  expect(createdFetch.status).toBe(200);
  expect(createdFetch.data.title).toBe('Slot Test A');
  expect(createdFetch.data.notes).toBe('Initial notes');
  expect(createdFetch.data.type).toBe('appointment');
  const createdSlot = await getEventSlotInfo(page, 'Slot Test A');
  expect(createdSlot?.date).toBe(createdStartInfo.dateKey);
  expect(createdSlot?.timeText).toContain(createdRange);

  // 2) Modify all appointment data
  await openCalendarModal(page, 'Slot Test A');
  await setInputValue(inputByLabel(page, 'Title'), 'Slot Test B');
  await page.locator('label', { hasText: 'Other' }).click();

  const updatedParts = { ...baseParts, hour: 11, minute: 0 };
  const updatedStart = await buildLocalDateTime(page, updatedParts);
  const updatedEndParts = await addMinutesLocal(page, updatedParts, 75);
  const updatedEnd = await buildLocalDateTime(page, updatedEndParts);
  await setDatePickerValue(page, 'Start', updatedStart.picker);
  await setDatePickerValue(page, 'End', updatedEnd.picker);
  await setInputValue(textareaByLabel(page, 'Notes'), 'Updated notes');
  const updatedStartValue = await inputByLabel(page, 'Start').inputValue();
  const updatedEndValue = await inputByLabel(page, 'End').inputValue();
  const updatedStartInfo = await parsePickerValue(page, updatedStartValue);
  const updatedEndInfo = await parsePickerValue(page, updatedEndValue);
  const updatedRange = formatTimeRange(updatedStartInfo, updatedEndInfo);

  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes(`/api/appointments/${appointmentId}`) &&
      response.request().method() === 'PUT' &&
      response.status() === 200
    ),
    page.getByRole('button', { name: 'Update' }).click(),
  ]);

  await page.reload();
  await expect(page.locator('.fc-event', { hasText: 'Slot Test B' }).first()).toBeVisible();

  const updatedFetch = await getAppointment(page, appointmentId);
  expect(updatedFetch.status).toBe(200);
  expect(updatedFetch.data.title).toContain('Slot Test B');
  expect(updatedFetch.data.notes).toBe('Updated notes');
  expect(updatedFetch.data.type).toBe('other');
  const updatedSlot = await getEventSlotInfo(page, 'Slot Test B');
  expect(updatedSlot?.date).toBe(updatedStartInfo.dateKey);
  expect(updatedSlot?.timeText).toContain(updatedRange);

  await openCalendarModal(page, 'Slot Test B');
  await expect(inputByLabel(page, 'Title')).toHaveValue('Slot Test B');
  await expect(textareaByLabel(page, 'Notes')).toHaveValue('Updated notes');
  await expect(inputByLabel(page, 'Start')).toHaveValue(updatedStartValue);
  await expect(inputByLabel(page, 'End')).toHaveValue(updatedEndValue);
  await page.getByRole('button', { name: 'Cancel' }).click();

  // 3) Move appointment to another time slot (by editing dates)
  await openCalendarModal(page, 'Slot Test B');

  const movedParts = { ...baseParts, hour: 15, minute: 0 };
  const movedStart = await buildLocalDateTime(page, movedParts);
  const durationMinutes = await diffMinutes(page, updatedStartValue, updatedEndValue);
  const movedEndParts = await addMinutesLocal(page, movedParts, durationMinutes);
  const movedEnd = await buildLocalDateTime(page, movedEndParts);

  await setDatePickerValue(page, 'Start', movedStart.picker);
  await setDatePickerValue(page, 'End', movedEnd.picker);

  const movedStartValue = await inputByLabel(page, 'Start').inputValue();
  const movedEndValue = await inputByLabel(page, 'End').inputValue();
  const movedStartInfo = await parsePickerValue(page, movedStartValue);
  const movedEndInfo = await parsePickerValue(page, movedEndValue);
  const movedRange = formatTimeRange(movedStartInfo, movedEndInfo);

  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes(`/api/appointments/${appointmentId}`) &&
      response.request().method() === 'PUT' &&
      response.status() === 200
    ),
    page.getByRole('button', { name: 'Update' }).click(),
  ]);

  await page.reload();
  await expect(page.locator('.fc-event', { hasText: 'Slot Test B' }).first()).toBeVisible();

  const movedFetch = await getAppointment(page, appointmentId);
  expect(movedFetch.status).toBe(200);
  const movedSlot = await getEventSlotInfo(page, 'Slot Test B');
  expect(movedSlot?.date).toBe(movedStartInfo.dateKey);
  expect(movedSlot?.timeText).toContain(movedRange);

  // 4) Delete appointment and cancel
  await openCalendarModal(page, 'Slot Test B');
  await page.locator('button[title="Delete"]').click();
  await page.getByRole('button', { name: 'Cancel' }).last().click();

  await page.reload();
  await expect(page.locator('.fc-event', { hasText: 'Slot Test B' }).first()).toBeVisible();
  const cancelDeleteFetch = await getAppointment(page, appointmentId);
  expect(cancelDeleteFetch.status).toBe(200);

  // 5) Delete appointment and confirm
  await openCalendarModal(page, 'Slot Test B');
  await page.locator('button[title="Delete"]').click();
  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes(`/api/appointments/${appointmentId}`) &&
      response.request().method() === 'DELETE' &&
      response.status() === 204
    ),
    page.getByRole('button', { name: 'Delete' }).last().click(),
  ]);

  await page.reload();
  await expect(page.locator('.fc-event', { hasText: 'Slot Test B' })).toHaveCount(0);
  const deleteFetch = await getAppointment(page, appointmentId);
  expect(deleteFetch.status).toBe(404);
});
