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

function invoiceInput(page, label) {
  return page.locator('form').locator(`label:has-text("${label}")`).locator('..').locator('input');
}

async function setInvoiceInputValue(page, label, value) {
  const input = invoiceInput(page, label);
  await input.click();
  await input.press('Control+A');
  await input.press('Backspace');
  if (value !== '') {
    await input.type(value);
  }
  await expect(input).toHaveValue(value);
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

async function postInvoice(page, payload) {
  return apiFetch(page, '/api/invoices', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/ld+json',
    },
    body: JSON.stringify(payload),
  });
}

async function getInvoice(page, id) {
  return apiFetch(page, `/api/invoices/${id}`);
}

async function getInvoiceCollection(page) {
  return apiFetch(page, '/api/invoices');
}

async function putInvoice(page, id, payload) {
  return apiFetch(page, `/api/invoices/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/ld+json',
    },
    body: JSON.stringify(payload),
  });
}

async function getInvoiceExportHtml(page, id) {
  return apiFetch(page, `/api/invoices/${id}/export/html?locale=en`, {
    headers: { Accept: 'text/html' },
  });
}

async function getInvoiceExportPdf(page, id) {
  return await page.evaluate(async (invoiceId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/invoices/${invoiceId}/export/pdf?locale=en`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const buffer = await response.arrayBuffer();
    return {
      status: response.status,
      contentType: response.headers.get('content-type'),
      size: buffer.byteLength,
    };
  }, id);
}

function findViolation(violations, propertyPath) {
  return violations.find((violation) => violation.propertyPath === propertyPath);
}

function getCollectionTotal(data) {
  if (Array.isArray(data)) {
    return data.length;
  }
  if (typeof data?.totalItems === 'number') {
    return data.totalItems;
  }
  if (typeof data?.['hydra:totalItems'] === 'number') {
    return data['hydra:totalItems'];
  }
  if (Array.isArray(data?.member)) {
    return data.member.length;
  }
  if (Array.isArray(data?.['hydra:member'])) {
    return data['hydra:member'].length;
  }
  return 0;
}

