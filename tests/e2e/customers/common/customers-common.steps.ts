import { expect } from '@playwright/test';
import { Given, When, Then } from '../../common/bdd';
import { customerFactory } from '../../factories/customer.factory';

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
      const input = page.getByLabel(labelRegex).first();
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
  const row = page.getByRole('row', { name: new RegExp(text, 'i') }).first();
  await expect(row).toBeVisible({ timeout: 10000 });
  // Assuming the edit button is a link or button with title/name Edit
  await row.getByRole('link', { name: /Edit|Editar/i }).click();
});

Then('the customer {string} should be created successfully', async ({ page }, firstName: string) => {
  await page.waitForURL(/\/customers$/);
});

// =============================================================================
// Customer Search Steps
// =============================================================================

When('I search for customer name {string}', async ({ page }, name: string) => {
  // Assuming the first textbox is for name search
  await page.getByRole('textbox').first().fill(name);
  await page.getByRole('button', { name: /Search|Buscar/i }).first().click();
  await page.waitForResponse(resp => resp.url().includes('/api/customers') && resp.url().includes('fullName='));
});

When('I search for customer tax ID {string}', async ({ page }, taxId: string) => {
  // Assuming the second textbox is for tax ID search.
  // Ideally use getByLabel if available.
  await page.getByRole('textbox').nth(1).fill(taxId);
  await page.getByRole('button', { name: /Search|Buscar/i }).first().click();
  await page.waitForResponse(resp => resp.url().includes('/api/customers') && resp.url().includes('taxId='));
});

// =============================================================================
// Customer Data Setup
// =============================================================================

Given('customers are seeded for search tests', async ({ page }) => {
  const customers = [
    customerFactory.build({ firstName: 'John', lastName: 'Doe', taxId: '12345678L' }),
    customerFactory.build({ firstName: 'Jane', lastName: 'Smith', taxId: '87654321X' }),
    customerFactory.build({ firstName: 'Roberto', lastName: 'Gomez', taxId: '11223344A' }),
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
        body: JSON.stringify(c),
      });
    }, customer);
  }
});
