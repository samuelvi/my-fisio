import { expect } from '@playwright/test';
import { Given, When, Then } from '../../common/bdd';

// =============================================================================
// Draft Setup Steps
// =============================================================================

Given('all invoice drafts are cleared', async ({ page }) => {
  await page.addInitScript(() => {
    Object.keys(localStorage)
      .filter(key => key.startsWith('draft_'))
      .forEach(key => localStorage.removeItem(key));
  });
});

Given('an invoice draft exists with savedByError true', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('draft_invoice', JSON.stringify({
      type: 'invoice',
      data: { customerName: 'Reload Test' },
      timestamp: Date.now(),
      formId: 'test-123',
      savedByError: true
    }));
  });
});

Given('an invoice draft exists with savedByError true and data:', async ({ page }, dataTable) => {
  const rows = dataTable.rowsHash();
  await page.addInitScript((data) => {
    localStorage.setItem('draft_invoice', JSON.stringify({
      type: 'invoice',
      data: data,
      timestamp: Date.now(),
      formId: 'test-123',
      savedByError: true
    }));
  }, rows);
});

Given('the invoice draft has line:', async ({ page }, dataTable) => {
  const lineData = dataTable.rowsHash();
  await page.addInitScript((line) => {
    const draft = JSON.parse(localStorage.getItem('draft_invoice') || '{}');
    draft.data.lines = [{
      concept: line.concept,
      quantity: parseInt(line.quantity) || 1,
      price: parseFloat(line.price) || 0,
      amount: parseFloat(line.amount) || 0
    }];
    localStorage.setItem('draft_invoice', JSON.stringify(draft));
  }, lineData);
});

// =============================================================================
// Invoice Form Actions
// =============================================================================

When('I fill the invoice customer name with {string}', async ({ page }, value: string) => {
  await page.locator('#invoice-customerName').fill(value);
});

When('I fill the invoice line concept with {string}', async ({ page }, value: string) => {
  await page.getByTestId('line-concept-0').fill(value);
});

When('I fill the invoice draft form with:', async ({ page }, dataTable) => {
  const rows = dataTable.rowsHash();

  if (rows.customerName) {
    await page.locator('#invoice-customerName').fill(rows.customerName);
  }
  if (rows.customerTaxId) {
    await page.locator('#invoice-customerTaxId').fill(rows.customerTaxId);
  }
  if (rows.customerAddress) {
    await page.locator('#invoice-customerAddress').fill(rows.customerAddress);
  }
});

When('I fill the invoice line with:', async ({ page }, dataTable) => {
  const rows = dataTable.rowsHash();

  if (rows.concept) {
    await page.getByTestId('line-concept-0').fill(rows.concept);
  }
  if (rows.price) {
    await page.getByTestId('line-price-0').fill(rows.price);
  }
});

When('I click the confirm issuance button', async ({ page }) => {
  await page.getByTestId('confirm-issuance-btn').click();
});

When('I click the restore invoice draft button', async ({ page }) => {
  await page.getByRole('button', { name: /Recuperar borrador|Restore draft/i }).first().click();
});

When('I click the discard invoice draft button', async ({ page }) => {
  await page.getByRole('button', { name: /Descartar borrador|Discard draft/i }).first().click();
});

When('I confirm the invoice draft action', async ({ page }) => {
  await page.getByTestId('confirm-draft-btn').click();
  await expect(page.getByTestId('confirm-draft-btn')).toBeHidden({ timeout: 15000 });
});

// =============================================================================
// Invoice Draft Assertions
// =============================================================================

Then('the invoice draft should not exist', async ({ page }) => {
  const draftData = await page.evaluate(() => localStorage.getItem('draft_invoice'));
  expect(draftData).toBeNull();
});

Then('the invoice draft should exist', async ({ page }) => {
  const draftData = await page.evaluate(() => localStorage.getItem('draft_invoice'));
  expect(draftData).not.toBeNull();
});

Then('the invoice draft should be marked as savedByError', async ({ page }) => {
  const draftData = await page.evaluate(() => {
    const data = localStorage.getItem('draft_invoice');
    return data ? JSON.parse(data) : null;
  });
  expect(draftData).not.toBeNull();
  expect(draftData.savedByError).toBe(true);
});

Then('the invoice customer name field should have value {string}', async ({ page }, value: string) => {
  await expect(page.locator('#invoice-customerName')).toHaveValue(value);
});

Then('the invoice line concept should have value {string}', async ({ page }, value: string) => {
  await expect(page.getByTestId('line-concept-0')).toHaveValue(value);
});
