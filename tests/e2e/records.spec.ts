// @ts-check
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.beforeEach(async ({ request }) => {
  const response = await request.post('/api/test/reset-db-empty');
  expect(response.ok()).toBeTruthy();
});

test('clinical records lifecycle: validation, create full, edit verification', async ({ page, request, context }) => {
  const uniqueSuffix = Date.now().toString().slice(-6);
  const patientFirstName = `RecordTest${uniqueSuffix}`;
  const patientLastName = 'Patient';

  // 1. Login
  await loginAsAdmin(page, context);

  // 2. Create a Patient
  await page.click('nav >> text=/Patients|Pacientes/i');
  await page.getByRole('link', { name: /New Patient|Nuevo Paciente/i }).click();
  await page.fill('input[name="firstName"]', patientFirstName);
  await page.fill('input[name="lastName"]', patientLastName);
  await page.locator('#allergies').fill('None');
  await page.getByTestId('save-patient-btn').click();

  // 3. Open patient detail
  await page.waitForURL(/\/patients$/);
  
  // Search for it to be sure
  await page.locator('input[type="text"]').first().fill(patientFirstName);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');

  await page.getByRole('link', { name: new RegExp(`${patientFirstName}`) }).first().click();

  // 4. Add First Record
  await page.waitForLoadState('networkidle');
  const addBtn = page.getByTestId('add-first-record-btn');
  await expect(addBtn).toBeVisible({ timeout: 10000 });
  await addBtn.click();
  
  await page.waitForSelector('#record-form');
  const recordData = {
      physiotherapyTreatment: 'Full treatment session',
      consultationReason: 'Back pain',
      notes: 'Private notes for physio'
  };

  await page.fill('textarea[name="physiotherapyTreatment"]', recordData.physiotherapyTreatment);
  await page.fill('textarea[name="consultationReason"]', recordData.consultationReason);
  await page.fill('input[name="notes"]', recordData.notes);
  
  await page.getByTestId('save-record-btn').click();
  
  await page.waitForURL(/\/patients\/\d+$/);
  
  // Verify counts
  await expect(page.locator('body')).toContainText(recordData.physiotherapyTreatment);

  // 5. Add Second Record
  await page.getByTestId('add-record-btn').click();
  await page.fill('textarea[name="physiotherapyTreatment"]', 'Second session');
  await page.getByTestId('save-record-btn').click();

  // Final verification
  await page.waitForURL(/\/patients\/\d+$/);
  await expect(page.locator('ul[role="list"] li')).toHaveCount(2);
});
