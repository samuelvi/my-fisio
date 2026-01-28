import { expect } from '@playwright/test';
import { When, Then } from '../../common/bdd';

// =============================================================================
// Navigation Steps
// =============================================================================

When('I navigate to patients via navigation', async ({ page }) => {
  // Using generic text match for nav link
  await page.click('nav >> text=/Patients|Pacientes/i');
});

// =============================================================================
// Record Form Steps
// =============================================================================

When('I click the add first record button', async ({ page }) => {
  const addBtn = page.getByTestId('add-first-record-btn');
  await expect(addBtn).toBeVisible({ timeout: 10000 });
  await addBtn.click();
  // Wait for form visibility by role
  await expect(page.getByRole('form')).toBeVisible();
});

When('I click the add record button', async ({ page }) => {
  await page.getByTestId('add-record-btn').click();
});

When('I fill the record form with:', async ({ page }, dataTable) => {
  const rows = dataTable.rowsHash();

  if (rows['Physiotherapy Treatment']) {
    await page.getByLabel(/Main Physiotherapy Treatment|Tratamiento Principal/i).fill(rows['Physiotherapy Treatment']);
  }
  if (rows['Consultation Reason']) {
    await page.getByLabel(/Consultation Reason|Motivo de Consulta/i).fill(rows['Consultation Reason']);
  }
  if (rows['Notes']) {
    await page.getByLabel(/Confidential Notes|Notas Confidenciales/i).fill(rows['Notes']);
  }
});

When('I fill the physiotherapy treatment with {string}', async ({ page }, value: string) => {
  await page.getByLabel(/Main Physiotherapy Treatment|Tratamiento Principal/i).fill(value);
});

When('I click the save record button', async ({ page }) => {
  await page.getByTestId('save-record-btn').click();
  await page.waitForURL(/\/patients\/\d+$/);
});

// =============================================================================
// Record Assertions
// =============================================================================

Then('I should see {int} records in the list', async ({ page }, count: number) => {
  // Assuming the records are in a list with role="list"
  await expect(page.getByRole('list').getByRole('listitem')).toHaveCount(count);
});
