import { expect } from '@playwright/test';
import { Given, When, Then } from '../fixtures/bdd';
import { loginAsAdmin } from '../helpers/auth';

Given('the database is empty', async () => {
  // Handled automatically by the dbReset fixture defined in fixtures/bdd.ts
});

Given('I am logged in as an administrator', async ({ page, context }) => {
  await loginAsAdmin(page, context);
});

When('I navigate to the invoices list', async ({ page }) => {
  await page.goto('/invoices');
  await page.waitForLoadState('networkidle');
});

Then('I should see a message saying {string}', async ({ page }, message) => {
  // We match loosely because of possible language variations (ES/EN)
  // "No invoices found" or "No se han encontrado facturas"
  await expect(page.locator('body')).toContainText(/No invoices found|No se han encontrado facturas/i);
});

When('I click the new invoice button', async ({ page }) => {
  await page.getByRole('link', { name: /New Invoice|Nueva Factura/i }).click();
  await expect(page).toHaveURL(/\/invoices\/new/);
});

When('I fill the invoice form with:', async ({ page }, dataTable) => {
  const rows = dataTable.rowsHash();
  
  // Map feature file keys to IDs or labels
  const fieldMap: Record<string, string> = {
    'Customer Name': '#invoice-customerName',
    'Customer Tax ID': '#invoice-customerTaxId',
    'Customer Address': '#invoice-customerAddress',
  };

  for (const [key, value] of Object.entries(rows)) {
    const selector = fieldMap[key];
    if (selector) {
      await page.locator(selector).fill(value);
    } else {
      throw new Error(`Field mapping not found for: ${key}`);
    }
  }
});

When('I add an invoice line with:', async ({ page }, dataTable) => {
  const rows = dataTable.rowsHash();
  const index = 0; // Default to first line

  if (rows['Concept']) {
    await page.getByTestId(`line-concept-${index}`).fill(rows['Concept']);
  }
  
  if (rows['Price']) {
    await page.getByTestId(`line-price-${index}`).fill(rows['Price']);
  }
});

When('I save the invoice', async ({ page }) => {
  await page.getByTestId('confirm-issuance-btn').click();
});

Then('I should be redirected to the invoices list', async ({ page }) => {
  await page.waitForURL(/\/invoices$/);
});

Then('I should see {string} in the list', async ({ page }, text) => {
  await expect(page.locator('tbody')).toContainText(text);
});

Then('I should see {int} invoice in the table', async ({ page }, count) => {
  await expect(page.locator('tbody tr')).toHaveCount(count);
});