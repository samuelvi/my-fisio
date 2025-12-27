// @ts-check
import { test, expect } from '@playwright/test';

async function resetDb(request) {
  // Use standard reset-db to have some patients
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

async function searchPatients(page, searchTerm, clickButton = false) {
  await page.fill('input[placeholder*="Search"]', searchTerm);

  if (clickButton) {
    // Click the search button instead of waiting for auto-search
    await Promise.all([
      page.waitForResponse(resp =>
        resp.url().includes('/api/patients') &&
        resp.url().includes(`search=${encodeURIComponent(searchTerm)}`)
      ),
      page.click('button[type="submit"]')
    ]);
  } else {
    // Wait for auto-search (if enabled)
    await page.waitForResponse(resp =>
      resp.url().includes('/api/patients') &&
      resp.url().includes(`search=${encodeURIComponent(searchTerm)}`)
    );
  }
}

test.describe('Patient Search', () => {
  test.beforeEach(async ({ page, request }) => {
    await page.addInitScript(() => {
      localStorage.setItem('app_locale', 'en');
    });
    await resetDb(request);
    await login(page);
    await page.goto('/patients');
  });

  test('normal search is case-insensitive', async ({ page }) => {
    // Search for "afirst" (lowercase) should match "AFirst Patient"
    await page.fill('input[placeholder*="Search"]', 'afirst');
    await page.click('button[type="submit"]');
    await page.waitForResponse(resp => resp.url().includes('/api/patients'));

    await expect(page.getByText('AFirst Patient')).toBeVisible();

    // Clear and search for "zlast" (lowercase) should match "ZLast Patient"
    await page.click('button:has-text("Clear")');
    await page.fill('input[placeholder*="Search"]', 'zlast');
    await page.click('button[type="submit"]');
    await page.waitForResponse(resp => resp.url().includes('/api/patients'));

    await expect(page.getByText('ZLast Patient')).toBeVisible();
  });

  test('normal search with uppercase', async ({ page }) => {
    // Search for "AFIRST" (uppercase) should match "AFirst Patient"
    await page.fill('input[placeholder*="Search"]', 'AFIRST');
    await page.click('button[type="submit"]');
    await page.waitForResponse(resp => resp.url().includes('/api/patients'));

    await expect(page.getByText('AFirst Patient')).toBeVisible();
  });

  test('normal search with full name', async ({ page }) => {
    // Search for full name "afirst patient" should match "AFirst Patient"
    await page.fill('input[placeholder*="Search"]', 'afirst patient');
    await page.click('button[type="submit"]');
    await page.waitForResponse(resp => resp.url().includes('/api/patients'));

    await expect(page.getByText('AFirst Patient')).toBeVisible();
  });

  test('search without accent finds accented name', async ({ page }) => {
    // Search for "garcia" (without accent) should find "José García"
    await page.fill('input[placeholder*="Search"]', 'garcia');
    await page.click('button[type="submit"]');
    await page.waitForResponse(resp => resp.url().includes('/api/patients'));

    await expect(page.getByText('José García')).toBeVisible();
  });

  test('search with accent finds accented name', async ({ page }) => {
    // Search for "García" (with accent) should find "José García"
    await page.fill('input[placeholder*="Search"]', 'García');
    await page.click('button[type="submit"]');
    await page.waitForResponse(resp => resp.url().includes('/api/patients'));

    await expect(page.getByText('José García')).toBeVisible();
  });

  test('search without accent finds different accented names', async ({ page }) => {
    // Search for "lopez" (without accent) should find "María López"
    await page.fill('input[placeholder*="Search"]', 'lopez');
    await page.click('button[type="submit"]');
    await page.waitForResponse(resp => resp.url().includes('/api/patients'));

    await expect(page.getByText('María López')).toBeVisible();

    // Clear and search for "angel" (without accent) should find "Ángel Martínez"
    await page.click('button:has-text("Clear")');
    await page.fill('input[placeholder*="Search"]', 'angel');
    await page.click('button[type="submit"]');
    await page.waitForResponse(resp => resp.url().includes('/api/patients'));

    await expect(page.getByText('Ángel Martínez')).toBeVisible();

    // Clear and search for "ines" (without accent) should find "Inés Pérez"
    await page.click('button:has-text("Clear")');
    await page.fill('input[placeholder*="Search"]', 'ines');
    await page.click('button[type="submit"]');
    await page.waitForResponse(resp => resp.url().includes('/api/patients'));

    await expect(page.getByText('Inés Pérez')).toBeVisible();
  });

  test('fuzzy search finds typos', async ({ page }) => {
    // Enable fuzzy search toggle
    const fuzzyToggle = page.locator('input[type="checkbox"]').first(); // Assuming this is the fuzzy toggle
    await fuzzyToggle.check();

    // Search for "afirts" (typo) should match "AFirst Patient" with fuzzy search
    await page.fill('input[placeholder*="Search"]', 'afirts');
    await page.click('button[type="submit"]');
    await page.waitForResponse(resp =>
      resp.url().includes('/api/patients') &&
      resp.url().includes('fuzzy=true')
    );

    // With fuzzy search, it should find similar names
    // Note: This might find multiple patients with similar names
    const patientRows = page.locator('tbody tr');
    await expect(patientRows).not.toHaveCount(0);
  });

  test('search button triggers search', async ({ page }) => {
    // Type in search box but don't press enter
    await page.fill('input[placeholder*="Search"]', 'afirst');

    // Click the search button
    const [response] = await Promise.all([
      page.waitForResponse(resp =>
        resp.url().includes('/api/patients') &&
        resp.url().includes('search=afirst')
      ),
      page.click('button[type="submit"]')
    ]);

    expect(response.status()).toBe(200);
    await expect(page.getByText('AFirst Patient')).toBeVisible();
  });

  test('clear button resets search', async ({ page }) => {
    // Perform a search
    await page.fill('input[placeholder*="Search"]', 'afirst');
    await page.click('button[type="submit"]');
    await page.waitForResponse(resp => resp.url().includes('/api/patients'));

    await expect(page.getByText('AFirst Patient')).toBeVisible();

    // Click clear button
    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/patients')),
      page.click('button:has-text("Clear")')
    ]);

    // Search input should be empty
    await expect(page.locator('input[placeholder*="Search"]')).toHaveValue('');

    // Should show all patients (or initial state)
    const patientRows = page.locator('tbody tr');
    const count = await patientRows.count();
    expect(count).toBeGreaterThan(1); // Should have multiple patients
  });

  test('no results shows appropriate message', async ({ page }) => {
    // Search for something that doesn't exist
    await page.fill('input[placeholder*="Search"]', 'zzzznonexistent999');
    await page.click('button[type="submit"]');
    await page.waitForResponse(resp => resp.url().includes('/api/patients'));

    // Should show "no patients found" message
    await expect(page.getByText(/no patients found/i)).toBeVisible();
  });
});
