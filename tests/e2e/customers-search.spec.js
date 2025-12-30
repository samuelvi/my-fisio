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

async function createTestCustomer(page, firstName, lastName, taxId) {
  return await page.evaluate(async ({ firstName, lastName, taxId }) => {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/ld+json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        firstName,
        lastName,
        taxId,
        billingAddress: 'Test Address'
      }),
    });
    return await response.json();
  }, { firstName, lastName, taxId });
}

test.describe('Customer Search', () => {
  test.beforeEach(async ({ page, request }) => {
    await page.addInitScript(() => {
      localStorage.setItem('app_locale', 'en');
    });
    await resetDbEmpty(request);
    await login(page);
    
    // Seed some customers
    await createTestCustomer(page, 'John', 'Doe', '12345678L');
    await createTestCustomer(page, 'Jane', 'Smith', '87654321X');
    await createTestCustomer(page, 'Roberto', 'Gómez', '11223344A');
  });

  test('search by name is case-insensitive and partial', async ({ page }) => {
    await page.goto('/customers');

    // Search for "john"
    await page.fill('input[placeholder*="Search by name"]', 'john');
    await page.click('button:has-text("Search")');
    
    await page.waitForResponse(resp => resp.url().includes('/api/customers') && resp.url().includes('fullName=john'));

    await expect(page.getByText('John Doe').first()).toBeVisible();
    await expect(page.getByText('Jane Smith').first()).not.toBeVisible();

    // Clear and search for "smith"
    await page.click('button:has-text("Clear")');
    await page.fill('input[placeholder*="Search by name"]', 'smith');
    await page.click('button:has-text("Search")');
    
    await expect(page.getByText('Jane Smith').first()).toBeVisible();
    await expect(page.getByText('John Doe').first()).not.toBeVisible();
  });

  test('search by tax id is partial', async ({ page }) => {
    await page.goto('/customers');

    // Search for "12345"
    await page.fill('input[placeholder*="Search by tax ID"]', '12345');
    await page.click('button:has-text("Search")');
    
    await page.waitForResponse(resp => resp.url().includes('/api/customers') && resp.url().includes('taxId=12345'));

    await expect(page.getByText('John Doe').first()).toBeVisible();
    await expect(page.getByText('12345678L').first()).toBeVisible();
    await expect(page.getByText('Jane Smith').first()).not.toBeVisible();
  });

  test('search by name with accents', async ({ page }) => {
    await page.goto('/customers');

    // Search for "gomez" (no accent)
    await page.fill('input[placeholder*="Search by name"]', 'gomez');
    await page.click('button:has-text("Search")');
    
    // Note: Success depends on DB collation or server-side normalization. 
    // If it fails, we might need to search with exact accent.
    await expect(page.getByText('Roberto Gómez').first()).toBeVisible();
  });

  test('clear button resets search', async ({ page }) => {
    await page.goto('/customers');

    await page.fill('input[placeholder*="Search by name"]', 'John');
    await page.fill('input[placeholder*="Search by tax ID"]', '12345');
    await page.click('button:has-text("Search")');
    
    await expect(page.locator('tbody tr')).toHaveCount(1);

    await page.click('button:has-text("Clear")');
    
    await expect(page.locator('input[placeholder*="Search by name"]')).toHaveValue('');
    await expect(page.locator('input[placeholder*="Search by tax ID"]')).toHaveValue('');
    await expect(page.locator('tbody tr')).toHaveCount(3);
  });
});