test('invoice management flow', async ({ page, request }) => {
  test.setTimeout(120000);

  await page.addInitScript(() => {
    localStorage.setItem('app_locale', 'en');
  });

  await resetDbEmpty(request);
  await login(page);

  // 1) Initial state: no invoices (UI + API)
  await page.goto('/invoices');
  await expect(page.getByText('No invoices found.').first()).toBeVisible();

  const emptyCollection = await getInvoiceCollection(page);
  const emptyTotal = getCollectionTotal(emptyCollection.data);
  expect(emptyTotal).toBe(0);

  // 2) Server validation: minimal required invoice data
  // UI blocks empty customer fields, so validate server responses via API call.
  const missingName = await postInvoice(page, {
    date: new Date().toISOString(),
    fullName: '',
    taxId: '',
    lines: [{ concept: 'Test', quantity: 1, price: 10 }],
  });
  expect(missingName.status).toBe(400);
  expect(missingName.data.detail).toBe('Customer name is required.');

  const missingLines = await postInvoice(page, {
    date: new Date().toISOString(),
    fullName: 'Client Minimal',
    taxId: '',
    lines: [],
  });
  expect(missingLines.status).toBe(422);
  const missingLinesViolation = findViolation(missingLines.data.violations || [], 'lines');
  expect(missingLinesViolation?.message).toBe('At least one invoice line is required.');

  // 3) Create valid invoice 1 (all fields + 2 lines)
  await page.getByRole('link', { name: 'New Invoice' }).click();
  await expect(page).toHaveURL('/invoices/new');
  await disableClientValidation(page);

  const currentYear = new Date().getFullYear();
  const invoiceNum1 = `${currentYear}000001`;

  await setInvoiceInputValue(page, 'Customer Name', 'Client One');
  await setInvoiceInputValue(page, 'Tax Identifier (CIF/NIF)', '12345678Z');
  await setInvoiceInputValue(page, 'Address', 'Test Address 1');
  await setInvoiceInputValue(page, 'Phone', '111222333');
  await setInvoiceInputValue(page, 'Email', 'client1@example.com');

  await page.locator('label:has-text("Concept") + input').nth(0).fill('Session 1');
  await page.locator('label:has-text("Qty") + input').nth(0).fill('1');
  await page.locator('label:has-text("Price") + input').nth(0).fill('40');

  await page.getByRole('button', { name: '+ Add Item' }).click();
  await page.locator('label:has-text("Concept") + input').nth(1).fill('Material');
  await page.locator('label:has-text("Qty") + input').nth(1).fill('1');
  await page.locator('label:has-text("Price") + input').nth(1).fill('20.15');

  await expect(page.locator('span.text-2xl.font-bold.text-primary')).toContainText('60,15');

  const [createResponse1] = await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('/api/invoices') &&
      response.request().method() === 'POST' &&
      response.status() === 201
    ),
    page.getByRole('button', { name: 'Confirm Issuance' }).click(),
  ]);

  const invoice1Data = await createResponse1.json();
  expect(invoice1Data.number).toBe(invoiceNum1);
  expect(invoice1Data.number).toMatch(new RegExp(`^${currentYear}\\d{6}$`));
  expect(invoice1Data.number).toHaveLength(10);
  expect(invoice1Data.lines).toHaveLength(2);
  expect(invoice1Data.amount).toBe(60.15);

  await expect(page).toHaveURL('/invoices');
  await expect(page.locator('tbody tr')).toHaveCount(1);

  // 4) Verify invoice 1 details (edit mode + API)
  await page.locator('tr', { hasText: invoiceNum1 }).getByRole('link', { name: 'Edit' }).click();
  await expect(page).toHaveURL(/\/invoices\/\d+\/edit/);

  const expectedInvoiceDate = new Date(invoice1Data.date).toISOString().split('T')[0];
  await expect(invoiceInput(page, 'Invoice Date')).toHaveValue(expectedInvoiceDate);
  await expect(invoiceInput(page, 'Number')).toHaveValue(invoiceNum1);
  await expect(invoiceInput(page, 'Customer Name')).toHaveValue('Client One');
  await expect(invoiceInput(page, 'Tax Identifier (CIF/NIF)')).toHaveValue('12345678Z');
  await expect(invoiceInput(page, 'Address')).toHaveValue('Test Address 1');
  await expect(invoiceInput(page, 'Phone')).toHaveValue('111222333');
  await expect(invoiceInput(page, 'Email')).toHaveValue('client1@example.com');

  await expect(page.locator('label:has-text("Concept") + input')).toHaveCount(2);
  await expect(page.locator('label:has-text("Concept") + input').nth(0)).toHaveValue('Session 1');
  await expect(page.locator('label:has-text("Concept") + input').nth(1)).toHaveValue('Material');
  await expect(page.locator('label:has-text("Qty") + input').nth(0)).toHaveValue('1');
  await expect(page.locator('label:has-text("Price") + input').nth(0)).toHaveValue('40');
  await expect(page.locator('label:has-text("Price") + input').nth(1)).toHaveValue('20.15');
  await expect(page.locator('span.text-2xl.font-bold.text-primary')).toContainText('60,15');

  const invoice1Api = await getInvoice(page, invoice1Data.id);
  expect(invoice1Api.status).toBe(200);
  expect(invoice1Api.data.lines).toHaveLength(2);

  // 5) HTML and PDF exports (accessible + correct data)
  const htmlExport = await getInvoiceExportHtml(page, invoice1Data.id);
  expect(htmlExport.status).toBe(200);
  expect(htmlExport.data).toContain(invoiceNum1);
  expect(htmlExport.data).toContain('Client One');
  expect(htmlExport.data).toContain('Session 1');
  expect(htmlExport.data).toContain('Material');
  expect(htmlExport.data).toContain('60,15');

  const pdfExport = await getInvoiceExportPdf(page, invoice1Data.id);
  expect(pdfExport.status).toBe(200);
  expect(pdfExport.contentType).toBe('application/pdf');
  expect(pdfExport.size).toBeGreaterThan(0);

  // 6) Create invoice 2 - no lines should error
  await page.goto('/invoices/new');
  await disableClientValidation(page);

  await setInvoiceInputValue(page, 'Customer Name', 'Client Two');
  await setInvoiceInputValue(page, 'Tax Identifier (CIF/NIF)', '87654321X');

  const firstLineRow = page.locator('label:has-text("Concept")').first().locator('..').locator('..');
  await firstLineRow.getByRole('button', { name: '' }).click();
  await expect(page.locator('label:has-text("Concept") + input')).toHaveCount(0);

  const [noLinesResponse] = await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('/api/invoices') &&
      response.request().method() === 'POST'
    ),
    page.getByRole('button', { name: 'Confirm Issuance' }).click(),
  ]);

  expect(noLinesResponse.status()).toBe(422);
  const noLinesData = await noLinesResponse.json();
  const linesViolation = findViolation(noLinesData.violations || [], 'lines');
  expect(linesViolation?.message).toBe('At least one invoice line is required.');

  // 6b) Line field required validation (concept)
  await page.getByRole('button', { name: '+ Add Item' }).click();
  await disableClientValidation(page);

  await page.locator('label:has-text("Qty") + input').fill('1');
  await page.locator('label:has-text("Price") + input').fill('10');
  await page.locator('label:has-text("Concept") + input').fill('');

  const [invalidLineResponse] = await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('/api/invoices') &&
      response.request().method() === 'POST'
    ),
    page.getByRole('button', { name: 'Confirm Issuance' }).click(),
  ]);

  expect(invalidLineResponse.status()).toBe(422);
  const invalidLineData = await invalidLineResponse.json();
  const invalidViolations = invalidLineData.violations || [];
  expect(findViolation(invalidViolations, 'lines[0].concept')?.message).toBe('Invoice line concept is required.');

  // 6c) Invalid numeric values
  await page.locator('label:has-text("Concept") + input').fill('Valid Concept');

  const submitWithValues = async (qty, price) => {
    await page.locator('label:has-text("Qty") + input').fill(`${qty}`);
    await page.locator('label:has-text("Price") + input').fill(`${price}`);
    const [response] = await Promise.all([
      page.waitForResponse((res) =>
        res.url().includes('/api/invoices') &&
        res.request().method() === 'POST'
      ),
      page.getByRole('button', { name: 'Confirm Issuance' }).click(),
    ]);
    return response;
  };

  const qtyZeroResponse = await submitWithValues(0, 10);
  expect(qtyZeroResponse.status()).toBe(422);
  const qtyZeroData = await qtyZeroResponse.json();
  expect(findViolation(qtyZeroData.violations || [], 'lines[0].quantity')?.message).toBe('Invoice line quantity must be greater than 0.');

  const qtyNegativeResponse = await submitWithValues(-1, 10);
  expect(qtyNegativeResponse.status()).toBe(422);
  const qtyNegativeData = await qtyNegativeResponse.json();
  expect(findViolation(qtyNegativeData.violations || [], 'lines[0].quantity')?.message).toBe('Invoice line quantity must be greater than 0.');

  const priceZeroResponse = await submitWithValues(1, 0);
  expect(priceZeroResponse.status()).toBe(422);
  const priceZeroData = await priceZeroResponse.json();
  expect(findViolation(priceZeroData.violations || [], 'lines[0].price')?.message).toBe('Invoice line price must be greater than 0.');

  const priceNegativeResponse = await submitWithValues(1, -10);
  expect(priceNegativeResponse.status()).toBe(422);
  const priceNegativeData = await priceNegativeResponse.json();
  expect(findViolation(priceNegativeData.violations || [], 'lines[0].price')?.message).toBe('Invoice line price must be greater than 0.');

  // 7) Create valid invoice 2
  await page.locator('label:has-text("Qty") + input').fill('1');
  await page.locator('label:has-text("Price") + input').fill('100');

  const [createResponse2] = await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('/api/invoices') &&
      response.request().method() === 'POST' &&
      response.status() === 201
    ),
    page.getByRole('button', { name: 'Confirm Issuance' }).click(),
  ]);

  const invoice2Data = await createResponse2.json();
  const invoiceNum2 = `${currentYear}000002`;
  expect(invoice2Data.number).toBe(invoiceNum2);
  expect(invoice2Data.number).toMatch(new RegExp(`^${currentYear}\\d{6}$`));
  expect(invoice2Data.number).toHaveLength(10);
  expect(invoice2Data.lines).toHaveLength(1);

  await expect(page).toHaveURL('/invoices');

  // 8) Verify invoice 2 lines (visual + API)
  await page.locator('tr', { hasText: invoiceNum2 }).getByRole('link', { name: 'Edit' }).click();
  await expect(page).toHaveURL(/\/invoices\/\d+\/edit/);
  await expect(page.locator('label:has-text("Concept") + input')).toHaveCount(1);

  const invoice2Api = await getInvoice(page, invoice2Data.id);
  expect(invoice2Api.status).toBe(200);
  expect(invoice2Api.data.lines).toHaveLength(1);

  // 9) List shows 2 invoices + API list count
  await page.goto('/invoices');
  await expect(page.locator('tbody tr')).toHaveCount(2);

  const apiList = await getInvoiceCollection(page);
  const apiTotal = getCollectionTotal(apiList.data);
  expect(apiTotal).toBe(2);

  // 10) Edit invoice 1 - number validations (API-backed to ensure server errors)
  const invoice1Refresh = await getInvoice(page, invoice1Data.id);
  const basePayload = {
    date: invoice1Refresh.data.date,
    fullName: invoice1Refresh.data.fullName,
    taxId: invoice1Refresh.data.taxId,
    address: invoice1Refresh.data.address,
    phone: invoice1Refresh.data.phone,
    email: invoice1Refresh.data.email,
    amount: invoice1Refresh.data.amount,
    lines: invoice1Refresh.data.lines.map((line) => ({
      concept: line.concept,
      description: line.description,
      quantity: line.quantity,
      price: line.price,
    })),
  };

  const requiredNumberResponse = await putInvoice(page, invoice1Data.id, {
    ...basePayload,
    number: '',
  });
  expect(requiredNumberResponse.status).toBe(400);
  expect(requiredNumberResponse.data.detail).toBe('invoice_number_required');

  const duplicateNumberResponse = await putInvoice(page, invoice1Data.id, {
    ...basePayload,
    number: invoiceNum2,
  });
  expect(duplicateNumberResponse.status).toBe(400);
  expect(duplicateNumberResponse.data.detail).toBe('invoice_number_duplicate');

  const invalidFormatResponse = await putInvoice(page, invoice1Data.id, {
    ...basePayload,
    number: '123456',
  });
  expect(invalidFormatResponse.status).toBe(400);
  expect(invalidFormatResponse.data.detail).toBe('invoice_number_invalid_format');

  const outOfSequenceResponse = await putInvoice(page, invoice1Data.id, {
    ...basePayload,
    number: `${currentYear}000004`,
  });
  expect(outOfSequenceResponse.status).toBe(400);
  expect(outOfSequenceResponse.data.detail).toBe('invoice_number_out_of_sequence');
});

