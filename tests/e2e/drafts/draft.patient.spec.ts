/**
 * E2E Tests - Patient Draft System
 *
 * End-to-end tests for draft functionality in patient forms
 */

import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

test.describe('Patient Draft System', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage, context }) => {
    page = testPage;
    await loginAsAdmin(page, context);

    // Clean any existing drafts after login
    await page.evaluate(() => {
      localStorage.removeItem('draft_patient');
    });
  });

  test.afterEach(async () => {
    // Clean up localStorage after each test
    await page.evaluate(() => {
      localStorage.removeItem('draft_patient');
    });
  });

  test('should auto-save draft after 5 seconds', async () => {
    // Navigate to new patient
    await page.goto('/patients/new');
    await page.waitForLoadState('networkidle');

    // Wait for auto-save to initialize
    await page.waitForTimeout(500);

    // Fill some form fields
    await page.fill('input[name="firstName"]', 'Test Draft Firstname');
    await page.fill('input[name="lastName"]', 'Test Draft Lastname');
    await page.fill('input[name="taxId"]', '12345678X');
    await page.fill('input[name="allergies"]', 'None');

    // Wait for draft to be saved with correct data
    await page.waitForFunction(
      () => {
        const data = localStorage.getItem('draft_patient');
        if (!data) return false;
        const draft = JSON.parse(data);
        return draft.data.firstName === 'Test Draft Firstname' &&
               draft.data.lastName === 'Test Draft Lastname';
      },
      { timeout: 15000 }
    );

    // Verify the draft
    const draftData = await page.evaluate(() => {
      const data = localStorage.getItem('draft_patient');
      return data ? JSON.parse(data) : null;
    });

    expect(draftData).not.toBeNull();
    expect(draftData.type).toBe('patient');
    expect(draftData.data.firstName).toBe('Test Draft Firstname');
    expect(draftData.data.lastName).toBe('Test Draft Lastname');
  });

  test('should show draft alert on reload (savedByError: true)', async () => {
    await page.goto('/patients/new');
    
    // Create a draft with savedByError: true
    await page.evaluate(() => {
      const draftData = {
        type: 'patient',
        data: {
          firstName: 'Reload Test First',
          lastName: 'Reload Test Last',
          taxId: '87654321Y',
          allergies: 'None',
          status: 'active'
        },
        timestamp: Date.now(),
        formId: 'patient-new-' + Date.now(),
        savedByError: true
      };
      localStorage.setItem('draft_patient', JSON.stringify(draftData));
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
  });

  test('should restore draft and KEEP savedByError flag/panel visible', async () => {
    await page.goto('/patients/new');
    
    // Create a draft with savedByError: true
    await page.evaluate(() => {
      const draftData = {
        type: 'patient',
        data: {
          firstName: 'Restore First',
          lastName: 'Restore Last',
          taxId: '11223344A',
          phone: '666777888',
          email: 'restore@test.com',
          allergies: 'Peanuts'
        },
        timestamp: Date.now(),
        formId: 'patient-new-' + Date.now(),
        savedByError: true
      };
      localStorage.setItem('draft_patient', JSON.stringify(draftData));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Click "Recuperar borrador" button
    await page.click('text=Recuperar borrador');

    // Confirm restore
    await page.click('text=Sí, recuperar');

    // Wait for form to populate
    await page.waitForTimeout(500);

    // Verify form fields are populated
    const firstName = await page.inputValue('input[name="firstName"]');
    expect(firstName).toBe('Restore First');

    // ALERT SHOULD STILL BE VISIBLE
    await expect(page.locator('#draft-alert')).toBeVisible();

    // Check draft - savedByError should STILL be true
    const draftData = await page.evaluate(() => {
      const data = localStorage.getItem('draft_patient');
      return data ? JSON.parse(data) : null;
    });

    expect(draftData).not.toBeNull();
    expect(draftData.savedByError).toBe(true);
  });

  test('should allow modifying form and then recovering draft without error', async () => {
    await page.goto('/patients/new');
    
    // 1. Create a draft with savedByError: true (simulating network error)
    await page.evaluate(() => {
      const draftData = {
        type: 'patient',
        data: {
          firstName: 'Original Name',
          lastName: 'Original Lastname',
          taxId: '11111111A',
          allergies: 'None'
        },
        timestamp: Date.now(),
        formId: 'patient-new-' + Date.now(),
        savedByError: true
      };
      localStorage.setItem('draft_patient', JSON.stringify(draftData));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // 2. Verify alert is visible
    await expect(page.locator('#draft-alert')).toBeVisible();

    // 3. Modify the form (simulating user changing their mind or trying to fix it)
    await page.fill('input[name="firstName"]', 'Modified Name');
    await page.fill('input[name="lastName"]', 'Modified Lastname');

    // 4. Click "Recuperar borrador"
    await page.click('text=Recuperar borrador');

    // 5. Confirm restore
    await page.click('text=Sí, recuperar');

    // 6. Verify NO error message is shown
    const errorVisible = await page.locator('text=Ocurrió un error inesperado').isVisible();
    expect(errorVisible).toBe(false);

    // 7. Verify data is restored to ORIGINAL values
    const firstName = await page.inputValue('input[name="firstName"]');
    expect(firstName).toBe('Original Name');

    const lastName = await page.inputValue('input[name="lastName"]');
    expect(lastName).toBe('Original Lastname');
  });

  test('should discard draft when clicking "Descartar"', async () => {
    await page.goto('/patients/new');
    
    // Create a draft with savedByError: true
    await page.evaluate(() => {
      const draftData = {
        type: 'patient',
        data: {
          firstName: 'Discard First',
          lastName: 'Discard Last'
        },
        timestamp: Date.now(),
        formId: 'patient-new-' + Date.now(),
        savedByError: true
      };
      localStorage.setItem('draft_patient', JSON.stringify(draftData));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Click "Descartar borrador" button
    await page.click('text=Descartar borrador');

    // Confirm discard
    await page.click('text=Sí, descartar');

    // Alert should disappear
    await expect(page.locator('#draft-alert')).not.toBeVisible();

    // Draft should be removed from localStorage
    const draftData = await page.evaluate(() => {
      return localStorage.getItem('draft_patient');
    });
    expect(draftData).toBeNull();
  });

  test('should clear draft on successful save', async () => {
    // Navigate to new patient
    await page.goto('/patients/new');
    await page.waitForLoadState('networkidle');

    // Fill form
    await page.fill('input[name="firstName"]', 'Success First');
    await page.fill('input[name="lastName"]', 'Success Last');
    await page.fill('input[name="taxId"]', '55443322C');
    await page.fill('input[name="allergies"]', 'None');

    // Wait for auto-save (5 seconds)
    await page.waitForTimeout(6000);

    // Verify draft exists
    let draftData = await page.evaluate(() => {
      return localStorage.getItem('draft_patient');
    });
    expect(draftData).not.toBeNull();

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForURL(/\/patients/);

    // Wait a bit for local storage cleanup
    await page.waitForTimeout(1000);

    // Draft should be cleared
    draftData = await page.evaluate(() => {
      return localStorage.getItem('draft_patient');
    });
    expect(draftData).toBeNull();
  });

  test('should work in edit mode', async () => {
    // First, create a patient to edit
    await page.goto('/patients/new');
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="firstName"]', 'Edit Mode First');
    await page.fill('input[name="lastName"]', 'Edit Mode Last');
    await page.fill('input[name="allergies"]', 'None');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to list
    await page.waitForURL(/\/patients/);
    await page.waitForLoadState('networkidle');

    // Search for the patient to ensure we click the right one
    await page.fill('input[type="text"]', 'Edit Mode First');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Click on name to go to detail
    await page.click('text=Edit Mode First'); 
    await page.waitForURL(/\/patients\/\d+/);
    
    // Navigate to edit
    const currentUrl = page.url();
    await page.goto(`${currentUrl}/edit`);
    await page.waitForLoadState('networkidle');
    
    // Wait for auto-save to initialize
    await page.waitForTimeout(1000);

    // Modify the form
    await page.fill('input[name="firstName"]', 'Modified in Edit');
    await page.locator('input[name="firstName"]').blur();

    // Wait for auto-save
    await page.waitForTimeout(6000);

    // Check localStorage for draft
    const draftData = await page.evaluate(() => {
      const data = localStorage.getItem('draft_patient');
      return data ? JSON.parse(data) : null;
    });

    expect(draftData).not.toBeNull();
    expect(draftData.data.firstName).toBe('Modified in Edit');
  });
});