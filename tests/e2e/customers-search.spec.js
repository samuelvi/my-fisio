// @ts-check
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

async function resetDbEmpty(request) {
  const response = await request.post('/api/test/reset-db-empty');
  expect(response.ok()).toBeTruthy();
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
  test.beforeEach(async ({ page, request, context }) => {
    await resetDbEmpty(request);
    await loginAsAdmin(page, context);
    
    // Seed some customers
    await createTestCustomer(page, 'John', 'Doe', '12345678L');
    await createTestCustomer(page, 'Jane', 'Smith', '87654321X');
    await createTestCustomer(page, 'Roberto', 'Gómez', '11223344A');
  });

  test('search by name is case-insensitive and partial', async ({ page }) => {
    await page.goto('/customers');

    // Search for "john" (Spanish label: Nombre del Cliente)
    await page.locator('input[type="text"]').first().fill('john');
    await page.locator('button[type="submit"]').click();
    
    await page.waitForResponse(resp => resp.url().includes('/api/customers') && resp.url().includes('fullName=john'));

    await expect(page.getByText('John Doe').first()).toBeVisible();
    await expect(page.getByText('Jane Smith').first()).not.toBeVisible();
  });

  test('search by tax id is partial', async ({ page }) => {
    await page.goto('/customers');

    // Search for "12345"
    await page.locator('input[type="text"]').nth(1).fill('12345');
    await page.locator('button[type="submit"]').click();
    
    await page.waitForResponse(resp => resp.url().includes('/api/customers') && resp.url().includes('taxId=12345'));

    await expect(page.getByText('John Doe').first()).toBeVisible();
    await expect(page.getByText('12345678L').first()).toBeVisible();
  });

  test('search by name with accents', async ({ page }) => {
    await page.goto('/customers');

    await page.locator('input[type="text"]').first().fill('gomez');
    await page.locator('button[type="submit"]').click();
    
    await expect(page.getByText('Roberto Gómez').first()).toBeVisible();
  });

  test('clear button resets search', async ({ page }) => {
    await page.goto('/customers');

    await page.locator('input[type="text"]').first().fill('John');
    await page.locator('button[type="submit"]').click();
    
    await expect(page.locator('tbody tr')).toHaveCount(1);

    await page.click('button:has-text("Limpiar"), button:has-text("Clear")');
    
    await expect(page.locator('input[type="text"]').first()).toHaveValue('');
    await expect(page.locator('tbody tr')).toHaveCount(3);
  });
});