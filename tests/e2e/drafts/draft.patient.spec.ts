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

    // Wait for draft to be saved with correct data
    await page.waitForFunction(
      () => {
        const data = localStorage.getItem('draft_patient');
        if (!data) return false;
        const draft = JSON.parse(data);
        return draft.data.firstName === 'Test Draft Firstname' &&
               draft.data.lastName === 'Test Draft Lastname' &&
               draft.data.taxId === '12345678X';
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
          dateOfBirth: '',
          phone: '',
          email: '',
          address: '',
          profession: '',
          sportsActivity: '',
          rate: '',
          allergies: '',
          systemicDiseases: '',
          medication: '',
          surgeries: '',
          accidents: '',
          injuries: '',
          bruxism: '',
          insoles: '',
          others: '',
          notes: '',
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

  test('should restore draft when clicking "Recuperar"', async () => {
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
          email: 'restore@test.com'
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

    const lastName = await page.inputValue('input[name="lastName"]');
    expect(lastName).toBe('Restore Last');

    const email = await page.inputValue('input[name="email"]');
    expect(email).toBe('restore@test.com');
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

    // Wait for auto-save (5 seconds)
    await page.waitForTimeout(6000);

    // Verify draft exists
    let draftData = await page.evaluate(() => {
      return localStorage.getItem('draft_patient');
    });
    expect(draftData).not.toBeNull();

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for navigation (either to list or detail)
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
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/patients/);

    // Navigate to edit page (assuming first item in list or we can navigate directly if we knew ID, 
    // but cleaner to go via UI or direct URL if we can capture ID)
    
    // For simplicity, let's assume we are redirected to patient list or detail. 
    // If detail: /patients/{id} -> click edit
    // If list: /patients -> click first edit
    
    // Let's go to list and click first patient
    await page.goto('/patients');
    await page.click('text=Edit Mode First'); // Click on name to go to detail
    await page.waitForURL(/\/patients\/\d+/);
    
    // Click edit button (assuming there is one, or navigate to /edit)
    // Actually PatientDetail might have an edit button. 
    // Let's assume we can append /edit to current URL
    const currentUrl = page.url();
    await page.goto(`${currentUrl}/edit`);
    
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
