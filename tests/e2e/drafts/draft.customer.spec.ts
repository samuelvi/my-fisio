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

  test('should NOT auto-save draft automatically', async () => {
    await page.goto('/customers/new');
    await page.waitForLoadState('networkidle');

    await page.getByLabel(/First Name/i).fill('No Auto Save');
    await page.getByLabel(/Last Name/i).fill('Test');
    
    await page.waitForTimeout(6000);

    const draftData = await page.evaluate(() => localStorage.getItem('draft_customer'));
    expect(draftData).toBeNull();
  });

  test('should save draft explicitly when clicking save and show alert on network error', async ({ context }) => {
    await page.goto('/customers/new');
    await page.waitForLoadState('networkidle');

    const uniqueTaxId = `T${Date.now()}`;
    await page.getByLabel(/First Name/i).fill('Network Error Test');
    await page.getByLabel(/Last Name/i).fill('Customer');
    await page.getByLabel(/Tax Identifier/i).fill(uniqueTaxId);
    await page.getByLabel(/Address/i).fill('Error St 123');

    await context.setOffline(true);
    await page.getByRole('button', { name: /Save/i }).click();

    await expect(page.locator('#draft-alert')).toBeVisible();

    const draftData = await page.evaluate(() => {
      const data = localStorage.getItem('draft_customer');
      return data ? JSON.parse(data) : null;
    });

    expect(draftData).not.toBeNull();
    expect(draftData.data.firstName).toBe('Network Error Test');
    expect(draftData.savedByError).toBe(true);

    await context.setOffline(false);
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
    await expect(page.locator('#draft-alert')).toBeVisible();
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
    await page.click('text=Recuperar borrador');
    await page.click('text=Sí, recuperar');

    await expect(page.getByLabel(/First Name/i)).toHaveValue('Restore Me');
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
    await page.click('text=Recuperar borrador');
    await page.click('text=Sí, recuperar');

    await page.getByLabel(/First Name/i).fill('Modified');
    await page.waitForTimeout(6000);

    const draftData = await page.evaluate(() => {
      const d = localStorage.getItem('draft_customer');
      return d ? JSON.parse(d) : null;
    });
    expect(draftData.data.firstName).toBe('Original');
  });

  test('should allow modifying form and then recovering draft without error', async () => {
    await page.goto('/customers/new');
    await page.evaluate(() => {
      localStorage.setItem('draft_customer', JSON.stringify({
        type: 'customer',
        data: { firstName: 'Recoverable' },
        timestamp: Date.now(),
        formId: 'test-123',
        savedByError: true
      }));
    });

    await page.reload();
    await page.getByLabel(/First Name/i).fill('Dirty');
    await page.click('text=Recuperar borrador');
    await page.click('text=Sí, recuperar');

    await expect(page.getByLabel(/First Name/i)).toHaveValue('Recoverable');
  });

  test('should discard draft when clicking "Descartar"', async () => {
    await page.goto('/customers/new');
    await page.evaluate(() => {
      localStorage.setItem('draft_customer', JSON.stringify({
        type: 'customer',
        data: { firstName: 'Discard' },
        timestamp: Date.now(),
        formId: 'test-123',
        savedByError: true
      }));
    });

    await page.reload();
    await page.click('text=Descartar borrador');
    await page.click('text=Sí, descartar');

    await expect(page.locator('#draft-alert')).not.toBeVisible();
    const draftData = await page.evaluate(() => localStorage.getItem('draft_customer'));
    expect(draftData).toBeNull();
  });

  test('should clear draft on successful save', async () => {
    await page.goto('/customers/new');
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => localStorage.removeItem('draft_customer'));

    const uniqueTaxId = `S${Date.now()}`;
    await page.getByLabel(/First Name/i).fill('Success');
    await page.getByLabel(/Last Name/i).fill('Test');
    await page.getByLabel(/Tax Identifier/i).fill(uniqueTaxId);
    await page.getByLabel(/Address/i).fill('Addr');

    await page.getByRole('button', { name: /Save/i }).click();
    
    // Explicitly wait for navigation to the list
    await page.waitForURL(/\/customers$/);
    await page.waitForLoadState('networkidle');

    // Check draft
    const draftData = await page.evaluate(() => localStorage.getItem('draft_customer'));
    expect(draftData).toBeNull();
  });

  test('should work in edit mode', async () => {
    // 1. Create a customer manually to ensure one exists
    await page.goto('/customers/new');
    const uniqueTaxId = `E${Date.now()}`;
    await page.getByLabel(/First Name/i).fill('EditTarget');
    await page.getByLabel(/Last Name/i).fill('Customer');
    await page.getByLabel(/Tax Identifier/i).fill(uniqueTaxId);
    await page.getByLabel(/Address/i).fill('Addr');
    await page.getByRole('button', { name: /Save/i }).click();
    
    await page.waitForURL(/\/customers$/);
    await page.waitForLoadState('networkidle');

    // 2. Find ANY edit link
    const editLink = page.locator('a[href*="/edit"]').first();
    await expect(editLink).toBeVisible();
    await editLink.click();
    
    await page.waitForLoadState('networkidle');
    await page.getByLabel(/First Name/i).fill('Modified');
    await page.getByLabel(/First Name/i).blur();

    const draftData = await page.evaluate(() => localStorage.getItem('draft_customer'));
    expect(draftData).toBeNull();

    await page.getByRole('button', { name: /Save/i }).click();
    await page.waitForURL(/\/customers$/);
  });
});
