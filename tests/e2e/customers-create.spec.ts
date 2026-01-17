// @ts-check
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './common/auth';

async function resetDbEmpty(request) {
  const response = await request.post('/api/test/reset-db-empty');
  expect(response.ok()).toBeTruthy();
}

function customerInput(page, labelRegex) {
  return page.getByLabel(labelRegex).first();
}

async function setCustomerInputValue(page, labelRegex, value) {
  const input = customerInput(page, labelRegex);
  await input.waitFor({ state: 'attached' });
  await expect(input).toBeEnabled({ timeout: 10000 });
  await input.fill(value);
}

async function apiFetch(page, url, options = {}) {
  return await page.evaluate(async ({ url, options }) => {
    const token = localStorage.getItem('token');
    const headers = {
      Accept: 'application/ld+json',
      ...(options.headers || {}),
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const response = await fetch(url, {
      ...options,
      headers,
    });
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('json') ? await response.json() : await response.text();
    return {
      status: response.status,
      data,
      contentType,
    };
  }, { url, options });
}

test('customer creation flow', async ({ page, request, context }) => {
  test.setTimeout(120000);

  await resetDbEmpty(request);
  await loginAsAdmin(page, context);

  // 1) Initial state: no customers
  await page.goto('/customers');
  await expect(page.locator('body')).toContainText(/No customers found|No se han encontrado clientes/i);

  // 2) Create valid customer
  await page.getByRole('link', { name: /New Customer|Nuevo Cliente/i }).click();
  await expect(page).toHaveURL('/customers/new');

  await setCustomerInputValue(page, /First Name|Nombre/i, 'John');
  await setCustomerInputValue(page, /Last Name|Apellidos/i, 'Doe');
  await setCustomerInputValue(page, /Tax Identifier|Identificador Fiscal/i, '12345678L');
  await setCustomerInputValue(page, /Address|Direcci.n/i, '123 Billing St, City');

  const [createResponse] = await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('/api/customers') &&
      response.request().method() === 'POST' &&
      response.status() === 201
    ),
    page.getByRole('button', { name: /Save|Guardar/i }).first().click(),
  ]);

  const customerData = await createResponse.json();
  expect(customerData.firstName).toBe('John');

  await page.waitForURL(/\/customers$/);
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.getByText('John Doe').first()).toBeVisible();

  // 3) Create duplicate taxId should error
  await page.getByRole('link', { name: /New Customer|Nuevo Cliente/i }).click();
  await setCustomerInputValue(page, /First Name|Nombre/i, 'Duplicate');
  await setCustomerInputValue(page, /Last Name|Apellidos/i, 'TaxID');
  await setCustomerInputValue(page, /Tax Identifier|Identificador Fiscal/i, '12345678L');
  await setCustomerInputValue(page, /Address|Direcci.n/i, 'Some address');
  
  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('/api/customers') &&
      response.request().method() === 'POST' &&
      response.status() === 422
    ),
    page.getByRole('button', { name: /Save|Guardar/i }).first().click(),
  ]);
  
  // Should show error message
  await expect(page.locator('body')).toContainText(/already a customer|existe un cliente/i);

  // 4) Update customer
  await page.goto('/customers');
  await page.locator('tr', { hasText: 'John Doe' }).getByTitle(/Edit|Editar/i).click();
  
  await setCustomerInputValue(page, /First Name|Nombre/i, 'Johnny');
  
  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('/api/customers/') &&
      response.request().method() === 'PUT'
    ),
    page.getByRole('button', { name: /Save|Guardar/i }).first().click(),
  ]);
  
  await page.waitForURL(/\/customers$/);
  await expect(page.getByText('Johnny Doe').first()).toBeVisible();
});
