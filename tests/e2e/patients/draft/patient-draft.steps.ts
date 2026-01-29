import { expect } from '@playwright/test';
import { Given, When, Then } from '../../common/bdd';
import { patientFactory } from '../../factories/patient.factory';

// =============================================================================
// Draft Setup Steps
// =============================================================================

Given('all patient drafts are cleared', async ({ page }) => {
  await page.addInitScript(() => {
    Object.keys(localStorage)
      .filter(key => key.startsWith('draft_'))
      .forEach(key => localStorage.removeItem(key));
  });
});

Given('a patient draft exists with savedByError true', async ({ page }) => {
  const patient = patientFactory.build({ firstName: 'Reload Test' });
  await page.addInitScript((data) => {
    localStorage.setItem('draft_patient', JSON.stringify({
      type: 'patient',
      data: data,
      timestamp: Date.now(),
      formId: 'test-123',
      savedByError: true
    }));
  }, patient);
});

Given('a patient draft exists with savedByError true and data:', async ({ page }, dataTable) => {
  const rows = dataTable.rowsHash();
  await page.addInitScript((data) => {
    localStorage.setItem('draft_patient', JSON.stringify({
      type: 'patient',
      data: data,
      timestamp: Date.now(),
      formId: 'test-123',
      savedByError: true
    }));
  }, rows);
});

// =============================================================================
// Patient Form Actions
// =============================================================================

When('I fill the patient form with:', async ({ page }, dataTable) => {
  const rows = dataTable.rowsHash();

  const fieldMap: Record<string, RegExp> = {
    'First Name': /First Name|Nombre/i,
    'Last Name': /Last Name|Apellidos/i,
  };

  for (const [key, value] of Object.entries(rows)) {
    const labelRegex = fieldMap[key];
    if (labelRegex) {
      await page.getByLabel(labelRegex).fill(value as string);
    }
  }
});

When('I fill the patient allergies with {string}', async ({ page }, value: string) => {
  await page.getByLabel(/Allergies|Alergias/i).fill(value);
});

When('I click the restore patient draft button', async ({ page }) => {
  await page.getByRole('button', { name: /Recuperar borrador|Restore draft/i }).click();
});

When('I confirm the patient draft restoration', async ({ page }) => {
  await page.getByTestId('confirm-draft-btn').click();
  await expect(page.getByTestId('confirm-draft-btn')).toBeHidden({ timeout: 10000 });
});

// =============================================================================
// Patient Draft Assertions
// =============================================================================

Then('the patient draft should not exist', async ({ page }) => {
  await expect.poll(async () => {
    return await page.evaluate(() => localStorage.getItem('draft_patient'));
  }).toBeNull();
});

Then('the patient draft should exist', async ({ page }) => {
  await expect.poll(async () => {
    return await page.evaluate(() => localStorage.getItem('draft_patient'));
  }).not.toBeNull();
});

Then('the patient draft should be marked as savedByError', async ({ page }) => {
  await expect.poll(async () => {
    const data = await page.evaluate(() => localStorage.getItem('draft_patient'));
    return data ? JSON.parse(data).savedByError : null;
  }).toBe(true);
});

Then('the patient first name field should have value {string}', async ({ page }, value: string) => {
  await expect(page.getByLabel(/Nombre|First Name/i)).toHaveValue(value);
});
