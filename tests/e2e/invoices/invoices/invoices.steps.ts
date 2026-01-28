import { expect } from '@playwright/test';
import { When, Then } from '../../common/bdd';

// =============================================================================
// Invoice Form Steps (domain-specific)
// =============================================================================

When('I fill the invoice form with:', async ({ page }, dataTable) => {
  const rows = dataTable.rowsHash();

  const fieldMap: Record<string, RegExp> = {
    'Customer Name': /Customer Name|Nombre del Cliente/i,
    'Customer Tax ID': /Tax Identifier|Identificador Fiscal/i,
    'Customer Address': /Address|Direcci.n/i,
  };

  for (const [key, value] of Object.entries(rows)) {
    const label = fieldMap[key];
    if (label) {
      await page.getByLabel(label).fill(value);
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
  // Use getByRole('row') assuming 1 header row.
  // The first data row is nth(1).
  const row = page.getByRole('row').nth(1);
  await expect(row).toBeVisible({ timeout: 10000 });
  await row.getByRole('link', { name: /Edit|Editar/i }).click();
  await expect(page).toHaveURL(/\/invoices\/\d+\/edit/);
});

// =============================================================================
// Invoice Form Assertions (domain-specific)
// =============================================================================

Then('the invoice form should contain:', async ({ page }, dataTable) => {
  const rows = dataTable.rowsHash();

  const fieldMap: Record<string, RegExp> = {
    'Customer Name': /Customer Name|Nombre del Cliente/i,
    'Customer Tax ID': /Tax Identifier|Identificador Fiscal/i,
    'Customer Address': /Address|Direcci.n/i,
  };

  for (const [key, value] of Object.entries(rows)) {
    const label = fieldMap[key];
    if (label) {
      await expect(page.getByLabel(label)).toHaveValue(value);
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
