import { expect } from '@playwright/test';
import { Given, When, Then } from '../../common/bdd';

type AppointmentDraftData = {
  title: string;
  notes: string;
  type: string;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  patientId: number | null;
};

const DEFAULT_APPOINTMENT_DRAFT_DATA: AppointmentDraftData = {
  title: 'Draft Appointment',
  notes: 'Draft notes',
  type: 'appointment',
  startsAt: '2030-01-15T09:00:00',
  endsAt: '2030-01-15T10:00:00',
  allDay: false,
  patientId: null,
};

Given('all appointment drafts are cleared', async ({ page }) => {
  await page.evaluate(() => {
    localStorage.removeItem('draft_appointment');
  });
});

Given('an appointment draft exists with savedByError true and data:', async ({ page }, dataTable) => {
  const rows = dataTable.rowsHash();
  const data = normalizeDraftRows(rows);

  await page.evaluate((draftData) => {
    localStorage.setItem(
      'draft_appointment',
      JSON.stringify({
        type: 'appointment',
        data: draftData,
        timestamp: Date.now(),
        formId: 'appointment-new',
        savedByError: true,
      })
    );

    window.dispatchEvent(
      new CustomEvent('draft:saved', {
        detail: {
          type: 'appointment',
          timestamp: Date.now(),
        },
      })
    );
  }, data);
});

When('I fill the appointment draft form with:', async ({ page }, dataTable) => {
  const rows = dataTable.rowsHash();

  if (rows.title) {
    await page.getByLabel(/Title|T.tulo/i).fill(rows.title);
  }

  if (rows.notes) {
    await page.getByLabel(/Notes|Notas/i).fill(rows.notes);
  }

  if (rows.type) {
    const typeLabel = rows.type === 'other' ? /Other|Otro/i : /Appointment|Cita/i;
    await page.getByLabel(typeLabel).click({ force: true });
  }
});

When('I click the restore appointment draft button', async ({ page }) => {
  await page.getByRole('button', { name: /Recuperar borrador|Restore draft/i }).first().click();
});

When('I confirm the appointment draft action', async ({ page }) => {
  await page.getByTestId('confirm-draft-btn').click();
  await expect(page.getByTestId('confirm-draft-btn')).toBeHidden();
});

Then('the appointment draft should exist', async ({ page }) => {
  await expect.poll(async () => {
    return await page.evaluate(() => localStorage.getItem('draft_appointment'));
  }).not.toBeNull();
});

Then('the appointment draft should not exist', async ({ page }) => {
  await expect.poll(async () => {
    return await page.evaluate(() => localStorage.getItem('draft_appointment'));
  }).toBeNull();
});

Then('the appointment draft should be marked as savedByError', async ({ page }) => {
  await expect.poll(async () => {
    const draft = await page.evaluate(() => localStorage.getItem('draft_appointment'));
    return draft ? JSON.parse(draft).savedByError : null;
  }).toBe(true);
});

Then('the appointment title field should have value {string}', async ({ page }, value: string) => {
  await expect(page.getByLabel(/Title|T.tulo/i)).toHaveValue(value);
});

Then('the appointment notes field should have value {string}', async ({ page }, value: string) => {
  await expect(page.getByLabel(/Notes|Notas/i)).toHaveValue(value);
});

function normalizeDraftRows(rows: Record<string, string>): AppointmentDraftData {
  const startsAt = rows.startsAt || DEFAULT_APPOINTMENT_DRAFT_DATA.startsAt;
  const endsAt = rows.endsAt || DEFAULT_APPOINTMENT_DRAFT_DATA.endsAt;
  const patientId = parsePatientId(rows.patientId);

  return {
    title: rows.title || DEFAULT_APPOINTMENT_DRAFT_DATA.title,
    notes: rows.notes || DEFAULT_APPOINTMENT_DRAFT_DATA.notes,
    type: rows.type || DEFAULT_APPOINTMENT_DRAFT_DATA.type,
    startsAt,
    endsAt,
    allDay: rows.allDay ? rows.allDay.toLowerCase() === 'true' : DEFAULT_APPOINTMENT_DRAFT_DATA.allDay,
    patientId,
  };
}

function parsePatientId(value: string | undefined): number | null {
  if (!value || value.trim() === '') {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}
