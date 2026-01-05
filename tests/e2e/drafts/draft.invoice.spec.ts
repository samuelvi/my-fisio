/**
 * E2E Tests - Invoice Draft System
 *
 * End-to-end tests for draft functionality in invoice forms
 */

import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';
import { setInvoiceInputValue, invoiceInput } from '../helpers/invoice-helpers';

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

  test.beforeEach(async () => {
    // Also clean before each test to ensure clean slate
    await page.evaluate(() => {
      localStorage.removeItem('draft_invoice');
    });
  });

  test('should auto-save draft after 5 seconds', async () => {
    // Navigate to new invoice
    await page.goto('/invoices/new');
    await page.waitForLoadState('networkidle');

    // Fill some form fields
    await setInvoiceInputValue(page, 'Customer Name', 'Test Draft Customer');
    await setInvoiceInputValue(page, 'Tax Identifier (CIF/NIF)', '12345678X');
    await setInvoiceInputValue(page, 'Address', 'Test Address 123');

    // Wait for at least one full auto-save cycle after filling (5s + margin)
    await page.waitForTimeout(7000);

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
    // Create a draft in localStorage with savedByError: true
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
        formId: 'test-form-' + Date.now(),
        savedByError: true // Network error draft
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
    expect(alertText).toContain('Error de red');
    expect(alertText).toContain('Recuperar borrador');
    expect(alertText).toContain('Descartar borrador');
  });

  test('should restore draft when clicking "Recuperar"', async () => {
    // Create a draft with savedByError: true
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
        formId: 'test-form-' + Date.now(),
        savedByError: true // Network error draft
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
    // Create a draft with savedByError: true
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
        formId: 'test-form-' + Date.now(),
        savedByError: true // Network error draft
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
    await setInvoiceInputValue(page, 'Customer Name', 'Success Test Customer');
    await setInvoiceInputValue(page, 'Tax Identifier (CIF/NIF)', '55443322C');
    await setInvoiceInputValue(page, 'Address', 'Success Address 789');
    await setInvoiceInputValue(page, 'Email', 'success@test.com');

    // Fill invoice line
    await setInvoiceInputValue(page, 'Concept', 'Test Service');
    await setInvoiceInputValue(page, 'Qty', '2'); // quantity
    await page.fill('input[type="number"][step="0.01"]', '75'); // price

    // Wait for auto-save (5 seconds)
    await page.waitForTimeout(6000);

    // Verify draft exists
    let draftData = await page.evaluate(() => {
      return localStorage.getItem('draft_invoice');
    });
    expect(draftData).not.toBeNull();

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for navigation to invoices list
    await page.waitForURL('**/invoices');

    // Draft should be cleared
    draftData = await page.evaluate(() => {
      return localStorage.getItem('draft_invoice');
    });
    expect(draftData).toBeNull();
  });

  test('should show RED alert ONLY on network error with savedByError:true', async () => {
    await page.goto('/invoices/new');
    await page.waitForLoadState('networkidle');

    // Create draft with savedByError: true (simulating network error)
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
          lines: [
            { concept: 'Test', description: '', quantity: 1, price: 100, amount: 100 }
          ]
        },
        timestamp: Date.now(),
        formId: 'test-form-' + Date.now(),
        savedByError: true // Key difference
      };
      localStorage.setItem('draft_invoice', JSON.stringify(draftData));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Alert should be visible (red variant)
    const alertVisible = await page.locator('#draft-alert').isVisible();
    expect(alertVisible).toBe(true);

    // Should contain error message
    const alertText = await page.locator('#draft-alert').textContent();
    expect(alertText).toContain('Error de red');
    expect(alertText).toContain('No se pudo guardar');
  });

  test('should NOT show alert for regular auto-save (savedByError:false)', async () => {
    await page.goto('/invoices/new');
    await page.waitForLoadState('networkidle');

    // Create draft WITHOUT savedByError (regular auto-save)
    await page.evaluate(() => {
      const draftData = {
        type: 'invoice',
        data: {
          date: new Date().toISOString().split('T')[0],
          customerName: 'Auto Save Test',
          customerTaxId: '99999999X',
          customerAddress: 'Auto Save Address',
          customerPhone: '',
          customerEmail: '',
          invoiceNumber: '',
          lines: []
        },
        timestamp: Date.now(),
        formId: 'test-form-' + Date.now(),
        savedByError: false // Regular auto-save
      };
      localStorage.setItem('draft_invoice', JSON.stringify(draftData));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Alert should NOT be visible for regular auto-save
    const alertVisible = await page.locator('#draft-alert').isVisible();
    expect(alertVisible).toBe(false);
  });

  test('should preserve savedByError:true across multiple auto-saves', async () => {
    await page.goto('/invoices/new');
    await page.waitForLoadState('networkidle');

    // Fill form
    await setInvoiceInputValue(page, 'Customer Name', 'Preserve Test');
    await setInvoiceInputValue(page, 'Tax Identifier (CIF/NIF)', '11111111A');
    await setInvoiceInputValue(page, 'Address', 'Test Address');

    // Wait for first auto-save to capture the data
    await page.waitForTimeout(7000);

    // Manually set savedByError: true (simulating network error happened)
    await page.evaluate(() => {
      const existing = localStorage.getItem('draft_invoice');
      if (existing) {
        const draft = JSON.parse(existing);
        draft.savedByError = true;
        localStorage.setItem('draft_invoice', JSON.stringify(draft));
      }
    });

    // Wait for another auto-save cycle (5 seconds)
    await page.waitForTimeout(6000);

    // Check that savedByError is still true
    const draftData = await page.evaluate(() => {
      const data = localStorage.getItem('draft_invoice');
      return data ? JSON.parse(data) : null;
    });

    expect(draftData).not.toBeNull();
    expect(draftData.savedByError).toBe(true);
  });

  test('should clear savedByError flag when discarding draft', async () => {
    await page.goto('/invoices/new');

    // Create draft with savedByError: true
    await page.evaluate(() => {
      const draftData = {
        type: 'invoice',
        data: {
          date: new Date().toISOString().split('T')[0],
          customerName: 'Discard Error Test',
          customerTaxId: '88888888H',
          customerAddress: 'Error Address',
          customerPhone: '',
          customerEmail: '',
          invoiceNumber: '',
          lines: []
        },
        timestamp: Date.now(),
        formId: 'test-form-' + Date.now(),
        savedByError: true
      };
      localStorage.setItem('draft_invoice', JSON.stringify(draftData));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Alert should be visible
    await expect(page.locator('#draft-alert')).toBeVisible();

    // Discard draft
    await page.click('text=Descartar borrador');
    await page.click('text=Sí, descartar');
    await page.waitForTimeout(500);

    // Draft should be gone
    const draftData = await page.evaluate(() => {
      return localStorage.getItem('draft_invoice');
    });
    expect(draftData).toBeNull();

    // Alert should be gone
    await expect(page.locator('#draft-alert')).not.toBeVisible();
  });

  test('should restore draft from network error and clear savedByError flag', async () => {
    await page.goto('/invoices/new');

    // Create draft with savedByError: true
    await page.evaluate(() => {
      const draftData = {
        type: 'invoice',
        data: {
          date: '2026-01-20',
          customerName: 'Restore Error Test',
          customerTaxId: '77777777G',
          customerAddress: 'Restore Error Address',
          customerPhone: '123456789',
          customerEmail: 'error@test.com',
          invoiceNumber: '',
          lines: [
            { concept: 'Error Service', description: 'Desc', quantity: 1, price: 50, amount: 50 }
          ]
        },
        timestamp: Date.now(),
        formId: 'test-form-' + Date.now(),
        savedByError: true
      };
      localStorage.setItem('draft_invoice', JSON.stringify(draftData));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Red alert should be visible
    await expect(page.locator('#draft-alert')).toBeVisible();

    // Restore draft
    await page.click('text=Recuperar borrador');
    await page.click('text=Sí, recuperar');
    await page.waitForTimeout(500);

    // Form should be populated
    const customerNameInput = invoiceInput(page, 'Customer Name');
    const customerName = await customerNameInput.inputValue();
    expect(customerName).toBe('Restore Error Test');

    // Wait for auto-save to update the draft (5 seconds)
    await page.waitForTimeout(6000);

    // Check draft - savedByError should now be false (regular auto-save took over)
    const draftData = await page.evaluate(() => {
      const data = localStorage.getItem('draft_invoice');
      return data ? JSON.parse(data) : null;
    });

    // Draft should exist but savedByError should be false
    expect(draftData).not.toBeNull();
    expect(draftData.savedByError).toBe(false);
  });

  test('should work in edit mode', async () => {
    // First, create an invoice to edit
    await page.goto('/invoices/new');
    await page.waitForLoadState('networkidle');

    await setInvoiceInputValue(page, 'Customer Name', 'Edit Mode Test');
    await setInvoiceInputValue(page, 'Tax Identifier (CIF/NIF)', '99999999E');
    await setInvoiceInputValue(page, 'Address', 'Edit Address');
    await setInvoiceInputValue(page, 'Concept', 'Service');
    await setInvoiceInputValue(page, 'Qty', '1');
    await page.fill('input[type="number"][step="0.01"]', '100');

    await page.click('button[type="submit"]');
    await page.waitForURL('**/invoices');

    // Get the first invoice and edit it
    await page.click('a[href*="/invoices/"][href*="/edit"]');
    await page.waitForLoadState('networkidle');

    // Wait for auto-save to initialize
    await page.waitForTimeout(1000);

    // Modify the form
    const nameInput = invoiceInput(page, 'Customer Name');
    await nameInput.fill('Modified in Edit');

    // Wait for auto-save (5 seconds)
    await page.waitForTimeout(6000);

    // Check localStorage for draft
    const draftData = await page.evaluate(() => {
      const data = localStorage.getItem('draft_invoice');
      return data ? JSON.parse(data) : null;
    });

    expect(draftData).not.toBeNull();
    expect(draftData.data.customerName).toBe('Modified in Edit');
  });

  test('should cancel modals with ESC key', async () => {
    // Create a draft with savedByError: true
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
        formId: 'test-form-' + Date.now(),
        savedByError: true // Network error draft
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
