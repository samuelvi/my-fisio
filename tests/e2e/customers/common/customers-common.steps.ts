import { expect } from '@playwright/test';
import { Given, When, Then } from '../../common/bdd';

// =============================================================================
// Customer Form Steps
// =============================================================================

When('I fill the customer form with:', async ({ page }, dataTable) => {
  const rows = dataTable.rowsHash();

  const fieldMap: Record<string, RegExp> = {
    'First Name': /First Name|Nombre/i,
    'Last Name': /Last Name|Apellidos/i,
    'Tax Identifier': /Tax Identifier|Identificador Fiscal/i,
    'Address': /Address|Direcci.n/i,
  };

  for (const [key, value] of Object.entries(rows)) {
    const labelRegex = fieldMap[key];
    if (labelRegex) {
      // Try multiple strategies to find the input
      const byLabel = page.getByLabel(labelRegex).first();
      const byLocator = page.locator('form').locator('label').filter({ hasText: labelRegex }).locator('..').locator('input, textarea').first();

      const input = await byLabel.count() > 0 ? byLabel : byLocator;
      await input.waitFor({ state: 'attached', timeout: 10000 });
      await expect(input).toBeEnabled({ timeout: 10000 });
      await input.fill(value as string);
    }
  }
});

When('I save the customer', async ({ page }) => {
  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('/api/customers') &&
      response.request().method() === 'POST' &&
      response.status() === 201
    ),
    page.getByRole('button', { name: /Save|Guardar/i }).first().click(),
  ]);
});

When('I try to save the customer expecting error', async ({ page }) => {
  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('/api/customers') &&
      response.request().method() === 'POST' &&
      response.status() === 422
    ),
    page.getByRole('button', { name: /Save|Guardar/i }).first().click(),
  ]);
});

When('I save the customer expecting update', async ({ page }) => {
  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('/api/customers/') &&
      response.request().method() === 'PUT'
    ),
    page.getByRole('button', { name: /Save|Guardar/i }).first().click(),
  ]);
});

When('I click edit on the row containing {string}', async ({ page }, text: string) => {
  const row = page.locator('tr', { hasText: text }).first();
  await expect(row).toBeVisible({ timeout: 10000 });
  await row.getByTitle(/Edit|Editar/i).click();
});

Then('the customer {string} should be created successfully', async ({ page }, firstName: string) => {
  await page.waitForURL(/\/customers$/);
});

// =============================================================================
// Customer Search Steps
// =============================================================================

When('I search for customer name {string}', async ({ page }, name: string) => {
  await page.locator('input[type="text"]').first().fill(name);
  await page.locator('button[type="submit"]').click();
  await page.waitForResponse(resp => resp.url().includes('/api/customers') && resp.url().includes('fullName='));
});

When('I search for customer tax ID {string}', async ({ page }, taxId: string) => {
  await page.locator('input[type="text"]').nth(1).fill(taxId);
  await page.locator('button[type="submit"]').click();
  await page.waitForResponse(resp => resp.url().includes('/api/customers') && resp.url().includes('taxId='));
});

// =============================================================================
// Customer Data Setup
// =============================================================================

Given('customers are seeded for search tests', async ({ page }) => {
  const customers = [
    { firstName: 'John', lastName: 'Doe', taxId: '12345678L' },
    { firstName: 'Jane', lastName: 'Smith', taxId: '87654321X' },
    { firstName: 'Roberto', lastName: 'Gomez', taxId: '11223344A' },
  ];

  for (const customer of customers) {
    await page.evaluate(async (c) => {
      const token = localStorage.getItem('token');
      await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/ld+json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: c.firstName,
          lastName: c.lastName,
          taxId: c.taxId,
          billingAddress: 'Test Address'
        }),
      });
    }, customer);
  }
  await page.waitForTimeout(500);
});
