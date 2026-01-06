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

    // Clean any existing drafts after login (now we have a valid context)
    await page.evaluate(() => {
      Object.keys(localStorage)
        .filter(key => key.startsWith('draft_'))
        .forEach(key => localStorage.removeItem(key));
    });
  });

  test.afterEach(async () => {
    // Clean up localStorage after each test
    await page.evaluate(() => {
      Object.keys(localStorage)
        .filter(key => key.startsWith('draft_'))
        .forEach(key => localStorage.removeItem(key));
    });
  });

  test('should NOT auto-save draft automatically', async () => {
    // Navigate to new invoice
    await page.goto('/invoices/new');
    await page.waitForLoadState('networkidle');

    // Fill some form fields
    await setInvoiceInputValue(page, 'Customer Name', 'No Auto Save');
    await setInvoiceInputValue(page, 'Tax Identifier (CIF/NIF)', '12345678X');

    // Wait for what used to be the auto-save interval (5 seconds + margin)
    await page.waitForTimeout(6000);

    // Verify NO draft exists
    const draftData = await page.evaluate(() => {
      return localStorage.getItem('draft_invoice');
    });
    expect(draftData).toBeNull();
  });

  test('should save draft explicitly when clicking save and show alert on network error', async ({ context }) => {
    await page.goto('/invoices/new');
    await page.waitForLoadState('networkidle');

    // Fill form
    await setInvoiceInputValue(page, 'Customer Name', 'Network Error Test');
    await setInvoiceInputValue(page, 'Tax Identifier (CIF/NIF)', '12312312D');
    await setInvoiceInputValue(page, 'Concept', 'Test Service');
    await setInvoiceInputValue(page, 'Qty', '1');
    await page.fill('input[type="number"][step="0.01"]', '100');

    // Go offline
    await context.setOffline(true);

    // Submit form
    await page.click('button[type="submit"]');

    // Alert should be visible
    await expect(page.locator('#draft-alert')).toBeVisible();

    // Verify the draft exists
    const draftData = await page.evaluate(() => {
      const data = localStorage.getItem('draft_invoice');
      return data ? JSON.parse(data) : null;
    });

    expect(draftData).not.toBeNull();
    expect(draftData.data.customerName).toBe('Network Error Test');
    expect(draftData.savedByError).toBe(true);

    // Back online
    await context.setOffline(false);
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

  test('should allow modifying form and then recovering draft without error', async () => {
    await page.goto('/invoices/new');
    
    // 1. Create a draft with savedByError: true (simulating network error)
    await page.evaluate(() => {
      const draftData = {
        type: 'invoice',
        data: {
          date: new Date().toISOString().split('T')[0],
          customerName: 'Original Invoice Name',
          customerTaxId: '11111111A',
          customerAddress: 'Original Address',
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

    // 2. Verify alert is visible
    await expect(page.locator('#draft-alert')).toBeVisible();

    // 3. Modify the form (simulating user changing their mind or trying to fix it)
    await setInvoiceInputValue(page, 'Customer Name', 'Modified Invoice Name');
    
    // 4. Click "Recuperar borrador"
    await page.click('text=Recuperar borrador');

    // 5. Confirm restore
    await page.click('text=Sí, recuperar');

    // 6. Verify NO error message is shown
    // "Ocurrió un error inesperado" usually appears in a specific error container
    const errorVisible = await page.locator('text=Ocurrió un error inesperado').isVisible();
    expect(errorVisible).toBe(false);

    // 7. Verify data is restored to ORIGINAL values
    const customerName = await page.inputValue('input[value="Original Invoice Name"]');
    expect(customerName).toBe('Original Invoice Name');
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

    // Verify draft DOES NOT exist yet
    let draftData = await page.evaluate(() => {
      return localStorage.getItem('draft_invoice');
    });
    expect(draftData).toBeNull();

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

  test('should NOT show alert for regular save attempt (savedByError:false)', async () => {
    await page.goto('/invoices/new');
    await page.waitForLoadState('networkidle');

    // Create draft WITHOUT savedByError (simulating a save that was interrupted but not by network error)
    await page.evaluate(() => {
      const draftData = {
        type: 'invoice',
        data: {
          date: new Date().toISOString().split('T')[0],
          customerName: 'Regular Save Test',
          customerTaxId: '99999999X',
          customerAddress: 'Auto Save Address',
          customerPhone: '',
          customerEmail: '',
          invoiceNumber: '',
          lines: []
        },
        timestamp: Date.now(),
        formId: 'test-form-' + Date.now(),
        savedByError: false // Regular save
      };
      localStorage.setItem('draft_invoice', JSON.stringify(draftData));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Alert should NOT be visible for regular save
    const alertVisible = await page.locator('#draft-alert').isVisible();
    expect(alertVisible).toBe(false);
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

  test('should restore draft and KEEP savedByError flag/panel visible', async () => {
    await page.goto('/invoices/new');
    await page.waitForLoadState('networkidle');

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

    // ALERT SHOULD STILL BE VISIBLE
    await expect(page.locator('#draft-alert')).toBeVisible();

    // Check draft - savedByError should STILL be true
    const draftData = await page.evaluate(() => {
      const data = localStorage.getItem('draft_invoice');
      return data ? JSON.parse(data) : null;
    });

    expect(draftData).not.toBeNull();
    expect(draftData.savedByError).toBe(true);
  });

  test('should NOT auto-save modifications after restoring draft from network error', async () => {
    await page.goto('/invoices/new');
    await page.waitForLoadState('networkidle');

    // Create draft with savedByError: true
    await page.evaluate(() => {
      const draftData = {
        type: 'invoice',
        data: {
          date: '2026-01-15',
          customerName: 'Original Invoice Name',
          customerTaxId: '88776655D',
          customerAddress: 'Original Address',
          customerPhone: '555666777',
          customerEmail: 'original@invoice.com',
          invoiceNumber: '',
          lines: [
            { concept: 'Original Service', description: 'Original Desc', quantity: 1, price: 100, amount: 100 }
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

    // Restore draft
    await page.click('text=Recuperar borrador');
    await page.click('text=Sí, recuperar');
    await page.waitForTimeout(500);

    // Verify form fields are populated with original data
    const customerNameInput = invoiceInput(page, 'Customer Name');
    let customerName = await customerNameInput.inputValue();
    expect(customerName).toBe('Original Invoice Name');

    // Modify form fields
    await setInvoiceInputValue(page, 'Customer Name', 'Modified Invoice Name');
    await setInvoiceInputValue(page, 'Address', 'Modified Address');
    await setInvoiceInputValue(page, 'Email', 'modified@invoice.com');

    // Wait for what used to be the auto-save interval (6 seconds)
    await page.waitForTimeout(6000);

    // Check draft - should STILL have ORIGINAL data (not modified data)
    // This confirms auto-save is NOT running
    const draftData = await page.evaluate(() => {
      const data = localStorage.getItem('draft_invoice');
      return data ? JSON.parse(data) : null;
    });

    expect(draftData).not.toBeNull();
    expect(draftData.savedByError).toBe(true);
    expect(draftData.data.customerName).toBe('Original Invoice Name'); // Original data
    expect(draftData.data.customerAddress).toBe('Original Address'); // Original data
    expect(draftData.data.customerEmail).toBe('original@invoice.com'); // Original data

    // Alert should still be visible
    await expect(page.locator('#draft-alert')).toBeVisible();
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

    // Wait for form to load
    await page.waitForTimeout(1000);

    // Modify the form
    const nameInput = invoiceInput(page, 'Customer Name');
    await nameInput.fill('Modified in Edit');
    await nameInput.blur();

    // Verify NO draft exists yet
    let draftData = await page.evaluate(() => {
      return localStorage.getItem('draft_invoice');
    });
    expect(draftData).toBeNull();

    // Submit
    await page.click('button[type="submit"]');
    await page.waitForURL('**/invoices');

    // Check localStorage for draft - should be gone
    draftData = await page.evaluate(() => {
      const data = localStorage.getItem('draft_invoice');
      return data ? JSON.parse(data) : null;
    });

    expect(draftData).toBeNull();
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
