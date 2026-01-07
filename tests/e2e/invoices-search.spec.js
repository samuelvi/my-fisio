// @ts-check
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

async function resetDbEmpty(request) {
  const response = await request.post('/api/test/reset-db-empty');
  expect(response.ok()).toBeTruthy();
}

async function createTestInvoice(page, data) {
  return await page.evaluate(async (invoiceData) => {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/ld+json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(invoiceData),
    });
    return await response.json();
  }, data);
}

test.describe('Invoice Search', () => {
  test.beforeEach(async ({ page, request, context }) => {
    await resetDbEmpty(request);
    await loginAsAdmin(page, context);
    
    // Seed some invoices
    const baseDate = new Date().toISOString();
    await createTestInvoice(page, {
      fullName: 'John Doe',
      taxId: '12345678L',
      address: 'Addr 1',
      date: baseDate,
      lines: [{ concept: 'Test', quantity: 1, price: 100, amount: 100 }],
      amount: 100
    });
    await createTestInvoice(page, {
      fullName: 'María García',
      taxId: '87654321X',
      address: 'Addr 2',
      date: baseDate,
      lines: [{ concept: 'Test', quantity: 1, price: 200, amount: 200 }],
      amount: 200
    });
  });

  test('search by customer name is case-insensitive', async ({ page }) => {
    await page.goto('/invoices');
    await page.locator('input[type="text"]').first().fill('john');
    await page.locator('button[type="submit"]').click();
    
    await expect(page.getByText('John Doe').first()).toBeVisible();
    await expect(page.getByText('María García').first()).not.toBeVisible();
  });

  test('search by customer name is accent-insensitive', async ({ page }) => {
    await page.goto('/invoices');
    await page.locator('input[type="text"]').first().fill('maria');
    await page.locator('button[type="submit"]').click();
    
    await expect(page.getByText('María García').first()).toBeVisible();
  });

  test('clear button resets all filters', async ({ page }) => {
    await page.goto('/invoices');
    await page.locator('input[type="text"]').first().fill('John');
    await page.locator('button[type="submit"]').click();
    
    await expect(page.locator('tbody tr')).toHaveCount(1);

    await page.click('button:has-text("Limpiar"), button:has-text("Clear")');
    await expect(page.locator('input[type="text"]').first()).toHaveValue('');
    await expect(page.locator('tbody tr')).toHaveCount(2);
  });
});