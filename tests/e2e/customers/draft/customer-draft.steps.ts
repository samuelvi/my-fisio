import { expect } from '@playwright/test';
import { Given, When, Then } from '../../common/bdd';
import { customerFactory } from '../../factories/customer.factory';

// =============================================================================
// Draft Setup Steps
// =============================================================================

Given('all customer drafts are cleared', async ({ page }) => {
  await page.addInitScript(() => {
    Object.keys(localStorage)
      .filter(key => key.startsWith('draft_'))
      .forEach(key => localStorage.removeItem(key));
  });
});

Given('a customer draft exists with savedByError true', async ({ page }) => {
  const customer = customerFactory.build({ firstName: 'Reload Test' });
  await page.addInitScript((data) => {
    localStorage.setItem('draft_customer', JSON.stringify({
      type: 'customer',
      data: data,
      timestamp: Date.now(),
      formId: 'test-123',
      savedByError: true
    }));
  }, customer);
});

Given('a customer draft exists with savedByError true and data:', async ({ page }, dataTable) => {
  const rows = dataTable.rowsHash();
  await page.addInitScript((data) => {
    localStorage.setItem('draft_customer', JSON.stringify({
      type: 'customer',
      data: data,
      timestamp: Date.now(),
      formId: 'test-123',
      savedByError: true
    }));
  }, rows);
});

// =============================================================================
// Draft Actions
// =============================================================================

When('I click the save customer button', async ({ page }) => {
  await page.getByRole('button', { name: /Guardar|Save/i }).first().click();
});

When('I click the restore customer draft button', async ({ page }) => {
  await page.getByRole('button', { name: /Recuperar|Restore/i }).first().click();
});

When('I confirm the customer draft restoration', async ({ page }) => {
  await page.getByRole('button', { name: /Sí, recuperar|Yes, restore/i }).first().click();
});

// =============================================================================
// Draft Assertions
// =============================================================================

Then('the customer draft should not exist', async ({ page }) => {
  await expect.poll(async () => {
    return await page.evaluate(() => localStorage.getItem('draft_customer'));
  }).toBeNull();
});

Then('the customer draft should exist', async ({ page }) => {
  await expect.poll(async () => {
    return await page.evaluate(() => localStorage.getItem('draft_customer'));
  }).not.toBeNull();
});

Then('the draft should have firstName {string}', async ({ page }, expectedName: string) => {
  await expect.poll(async () => {
    const data = await page.evaluate(() => localStorage.getItem('draft_customer'));
    return data ? JSON.parse(data).data.firstName : null;
  }).toBe(expectedName);
});

Then('the draft should be marked as savedByError', async ({ page }) => {
  await expect.poll(async () => {
    const data = await page.evaluate(() => localStorage.getItem('draft_customer'));
    return data ? JSON.parse(data).savedByError : null;
  }).toBe(true);
});

Then('the customer first name field should have value {string}', async ({ page }, value: string) => {
  await expect(page.getByLabel(/Nombre|First Name/i)).toHaveValue(value);
});
