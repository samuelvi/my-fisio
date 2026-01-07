import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test('debug invoice save console logs', async ({ page, context }) => {
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  
  await loginAsAdmin(page, context);
  await page.goto('/invoices/new');
  await page.waitForLoadState('networkidle');
  
  await page.locator('#invoice-customerName').fill('Success Save');
  await page.locator('#invoice-customerTaxId').fill('12345678X');
  await page.locator('#invoice-address').fill('Addr');
  await page.getByTestId('line-concept-0').fill('Item');
  await page.getByTestId('line-price-0').fill('50');
  
  await page.locator('#invoice-customerName').blur();
  await page.waitForTimeout(500);

  await page.getByTestId('confirm-issuance-btn').click();
  
  await page.waitForTimeout(3000);
});
