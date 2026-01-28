import { expect } from '@playwright/test';
import { Given, When, Then, test } from '../../common/bdd';
import { patientFactory } from '../../factories/patient.factory';
import { recordFactory } from '../../factories/record.factory';

// Store patient ID for the test session
let testPatientId: string;

// =============================================================================
// Patient Setup Steps
// =============================================================================

Given('a test patient exists for records', async ({ page, request }) => {
  // Reset DB
  await request.post('/api/test/reset-db-empty');

  // Create a patient to add records to
  const token = await page.evaluate(() => localStorage.getItem('token'));
  const testPatient = patientFactory.build();
  
  const createResponse = await request.post('/api/patients', {
    headers: {
      'Content-Type': 'application/ld+json',
      'Authorization': `Bearer ${token}`
    },
    data: {
      firstName: testPatient.firstName,
      lastName: testPatient.lastName,
      allergies: testPatient.allergies
    }
  });
  const patient = await createResponse.json();
  testPatientId = patient.id;
});

// =============================================================================
// Draft Setup Steps
// =============================================================================

Given('all record drafts are cleared', async ({ page }) => {
  await page.addInitScript(() => {
    Object.keys(localStorage)
      .filter(key => key.startsWith('draft_'))
      .forEach(key => localStorage.removeItem(key));
  });
});

Given('a record draft exists with savedByError true for test patient', async ({ page }) => {
  const patientId = testPatientId;
  const record = recordFactory.build({ consultationReason: 'Reload Test', patient: `/api/patients/${patientId}` });
  
  await page.addInitScript((data) => {
    localStorage.setItem('draft_record', JSON.stringify({
      type: 'record',
      data: data,
      timestamp: Date.now(),
      formId: 'test-123',
      savedByError: true
    }));
  }, record);
});

Given('a record draft exists with savedByError true and data for test patient:', async ({ page }, dataTable) => {
  const rows = dataTable.rowsHash();
  const patientId = testPatientId;
  await page.addInitScript((args) => {
    const { data, pid } = args;
    localStorage.setItem('draft_record', JSON.stringify({
      type: 'record',
      data: { ...data, patient: `/api/patients/${pid}` },
      timestamp: Date.now(),
      formId: 'test-123',
      savedByError: true
    }));
  }, { data: rows, pid: patientId });
});

// =============================================================================
// Navigation Steps
// =============================================================================

When('I navigate to the new record page for the test patient', async ({ page }) => {
  await page.goto(`/patients/${testPatientId}/records/new`);
  await page.waitForLoadState('networkidle');
});

// =============================================================================
// Record Form Actions
// =============================================================================

When('I fill the record treatment with {string}', async ({ page }, value: string) => {
  await page.getByTestId('record-physiotherapyTreatment').fill(value);
});

When('I fill the record draft form with:', async ({ page }, dataTable) => {
  const rows = dataTable.rowsHash();

  if (rows.consultationReason) {
    await page.getByTestId('record-consultationReason').fill(rows.consultationReason);
  }
  if (rows.physiotherapyTreatment) {
    await page.getByTestId('record-physiotherapyTreatment').fill(rows.physiotherapyTreatment);
  }
});

When('I click the save record draft button', async ({ page }) => {
  await page.getByTestId('save-record-btn').click();
});

When('I click the restore record draft button', async ({ page }) => {
  await page.getByRole('button', { name: /Recuperar borrador|Restore draft/i }).click();
});

When('I confirm the record draft restoration', async ({ page }) => {
  await page.getByTestId('confirm-draft-btn').click();
  await expect(page.getByTestId('confirm-draft-btn')).toBeHidden({ timeout: 10000 });
});

// =============================================================================
// Record Draft Assertions
// =============================================================================

Then('the record draft should not exist', async ({ page }) => {
  const draftData = await page.evaluate(() => localStorage.getItem('draft_record'));
  expect(draftData).toBeNull();
});

Then('the record draft should exist', async ({ page }) => {
  const draftData = await page.evaluate(() => localStorage.getItem('draft_record'));
  expect(draftData).not.toBeNull();
});

Then('the record draft should have treatment {string}', async ({ page }, expectedTreatment: string) => {
  const draftData = await page.evaluate(() => {
    const data = localStorage.getItem('draft_record');
    return data ? JSON.parse(data) : null;
  });
  expect(draftData).not.toBeNull();
  expect(draftData.data.physiotherapyTreatment).toBe(expectedTreatment);
});

Then('the record draft should be marked as savedByError', async ({ page }) => {
  const draftData = await page.evaluate(() => {
    const data = localStorage.getItem('draft_record');
    return data ? JSON.parse(data) : null;
  });
  expect(draftData).not.toBeNull();
  expect(draftData.savedByError).toBe(true);
});

Then('the record consultation reason field should have value {string}', async ({ page }, value: string) => {
  await expect(page.getByTestId('record-consultationReason')).toHaveValue(value);
});

Then('I should be redirected to the patient detail page', async ({ page }) => {
  await page.waitForURL(/\/patients\/\d+$/);
  await page.waitForLoadState('networkidle');
});
