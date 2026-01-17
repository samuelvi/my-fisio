// @ts-check
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

async function resetDbEmpty(request) {
  const response = await request.post('/api/test/reset-db-empty');
  expect(response.ok()).toBeTruthy();
}

test('invoice management flow', async ({ page, request, context }) => {
  await resetDbEmpty(request);
  await loginAsAdmin(page, context);

  // 1. No invoices empty state
  await page.goto('/invoices');
  await expect(page.locator('body')).toContainText(/No invoices found|No se han encontrado facturas/i);

  // 2. Create a new invoice
  await page.getByRole('link', { name: /New Invoice|Nueva Factura/i }).click();
  await expect(page).toHaveURL('/invoices/new');

  // Fill customer info
  await page.locator('#invoice-customerName').fill('Test Invoice Customer');
  await page.locator('#invoice-customerTaxId').fill('12345678X');
  await page.locator('#invoice-customerAddress').fill('Test Address 123');

  // Fill one line
  await page.getByTestId('line-concept-0').fill('Physio Session');
  await page.getByTestId('line-price-0').fill('50');

  // Save
  await page.getByTestId('confirm-issuance-btn').click();

  await page.waitForURL(/\/invoices$/);
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.locator('body')).toContainText('Test Invoice Customer');
});
