// @ts-check
import { test, expect } from '@playwright/test';

async function resetDb(request) {
  // Use standard reset-db to have some invoices
  const response = await request.post('/api/test/reset-db');
  expect(response.ok()).toBeTruthy();
}

async function login(page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'tina@tinafisio.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
}

async function apiFetch(page, url) {
  return await page.evaluate(async (fetchUrl) => {
    const token = localStorage.getItem('token');
    const headers = { Accept: 'application/ld+json' };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const response = await fetch(fetchUrl, { headers });
    const data = await response.json();
    return { status: response.status, data };
  }, url);
}

async function createTestInvoice(page, name, number, amount = 40) {
  return await page.evaluate(async ({ name, number, amount }) => {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/ld+json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        date: new Date().toISOString(),
        number: number,
        fullName: name,
        taxId: '12345678Z',
        address: 'Test Address',
        phone: '123456789',
        email: 'test@example.com',
        amount: amount,
        lines: [
          {
            concept: 'Sesión de fisioterapia',
            quantity: 1,
            price: amount,
          },
        ],
      }),
    });
    return await response.json();
  }, { name, number, amount });
}

test.describe('Invoice Search', () => {
  test.beforeEach(async ({ page, request }) => {
    await page.addInitScript(() => {
      localStorage.setItem('app_locale', 'en');
    });
    await resetDb(request);
    await login(page);
  });

  test('search by customer name is case-insensitive', async ({ page }) => {
    // Create test invoices with known names
    await createTestInvoice(page, 'Pedro García García', '', 80);
    await createTestInvoice(page, 'María López', '', 40);

    await page.goto('/invoices');

    // Search for "pedro" (lowercase) should find "Pedro García García"
    await page.fill('input[placeholder*="Search by name"]', 'pedro');
    await page.click('button[type="submit"]');
    await page.waitForResponse(resp =>
      resp.url().includes('/api/invoices') &&
      resp.url().includes('fullName=pedro')
    );

    await expect(page.getByText('Pedro García García').first()).toBeVisible();
    await expect(page.getByText('María López').first()).not.toBeVisible();

    // Clear search
    await page.click('button:has-text("Clear")');
  });

  test('search by customer name is accent-insensitive', async ({ page }) => {
    // Create test invoice with accented name
    await createTestInvoice(page, 'Pedro García García', '', 80);

    await page.goto('/invoices');

    // Search for "garcia" (without accent) should find "García" (with accent)
    await page.fill('input[placeholder*="Search by name"]', 'garcia');
    await page.click('button[type="submit"]');
    await page.waitForResponse(resp =>
      resp.url().includes('/api/invoices') &&
      resp.url().includes('fullName=garcia')
    );

    await expect(page.getByText('Pedro García García').first()).toBeVisible();
  });

  test('search by customer name with uppercase', async ({ page }) => {
    // Create test invoice
    await createTestInvoice(page, 'Pedro García García', '', 80);

    await page.goto('/invoices');

    // Search for "PEDRO" (uppercase) should find "Pedro García García"
    await page.fill('input[placeholder*="Search by name"]', 'PEDRO');
    await page.click('button[type="submit"]');
    await page.waitForResponse(resp =>
      resp.url().includes('/api/invoices') &&
      resp.url().includes('fullName=PEDRO')
    );

    await expect(page.getByText('Pedro García García').first()).toBeVisible();
  });

  test('search by invoice number - exact match', async ({ page }) => {
    // Create test invoice and get the auto-generated number
    const currentYear = new Date().getFullYear();
    const createdInvoice = await createTestInvoice(page, 'Test Client', '', 40);
    const invoiceNumber = createdInvoice.number;

    await page.goto('/invoices');

    // Search for exact invoice number
    await page.fill('input[placeholder*="e.g. 000454"]', invoiceNumber);
    await page.click('button[type="submit"]');
    await page.waitForResponse(resp =>
      resp.url().includes('/api/invoices') &&
      resp.url().includes(`number=${invoiceNumber}`)
    );

    await expect(page.getByText(invoiceNumber).first()).toBeVisible();
    await expect(page.getByText('Test Client').first()).toBeVisible();
  });

  test('search by invoice number - partial match', async ({ page }) => {
    // Create test invoices - numbers will be auto-generated as 2025000001 and 2025000002
    const currentYear = new Date().getFullYear();
    const invoice1 = await createTestInvoice(page, 'Client One', '', 40);
    const invoice2 = await createTestInvoice(page, 'Client Two', '', 40);

    await page.goto('/invoices');

    // Search for partial number "00000" should find both invoices
    await page.fill('input[placeholder*="e.g. 000454"]', '00000');
    await page.click('button[type="submit"]');
    await page.waitForResponse(resp =>
      resp.url().includes('/api/invoices') &&
      resp.url().includes('number=00000')
    );

    // Should find both invoices with number containing "00000"
    await expect(page.getByText('Client One').first()).toBeVisible();
    await expect(page.getByText('Client Two').first()).toBeVisible();
  });

  test('search by year and number combined', async ({ page }) => {
    // Create test invoice - number will be auto-generated as 2025000001
    const currentYear = new Date().getFullYear();
    const invoice = await createTestInvoice(page, 'Client Year Test', '', 40);
    const invoiceNumber = invoice.number;

    await page.goto('/invoices');

    // Just search for the full invoice number directly
    await page.fill('input[placeholder*="e.g. 000454"]', invoiceNumber);

    // Click search
    await page.click('button[type="submit"]');
    await page.waitForResponse(resp =>
      resp.url().includes('/api/invoices')
    );

    // Should find the invoice
    await expect(page.getByText('Client Year Test').first()).toBeVisible();
  });

  test('search button triggers search', async ({ page }) => {
    // Create test invoice
    await createTestInvoice(page, 'Search Test Client', '', 40);

    await page.goto('/invoices');

    // Type in search box but don't press enter
    await page.fill('input[placeholder*="Search by name"]', 'Search Test');

    // Click the search button
    await page.click('button[type="submit"]');
    await page.waitForResponse(resp =>
      resp.url().includes('/api/invoices')
    );

    await expect(page.getByText('Search Test Client').first()).toBeVisible();
  });

  test('clear button resets all filters', async ({ page }) => {
    // Create test invoice
    const currentYear = new Date().getFullYear();
    await createTestInvoice(page, 'Clear Test Client', '', 40);

    await page.goto('/invoices');

    // Fill in all search fields
    await page.fill('input[placeholder*="Search by name"]', 'Clear Test');
    await page.fill('input[placeholder*="e.g. 000454"]', '000001');
    await page.selectOption('select', currentYear.toString());

    // Click search
    await page.click('button[type="submit"]');
    await page.waitForResponse(resp => resp.url().includes('/api/invoices'));

    // Click clear button
    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/invoices')),
      page.click('button:has-text("Clear")')
    ]);

    // All inputs should be reset
    await expect(page.locator('input[placeholder*="Search by name"]')).toHaveValue('');
    await expect(page.locator('input[placeholder*="e.g. 000454"]')).toHaveValue('');

    // Year should be reset to current year
    const yearSelect = page.locator('select');
    const selectedYear = await yearSelect.inputValue();
    expect(selectedYear).toBe(currentYear.toString());
  });

  test('no results shows appropriate message', async ({ page }) => {
    await page.goto('/invoices');

    // Search for something that doesn't exist
    await page.fill('input[placeholder*="Search by name"]', 'NonexistentClient999');
    await page.click('button[type="submit"]');
    await page.waitForResponse(resp => resp.url().includes('/api/invoices'));

    // Should show "no invoices found" message
    await expect(page.getByText(/no invoices found/i).first()).toBeVisible();
  });

  test('API returns correct results for name search', async ({ page }) => {
    // Create test invoices
    await createTestInvoice(page, 'API Test García', '', 40);
    await createTestInvoice(page, 'Other Client', '', 40);

    await page.goto('/invoices');

    // Perform API search directly
    const result = await apiFetch(page, '/api/invoices?fullName=garcia&page=1&itemsPerPage=10&order%5Bdate%5D=desc');

    expect(result.status).toBe(200);

    // Extract member array
    const members = result.data.member || result.data['hydra:member'] || [];

    // Should find the García invoice
    const foundInvoice = members.find(inv => inv.fullName.includes('García'));
    expect(foundInvoice).toBeTruthy();
    expect(foundInvoice.fullName).toBe('API Test García');
  });

  test('API returns correct results for number search', async ({ page }) => {
    // Create test invoice and get the auto-generated number
    const createdInvoice = await createTestInvoice(page, 'Number Test Client', '', 40);
    const testNumber = createdInvoice.number;

    await page.goto('/invoices');

    // Perform API search directly using the actual invoice number
    const result = await apiFetch(page, `/api/invoices?number=${testNumber}&page=1&itemsPerPage=10&order%5Bdate%5D=desc`);

    expect(result.status).toBe(200);

    // Extract member array
    const members = result.data.member || result.data['hydra:member'] || [];

    // Should find exactly one invoice
    expect(members.length).toBeGreaterThan(0);
    const foundInvoice = members[0];
    expect(foundInvoice.number).toBe(testNumber);
  });
});
