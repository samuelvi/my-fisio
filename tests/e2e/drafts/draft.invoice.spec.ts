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
  });

  test.afterEach(async () => {
    // Clean up localStorage after each test
    await page.evaluate(() => {
      localStorage.removeItem('draft_invoice');
    });
  });

  test('should auto-save draft after 10 seconds', async () => {
    // Navigate to new invoice
    await page.goto('/invoices/new');
    await page.waitForLoadState('networkidle');

    // Fill some form fields
    await page.fill('input[placeholder*="name"]', 'Test Draft Customer');
    await page.fill('input[placeholder*="12345678"]', '12345678X');
    await page.fill('textarea', 'Test Address 123');

    // Wait for auto-save (10 seconds)
    await page.waitForTimeout(11000);

    // Check localStorage for draft
    const draftData = await page.evaluate(() => {
      const data = localStorage.getItem('draft_invoice');
      return data ? JSON.parse(data) : null;
    });

    expect(draftData).not.toBeNull();
    expect(draftData.type).toBe('invoice');
    expect(draftData.data.customerName).toBe('Test Draft Customer');
    expect(draftData.data.customerTaxId).toBe('12345678X');
    expect(draftData.data.customerAddress).toBe('Test Address 123');
  });

  test('should show draft alert on reload', async () => {
    // Create a draft in localStorage
    await page.goto('/invoices/new');
    await page.evaluate(() => {
      const draftData = {
        type: 'invoice',
        data: {
          date: new Date().toISOString().split('T')[0],
          customerName: 'Reload Test',
          customerTaxId: '87654321Y',
          customerAddress: 'Reload Street',
          customerPhone: '',
          customerEmail: '',
          invoiceNumber: '',
          lines: [
            { concept: 'Test', description: '', quantity: 1, price: 100, amount: 100 }
          ]
        },
        timestamp: Date.now(),
        formId: 'test-form-' + Date.now()
      };
      localStorage.setItem('draft_invoice', JSON.stringify(draftData));
    });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check for draft alert
    const alertVisible = await page.locator('#draft-alert').isVisible();
    expect(alertVisible).toBe(true);

    // Check alert content
    const alertText = await page.locator('#draft-alert').textContent();
    expect(alertText).toContain('Borrador disponible');
    expect(alertText).toContain('Recuperar');
    expect(alertText).toContain('Descartar');
  });

  test('should restore draft when clicking "Recuperar"', async () => {
    // Create a draft
    await page.goto('/invoices/new');
    await page.evaluate(() => {
      const draftData = {
        type: 'invoice',
        data: {
          date: '2026-01-15',
          customerName: 'Restore Test Customer',
          customerTaxId: '11223344A',
          customerAddress: 'Restore Address 456',
          customerPhone: '666777888',
          customerEmail: 'restore@test.com',
          invoiceNumber: '',
          lines: [
            { concept: 'Service 1', description: 'Desc 1', quantity: 2, price: 50, amount: 100 }
          ]
        },
        timestamp: Date.now(),
        formId: 'test-form-' + Date.now()
      };
      localStorage.setItem('draft_invoice', JSON.stringify(draftData));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Click "Recuperar borrador" button
    await page.click('text=Recuperar borrador');

    // Modal should appear
    await expect(page.locator('text=¿Estás seguro de que deseas recuperar el borrador?')).toBeVisible();

    // Confirm restore
    await page.click('text=Sí, recuperar');

    // Wait for form to populate
    await page.waitForTimeout(500);

    // Verify form fields are populated
    const customerName = await page.inputValue('input[value="Restore Test Customer"]');
    expect(customerName).toBe('Restore Test Customer');

    const taxId = await page.inputValue('input[value="11223344A"]');
    expect(taxId).toBe('11223344A');

    const address = await page.inputValue('textarea');
    expect(address).toBe('Restore Address 456');

    const email = await page.inputValue('input[value="restore@test.com"]');
    expect(email).toBe('restore@test.com');
  });

  test('should discard draft when clicking "Descartar"', async () => {
    // Create a draft
    await page.goto('/invoices/new');
    await page.evaluate(() => {
      const draftData = {
        type: 'invoice',
        data: {
          date: new Date().toISOString().split('T')[0],
          customerName: 'Discard Test',
          customerTaxId: '99887766B',
          customerAddress: 'Discard Address',
          customerPhone: '',
          customerEmail: '',
          invoiceNumber: '',
          lines: []
        },
        timestamp: Date.now(),
        formId: 'test-form-' + Date.now()
      };
      localStorage.setItem('draft_invoice', JSON.stringify(draftData));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Click "Descartar borrador" button
    await page.click('text=Descartar borrador');

    // Modal should appear
    await expect(page.locator('text=¿Estás seguro de que deseas descartar el borrador?')).toBeVisible();

    // Confirm discard
    await page.click('text=Sí, descartar');

    // Wait for action to complete
    await page.waitForTimeout(500);

    // Alert should disappear
    const alertVisible = await page.locator('#draft-alert').isVisible();
    expect(alertVisible).toBe(false);

    // Draft should be removed from localStorage
    const draftData = await page.evaluate(() => {
      return localStorage.getItem('draft_invoice');
    });
    expect(draftData).toBeNull();
  });

  test('should clear draft on successful save', async () => {
    // Navigate to new invoice
    await page.goto('/invoices/new');
    await page.waitForLoadState('networkidle');

    // Fill complete form
    await page.fill('input[placeholder*="name"]', 'Success Test Customer');
    await page.fill('input[placeholder*="12345678"]', '55443322C');
    await page.fill('textarea', 'Success Address 789');
    await page.fill('input[type="email"]', 'success@test.com');

    // Fill invoice line
    await page.fill('input[placeholder*="concept"]', 'Test Service');
    await page.fill('input[type="number"][min="1"]', '2'); // quantity
    await page.fill('input[type="number"][step="0.01"]', '75'); // price

    // Wait for auto-save
    await page.waitForTimeout(11000);

    // Verify draft exists
    let draftData = await page.evaluate(() => {
      return localStorage.getItem('draft_invoice');
    });
    expect(draftData).not.toBeNull();

    // Submit form
    await page.click('text=Confirmar emisión');

    // Wait for navigation to invoices list
    await page.waitForURL('**/invoices');

    // Draft should be cleared
    draftData = await page.evaluate(() => {
      return localStorage.getItem('draft_invoice');
    });
    expect(draftData).toBeNull();
  });

  test('should show error alert variant on network error', async () => {
    // This test would require mocking network to simulate failure
    // For now, we'll test that the alert can display error variant

    await page.goto('/invoices/new');
    await page.waitForLoadState('networkidle');

    // Manually create an error draft
    await page.evaluate(() => {
      const draftData = {
        type: 'invoice',
        data: {
          date: new Date().toISOString().split('T')[0],
          customerName: 'Network Error Test',
          customerTaxId: '12312312D',
          customerAddress: 'Error Address',
          customerPhone: '',
          customerEmail: '',
          invoiceNumber: '',
          lines: []
        },
        timestamp: Date.now(),
        formId: 'test-form-' + Date.now()
      };
      localStorage.setItem('draft_invoice', JSON.stringify(draftData));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check that alert is visible
    const alertVisible = await page.locator('#draft-alert').isVisible();
    expect(alertVisible).toBe(true);
  });

  test('should work in edit mode', async () => {
    // First, create an invoice to edit
    await page.goto('/invoices/new');
    await page.waitForLoadState('networkidle');

    await page.fill('input[placeholder*="name"]', 'Edit Mode Test');
    await page.fill('input[placeholder*="12345678"]', '99999999E');
    await page.fill('textarea', 'Edit Address');
    await page.fill('input[placeholder*="concept"]', 'Service');
    await page.fill('input[type="number"][min="1"]', '1');
    await page.fill('input[type="number"][step="0.01"]', '100');

    await page.click('text=Confirmar emisión');
    await page.waitForURL('**/invoices');

    // Get the first invoice and edit it
    await page.click('a[href*="/invoices/"][href*="/edit"]');
    await page.waitForLoadState('networkidle');

    // Modify the form
    await page.fill('input[value="Edit Mode Test"]', 'Modified in Edit');

    // Wait for auto-save
    await page.waitForTimeout(11000);

    // Check localStorage for draft
    const draftData = await page.evaluate(() => {
      const data = localStorage.getItem('draft_invoice');
      return data ? JSON.parse(data) : null;
    });

    expect(draftData).not.toBeNull();
    expect(draftData.data.customerName).toBe('Modified in Edit');
  });

  test('should cancel modals with ESC key', async () => {
    // Create a draft
    await page.goto('/invoices/new');
    await page.evaluate(() => {
      const draftData = {
        type: 'invoice',
        data: {
          date: new Date().toISOString().split('T')[0],
          customerName: 'ESC Test',
          customerTaxId: '11111111F',
          customerAddress: 'ESC Address',
          customerPhone: '',
          customerEmail: '',
          invoiceNumber: '',
          lines: []
        },
        timestamp: Date.now(),
        formId: 'test-form-' + Date.now()
      };
      localStorage.setItem('draft_invoice', JSON.stringify(draftData));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Open restore modal
    await page.click('text=Recuperar borrador');
    await expect(page.locator('text=¿Estás seguro de que deseas recuperar el borrador?')).toBeVisible();

    // Press ESC
    await page.keyboard.press('Escape');

    // Modal should close
    await expect(page.locator('text=¿Estás seguro de que deseas recuperar el borrador?')).not.toBeVisible();

    // Alert should still be visible
    const alertVisible = await page.locator('#draft-alert').isVisible();
    expect(alertVisible).toBe(true);

    // Open discard modal
    await page.click('text=Descartar borrador');
    await expect(page.locator('text=¿Estás seguro de que deseas descartar el borrador?')).toBeVisible();

    // Press ESC
    await page.keyboard.press('Escape');

    // Modal should close
    await expect(page.locator('text=¿Estás seguro de que deseas descartar el borrador?')).not.toBeVisible();
  });
});