test('invoice server-side validation UI display', async ({ page, request }) => {
  test.setTimeout(90000);

  await page.addInitScript(() => {
    localStorage.setItem('app_locale', 'en');
  });

  await resetDbEmpty(request);
  await login(page);

  // Navigate to new invoice form
  await page.goto('/invoices/new');
  await expect(page).toHaveURL('/invoices/new');
  await disableClientValidation(page);

  // Test 1: Missing address field (new validation)
  console.log('Test 1: Missing address validation');

  await setInvoiceInputValue(page, 'Customer Name', 'Test Customer');
  await setInvoiceInputValue(page, 'Tax Identifier (CIF/NIF)', '12345678A');
  await setInvoiceInputValue(page, 'Address', ''); // Leave address empty

  // Fill invoice line
  await page.locator('label:has-text("CONCEPT") + input').first().fill('Test Service');
  await page.locator('label:has-text("Price") + input').first().fill('100');

  // Submit
  const [addressResponse] = await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('/api/invoices') &&
      response.request().method() === 'POST'
    ),
    page.getByRole('button', { name: 'Confirm Issuance' }).click(),
  ]);

  expect(addressResponse.status()).toBe(422);
  const addressData = await addressResponse.json();
  const addressViolations = addressData.violations || [];

  // Verify server returned address violation
  const addressViolation = findViolation(addressViolations, 'address');
  expect(addressViolation).toBeTruthy();
  expect(addressViolation?.message).toBe('Address is required.');

  // Wait for UI to update
  await page.waitForTimeout(500);

  // Verify address error is displayed in UI
  const addressError = page.locator('p.text-red-600').filter({ hasText: /Address is required/i });
  await expect(addressError.first()).toBeVisible({ timeout: 5000 });

  console.log('Test 1 passed: Address validation error displayed');

  // Test 2: Missing concept on invoice line
  console.log('Test 2: Missing concept validation');

  // Navigate to fresh form
  await page.goto('/invoices/new');
  await disableClientValidation(page);

  // Fill customer fields
  await setInvoiceInputValue(page, 'Customer Name', 'Test Customer 2');
  await setInvoiceInputValue(page, 'Tax Identifier (CIF/NIF)', '87654321B');
  await setInvoiceInputValue(page, 'Address', 'Test Address 2');

  // Leave concept empty on the default line
  await page.locator('label:has-text("CONCEPT") + input').first().fill('');
  await page.locator('label:has-text("Price") + input').first().fill('100');

  // Submit
  const [conceptResponse] = await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('/api/invoices') &&
      response.request().method() === 'POST'
    ),
    page.getByRole('button', { name: 'Confirm Issuance' }).click(),
  ]);

  expect(conceptResponse.status()).toBe(422);
  const conceptData = await conceptResponse.json();
  const conceptViolations = conceptData.violations || [];

  // Verify violation for concept
  const conceptViolation = findViolation(conceptViolations, 'lines[0].concept');
  expect(conceptViolation).toBeTruthy();
  expect(conceptViolation?.message).toBe('Invoice line concept is required.');

  // Wait for UI to update
  await page.waitForTimeout(500);

  // Verify concept error is displayed in UI
  const conceptError = page.locator('p.text-red-600').filter({ hasText: /concept is required/i });
  await expect(conceptError.first()).toBeVisible({ timeout: 5000 });

  console.log('Test 2 passed: Concept required error displayed');

  // Test 3: Negative price and negative quantity
  console.log('Test 3: Negative price and quantity');

  // Navigate to fresh form
  await page.goto('/invoices/new');
  await disableClientValidation(page);

  // Fill required fields
  await setInvoiceInputValue(page, 'Customer Name', 'Test Customer 3');
  await setInvoiceInputValue(page, 'Tax Identifier (CIF/NIF)', '11111111C');
  await setInvoiceInputValue(page, 'Address', 'Test Address 3');

  // Fill concept with valid value
  await page.locator('label:has-text("CONCEPT") + input').first().fill('Test Service');

  // Set negative quantity
  const qtyInput = page.locator('label:has-text("Qty") + input').first();
  await qtyInput.click();
  await qtyInput.press('Control+A');
  await qtyInput.fill('-5');

  // Set negative price
  const priceInput = page.locator('label:has-text("Price") + input').first();
  await priceInput.click();
  await priceInput.press('Control+A');
  await priceInput.fill('-10');

  // Submit
  const [negativeResponse] = await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('/api/invoices') &&
      response.request().method() === 'POST'
    ),
    page.getByRole('button', { name: 'Confirm Issuance' }).click(),
  ]);

  expect(negativeResponse.status()).toBe(422);
  const negativeData = await negativeResponse.json();
  const negativeViolations = negativeData.violations || [];

  // Verify violations for negative values
  const qtyNegViolation = findViolation(negativeViolations, 'lines[0].quantity');
  const priceNegViolation = findViolation(negativeViolations, 'lines[0].price');

  expect(qtyNegViolation).toBeTruthy();
  expect(qtyNegViolation?.message).toBe('Invoice line quantity must be greater than 0.');
  expect(priceNegViolation).toBeTruthy();
  // Note: Price uses PositiveOrZero but message still says "greater than 0" - this is the actual message from Symfony
  expect(priceNegViolation?.message).toBe('Invoice line price must be greater than 0.');

  // Wait for UI to update
  await page.waitForTimeout(500);

  // Verify errors are displayed
  const qtyErrors = page.locator('p.text-red-600').filter({ hasText: /quantity/i });
  const priceNegErrors = page.locator('p.text-red-600').filter({ hasText: /greater than/i });

  expect(await qtyErrors.count()).toBeGreaterThan(0);
  expect(await priceNegErrors.count()).toBeGreaterThan(0);

  console.log('Test 3 passed: Negative values validation errors displayed');

  // Verify the invoice line row has red background indicating errors
  const lineWithErrors = page.locator('.bg-red-50.border-2.border-red-300').first();
  await expect(lineWithErrors).toBeVisible();

  console.log('All server-side validation UI tests passed!');
});
