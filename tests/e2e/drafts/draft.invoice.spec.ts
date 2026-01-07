/**
 * E2E Tests - Invoice Draft System
 *
 * End-to-end tests for draft functionality in invoice forms
 */

import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

test.describe('Invoice Draft System', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage, context }) => {
    page = testPage;
    await loginAsAdmin(page, context);

    // Clean any existing drafts after login
    await page.evaluate(() => {
      Object.keys(localStorage)
        .filter(key => key.startsWith('draft_'))
        .forEach(key => localStorage.removeItem(key));
    });
  });

  test.afterEach(async ({ context }) => {
    await context.setOffline(false);
  });

  test('should NOT auto-save draft automatically', async () => {
    await page.goto('/invoices/new');
    await page.waitForLoadState('networkidle');

    await page.locator('#invoice-customerName').fill('No Auto Save');
    await page.getByTestId('line-concept-0').fill('Item');
    
    await page.waitForTimeout(6000);

    const draftData = await page.evaluate(() => localStorage.getItem('draft_invoice'));
    expect(draftData).toBeNull();
  });

  test('should save draft explicitly when clicking save and show alert on network error', async ({ context }) => {
    await page.goto('/invoices/new');
    await page.waitForLoadState('networkidle');

    await page.locator('#invoice-customerName').fill('Network Error Test');
    await page.locator('#invoice-customerTaxId').fill('12345678A');
    await page.locator('#invoice-customerAddress').fill('Error St 123');
    await page.getByTestId('line-concept-0').fill('Service');
    await page.getByTestId('line-price-0').fill('100');

    await context.setOffline(true);
    await page.waitForTimeout(1000);

    await page.getByTestId('confirm-issuance-btn').click();

    await expect(page.locator('#draft-alert')).toBeVisible({ timeout: 15000 });

    const draftData = await page.evaluate(() => {
      const data = localStorage.getItem('draft_invoice');
      return data ? JSON.parse(data) : null;
    });

    expect(draftData).not.toBeNull();
    expect(draftData.savedByError).toBe(true);
  });

  test('should show draft alert on reload', async () => {
    await page.goto('/invoices/new');
    await page.evaluate(() => {
      localStorage.setItem('draft_invoice', JSON.stringify({
        type: 'invoice',
        data: { customerName: 'Reload Test' },
        timestamp: Date.now(),
        formId: 'test-123',
        savedByError: true
      }));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#draft-alert')).toBeVisible({ timeout: 15000 });
  });

  test('should restore draft when clicking "Recuperar"', async () => {
    await page.goto('/invoices/new');
    await page.evaluate(() => {
      localStorage.setItem('draft_invoice', JSON.stringify({
        type: 'invoice',
        data: { 
            customerName: 'Restore Me', 
            customerTaxId: '123', 
            customerAddress: 'Addr',
            lines: [{ concept: 'Restored Item', quantity: 1, price: 50, amount: 50 }]
        },
        timestamp: Date.now(),
        formId: 'test-123',
        savedByError: true
      }));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await page.getByRole('button', { name: /Recuperar borrador|Restore draft/i }).first().click();
    await page.getByTestId('confirm-draft-btn').click();

    await expect(page.getByTestId('confirm-draft-btn')).toBeHidden({ timeout: 10000 });
    await page.waitForTimeout(1000);

    await expect(page.locator('#invoice-customerName')).toHaveValue('Restore Me');
    await expect(page.getByTestId('line-concept-0')).toHaveValue('Restored Item');
  });

  test('should allow modifying form and then recovering draft without error', async () => {
    await page.goto('/invoices/new');
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      localStorage.setItem('draft_invoice', JSON.stringify({
        type: 'invoice',
        data: { customerName: 'Recoverable' },
        timestamp: Date.now(),
        formId: 'test-123',
        savedByError: true
      }));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await page.locator('#invoice-customerName').fill('Dirty');
    
    await page.getByRole('button', { name: /Recuperar borrador|Restore draft/i }).first().click();
    await page.getByTestId('confirm-draft-btn').click();

    await expect(page.getByTestId('confirm-draft-btn')).toBeHidden({ timeout: 15000 });
    await page.waitForTimeout(1000);

    await expect(page.locator('#invoice-customerName')).toHaveValue('Recoverable', { timeout: 10000 });
  });

  test('should discard draft when clicking "Descartar"', async () => {
    await page.goto('/invoices/new');
    await page.evaluate(() => {
      localStorage.setItem('draft_invoice', JSON.stringify({
        type: 'invoice',
        data: { customerName: 'Discard' },
        timestamp: Date.now(),
        formId: 'test-123',
        savedByError: true
      }));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await page.getByRole('button', { name: /Descartar borrador|Discard draft/i }).first().click();
    await page.getByTestId('confirm-draft-btn').click();

    await expect(page.locator('#draft-alert')).not.toBeVisible();
    const draftData = await page.evaluate(() => localStorage.getItem('draft_invoice'));
    expect(draftData).toBeNull();
  });

  test('should clear draft on successful save', async () => {
    await page.goto('/invoices/new');
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => localStorage.removeItem('draft_invoice'));

    await page.locator('#invoice-customerName').fill('Success Save');
    await page.locator('#invoice-customerTaxId').fill('12345678X');
    await page.locator('#invoice-customerAddress').fill('Addr');
    await page.getByTestId('line-concept-0').fill('Item');
    await page.getByTestId('line-price-0').fill('50');
    
    await page.getByTestId('confirm-issuance-btn').click();
    
    await page.waitForURL(/\/invoices$/, { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    const draftData = await page.evaluate(() => localStorage.getItem('draft_invoice'));
    expect(draftData).toBeNull();
  });
});
