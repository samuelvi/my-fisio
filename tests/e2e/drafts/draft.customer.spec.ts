/**
 * E2E Tests - Customer Draft System
 *
 * End-to-end tests for draft functionality in customer forms
 */

import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

test.describe('Customer Draft System', () => {
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
    await page.goto('/customers/new');
    await page.waitForLoadState('networkidle');

    await page.getByLabel(/Nombre|First Name/i).fill('No Auto Save');
    await page.getByLabel(/Apellidos|Last Name/i).fill('Test');
    
    await page.waitForTimeout(6000);

    const draftData = await page.evaluate(() => localStorage.getItem('draft_customer'));
    expect(draftData).toBeNull();
  });

  test('should save draft explicitly when clicking save and show alert on network error', async ({ context }) => {
    await page.goto('/customers/new');
    await page.waitForLoadState('networkidle');

    const uniqueTaxId = `T${Date.now()}`;
    await page.getByLabel(/Nombre|First Name/i).fill('Network Error Test');
    await page.getByLabel(/Apellidos|Last Name/i).fill('Customer');
    await page.getByLabel(/Identificador Fiscal|Tax Identifier/i).fill(uniqueTaxId);
    await page.getByLabel(/Direcci.n|Address/i).fill('Error St 123');

    // Simulate network error
    await context.setOffline(true);
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: /Guardar|Save/i }).first().click();

    // The alert should appear
    await expect(page.locator('#draft-alert')).toBeVisible({ timeout: 15000 });

    const draftData = await page.evaluate(() => {
      const data = localStorage.getItem('draft_customer');
      return data ? JSON.parse(data) : null;
    });

    expect(draftData).not.toBeNull();
    expect(draftData.data.firstName).toBe('Network Error Test');
    expect(draftData.savedByError).toBe(true);
  });

  test('should show draft alert on reload (savedByError: true)', async () => {
    await page.goto('/customers/new');
    await page.evaluate(() => {
      localStorage.setItem('draft_customer', JSON.stringify({
        type: 'customer',
        data: { firstName: 'Reload Test' },
        timestamp: Date.now(),
        formId: 'test-123',
        savedByError: true
      }));
    });

    await page.reload();
    await expect(page.locator('#draft-alert')).toBeVisible({ timeout: 15000 });
  });

  test('should restore draft and KEEP savedByError flag/panel visible', async () => {
    await page.goto('/customers/new');
    await page.evaluate(() => {
      localStorage.setItem('draft_customer', JSON.stringify({
        type: 'customer',
        data: { firstName: 'Restore Me', lastName: 'Last', taxId: '123', billingAddress: 'Addr' },
        timestamp: Date.now(),
        formId: 'test-123',
        savedByError: true
      }));
    });

    await page.reload();
    await page.getByRole('button', { name: /Recuperar|Restore/i }).first().click();
    await page.getByRole('button', { name: /Sí, recuperar|Yes, restore/i }).first().click();

    await expect(page.getByLabel(/Nombre|First Name/i)).toHaveValue('Restore Me');
    await expect(page.locator('#draft-alert')).toBeVisible();
  });

  test('should NOT auto-save modifications after restoring draft from network error', async () => {
    await page.goto('/customers/new');
    await page.evaluate(() => {
      localStorage.setItem('draft_customer', JSON.stringify({
        type: 'customer',
        data: { firstName: 'Original', lastName: 'Last', taxId: '123', billingAddress: 'Addr' },
        timestamp: Date.now(),
        formId: 'test-123',
        savedByError: true
      }));
    });

    await page.reload();
    await page.getByRole('button', { name: /Recuperar|Restore/i }).first().click();
    await page.getByRole('button', { name: /Sí, recuperar|Yes, restore/i }).first().click();

    await page.getByLabel(/Nombre|First Name/i).fill('Modified');
    await page.waitForTimeout(6000);

    const draftData = await page.evaluate(() => {
      const d = localStorage.getItem('draft_customer');
      return d ? JSON.parse(d) : null;
    });
    expect(draftData.data.firstName).toBe('Original');
  });

  test('should clear draft on successful save', async () => {
    await page.goto('/customers/new');
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => localStorage.removeItem('draft_customer'));

    const uniqueTaxId = `S${Date.now()}`;
    await page.getByLabel(/Nombre|First Name/i).fill('Success');
    await page.getByLabel(/Apellidos|Last Name/i).fill('Test');
    await page.getByLabel(/Identificador Fiscal|Tax Identifier/i).fill(uniqueTaxId);
    await page.getByLabel(/Direcci.n|Address/i).fill('Addr');

    await page.getByRole('button', { name: /Guardar|Save/i }).first().click();
    
    await page.waitForURL(/\/customers$/);
    await page.waitForLoadState('networkidle');

    const draftData = await page.evaluate(() => localStorage.getItem('draft_customer'));
    expect(draftData).toBeNull();
  });
});