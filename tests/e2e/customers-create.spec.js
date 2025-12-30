// @ts-check
import { test, expect } from '@playwright/test';

async function resetDbEmpty(request) {
  const response = await request.post('/api/test/reset-db-empty');
  expect(response.ok()).toBeTruthy();
}

async function login(page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'tina@tinafisio.com');
  await page.fill('input[name="password"]', 'password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('/dashboard');
}

async function disableClientValidation(page) {
  await page.waitForSelector('form');
  await page.evaluate(() => {
    const form = document.querySelector('form');
    if (form) {
      form.setAttribute('novalidate', 'true');
    }
  });
}

function customerInput(page, label) {
  // Try to find by label text precisely or with asterisk
  return page.locator('form').locator(`label:has-text("${label}")`).locator('..').locator('input, textarea');
}

async function setCustomerInputValue(page, label, value) {
  const input = customerInput(page, label);
  await input.click();
  await input.press('Control+A');
  await input.press('Backspace');
  if (value !== '') {
    await input.type(value);
  }
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

async function getCustomerCollection(page) {
  return apiFetch(page, '/api/customers');
}

function getCollectionTotal(data) {
  if (Array.isArray(data)) {
    return data.length;
  }
  const members = data.member || data['hydra:member'];
  if (Array.isArray(members)) {
      return members.length;
  }
  return 0;
}

test('customer creation flow', async ({ page, request }) => {
  test.setTimeout(120000);

  await page.addInitScript(() => {
    localStorage.setItem('app_locale', 'en');
  });

  await resetDbEmpty(request);
  await login(page);

  // 1) Initial state: no customers
  await page.goto('/customers');
  await expect(page.getByText('No customers found.').first()).toBeVisible();

  const emptyCollection = await getCustomerCollection(page);
  expect(getCollectionTotal(emptyCollection.data)).toBe(0);

  // 2) Create valid customer
  await page.getByRole('link', { name: 'New Customer' }).click();
  await expect(page).toHaveURL('/customers/new');

  await setCustomerInputValue(page, 'First Name', 'John');
  await setCustomerInputValue(page, 'Last Name', 'Doe');
  await setCustomerInputValue(page, 'Tax Identifier (CIF/NIF)', '12345678L');
  await setCustomerInputValue(page, 'Email', 'john.doe@example.com');
  await setCustomerInputValue(page, 'Phone', '666777888');
  await setCustomerInputValue(page, 'Address', '123 Billing St, City');

  const [createResponse] = await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('/api/customers') &&
      response.request().method() === 'POST' &&
      response.status() === 201
    ),
    page.getByRole('button', { name: 'Save Customer' }).click(),
  ]);

  const customerData = await createResponse.json();
  expect(customerData.firstName).toBe('John');
  expect(customerData.lastName).toBe('Doe');
  expect(customerData.taxId).toBe('12345678L');
  expect(customerData.fullName).toBe('John Doe');

  await expect(page).toHaveURL('/customers');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.getByText('John Doe').first()).toBeVisible();
  await expect(page.getByText('12345678L').first()).toBeVisible();

  // 3) Create duplicate taxId should error
  await page.getByRole('link', { name: 'New Customer' }).click();
  await setCustomerInputValue(page, 'First Name', 'Duplicate');
  await setCustomerInputValue(page, 'Last Name', 'TaxID');
  await setCustomerInputValue(page, 'Tax Identifier (CIF/NIF)', '12345678L');
  await setCustomerInputValue(page, 'Address', 'Some address');
  
  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('/api/customers') &&
      response.request().method() === 'POST' &&
      response.status() === 422
    ),
    page.getByRole('button', { name: 'Save Customer' }).click(),
  ]);
  
  // Should show error message
  await expect(page.getByText('There is already a customer with this Tax ID.').first()).toBeVisible();

  // 4) Update customer
  await page.goto('/customers');
  await page.locator('tr', { hasText: 'John Doe' }).getByRole('link', { name: 'Edit' }).click();
  
  await setCustomerInputValue(page, 'First Name', 'Johnny');
  
  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('/api/customers/') &&
      response.request().method() === 'PUT'
    ),
    page.getByRole('button', { name: 'Save Customer' }).click(),
  ]);
  
  await expect(page).toHaveURL('/customers');
  await expect(page.getByText('Johnny Doe').first()).toBeVisible();
});
