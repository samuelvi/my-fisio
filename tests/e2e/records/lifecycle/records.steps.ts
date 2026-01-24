import { expect } from '@playwright/test';
import { When, Then } from '../../common/bdd';

// =============================================================================
// Navigation Steps
// =============================================================================

When('I navigate to patients via navigation', async ({ page }) => {
  await page.click('nav >> text=/Patients|Pacientes/i');
});

// =============================================================================
// Record Form Steps
// =============================================================================

When('I click the add first record button', async ({ page }) => {
  const addBtn = page.getByTestId('add-first-record-btn');
  await expect(addBtn).toBeVisible({ timeout: 10000 });
  await addBtn.click();
  await page.waitForSelector('#record-form');
});

When('I click the add record button', async ({ page }) => {
  await page.getByTestId('add-record-btn').click();
});

When('I fill the record form with:', async ({ page }, dataTable) => {
  const rows = dataTable.rowsHash();

  if (rows['Physiotherapy Treatment']) {
    await page.fill('textarea[name="physiotherapyTreatment"]', rows['Physiotherapy Treatment']);
  }
  if (rows['Consultation Reason']) {
    await page.fill('textarea[name="consultationReason"]', rows['Consultation Reason']);
  }
  if (rows['Notes']) {
    await page.fill('input[name="notes"]', rows['Notes']);
  }
});

When('I fill the physiotherapy treatment with {string}', async ({ page }, value: string) => {
  await page.fill('textarea[name="physiotherapyTreatment"]', value);
});

When('I click the save record button', async ({ page }) => {
  await page.getByTestId('save-record-btn').click();
  await page.waitForURL(/\/patients\/\d+$/);
});

// =============================================================================
// Record Assertions
// =============================================================================

Then('I should see {int} records in the list', async ({ page }, count: number) => {
  await expect(page.locator('ul[role="list"] li')).toHaveCount(count);
});
