import { expect } from '@playwright/test';
import { Given, When, Then } from '../../common/bdd';
import { loginAsAdmin } from '../../common/auth';

// =============================================================================
// Auth (domain-specific)
// =============================================================================

Given('I am logged in as an administrator', async ({ page, context }) => {
  await loginAsAdmin(page, context);
});

// =============================================================================
// Invoice Form Steps (domain-specific)
// =============================================================================

When('I fill the invoice form with:', async ({ page }, dataTable) => {
  const rows = dataTable.rowsHash();

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
  const index = 0;

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

When('I click edit on the first invoice', async ({ page }) => {
  await page.locator('tbody tr').first().getByRole('link', { name: /Edit|Editar/i }).click();
  await expect(page).toHaveURL(/\/invoices\/\d+\/edit/);
});

// =============================================================================
// Invoice Form Assertions (domain-specific)
// =============================================================================

Then('the invoice form should contain:', async ({ page }, dataTable) => {
  const rows = dataTable.rowsHash();

  const fieldMap: Record<string, string> = {
    'Customer Name': '#invoice-customerName',
    'Customer Tax ID': '#invoice-customerTaxId',
    'Customer Address': '#invoice-customerAddress',
  };

  for (const [key, value] of Object.entries(rows)) {
    const selector = fieldMap[key];
    if (selector) {
      await expect(page.locator(selector)).toHaveValue(value);
    } else {
      throw new Error(`Field mapping not found for: ${key}`);
    }
  }
});

Then('the invoice line {int} should contain:', async ({ page }, lineNumber, dataTable) => {
  const rows = dataTable.rowsHash();
  const index = lineNumber - 1; // Human-readable (1-based) to zero-based

  if (rows['Concept']) {
    await expect(page.getByTestId(`line-concept-${index}`)).toHaveValue(rows['Concept']);
  }

  if (rows['Price']) {
    await expect(page.getByTestId(`line-price-${index}`)).toHaveValue(rows['Price']);
  }
});
