/**
 * E2E Tests - Record Draft System
 *
 * End-to-end tests for draft functionality in record forms
 */

import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

test.describe('Record Draft System', () => {
  let page: Page;
  let testPatientId: string;

  test.beforeEach(async ({ page: testPage, context }) => {
    page = testPage;
    await loginAsAdmin(page, context);

    // Create a test patient for records
    await page.goto('/patients/new');
    await page.waitForLoadState('networkidle');

    const timestamp = Date.now();
    const firstName = `RecordTest${timestamp}`;
    await page.fill('input[name="firstName"]', firstName);
    await page.fill('input[name="lastName"]', 'Patient');
    await page.locator('#allergies').fill('None');
    await page.click('button[type="submit"]');

    // Wait for redirect to patients list
    await page.waitForURL(/\/patients$/);
    await page.waitForLoadState('networkidle');

    // Search for the patient we just created
    await page.fill('input[type="text"]', firstName);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Click on the patient name to go to detail page
    await page.click(`text=${firstName}`);
    await page.waitForURL(/\/patients\/\d+/);

    // Extract patient ID from URL
    const url = page.url();
    const match = url.match(/\/patients\/(\d+)/);
    testPatientId = match ? match[1] : '';

    // Clean any existing drafts
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
    // Navigate to new record
    await page.goto(`/patients/${testPatientId}/records/new`);
    await page.waitForLoadState('networkidle');

    // Fill some form fields
    await page.fill('textarea[name="physiotherapyTreatment"]', 'No Auto Save Test Treatment');
    await page.fill('textarea[name="consultationReason"]', 'Test Reason');

    // Wait for what used to be the auto-save interval (5 seconds + margin)
    await page.waitForTimeout(6000);

    // Verify NO draft exists
    const draftData = await page.evaluate(() => {
      return localStorage.getItem('draft_record');
    });
    expect(draftData).toBeNull();
  });

  test('should save draft explicitly when clicking save and show alert on network error', async ({ page, context }) => {
    await page.goto(`/patients/${testPatientId}/records/new`);
    await page.waitForLoadState('networkidle');

    // Fill form
    await page.fill('textarea[name="physiotherapyTreatment"]', 'Network Error Test Treatment');
    await page.fill('textarea[name="consultationReason"]', 'Network Error Reason');
    await page.fill('textarea[name="onset"]', 'Test Onset');

    // Go offline to simulate network error
    await context.setOffline(true);

    // Submit form - this should trigger manual saveDraft before axios call
    // and then saveOnNetworkError in the catch block
    await page.click('button[type="submit"]');

    // Alert should be visible (red variant)
    await expect(page.locator('#draft-alert')).toBeVisible();

    // Verify the draft exists in localStorage
    const draftData = await page.evaluate(() => {
      const data = localStorage.getItem('draft_record');
      return data ? JSON.parse(data) : null;
    });

    expect(draftData).not.toBeNull();
    expect(draftData.data.physiotherapyTreatment).toBe('Network Error Test Treatment');
    expect(draftData.savedByError).toBe(true);

    // Back online for cleanup
    await context.setOffline(false);
  });

  test('should show draft alert on reload (savedByError: true)', async () => {
    await page.goto(`/patients/${testPatientId}/records/new`);

    // Create a draft with savedByError: true
    await page.evaluate(() => {
      const draftData = {
        type: 'record',
        data: {
          physiotherapyTreatment: 'Reload Test Treatment',
          consultationReason: 'Reload Test Reason',
          onset: 'Reload Onset',
          currentSituation: 'Reload Situation',
          evolution: 'Reload Evolution',
          radiologyTests: '',
          medicalTreatment: '',
          homeTreatment: '',
          notes: '',
          sickLeave: false
        },
        timestamp: Date.now(),
        formId: 'record-new-' + Date.now(),
        savedByError: true
      };
      localStorage.setItem('draft_record', JSON.stringify(draftData));
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
    await page.goto(`/patients/${testPatientId}/records/new`);

    // Create a draft with savedByError: true
    await page.evaluate(() => {
      const draftData = {
        type: 'record',
        data: {
          physiotherapyTreatment: 'Restore Treatment',
          consultationReason: 'Restore Reason',
          onset: 'Restore Onset',
          currentSituation: 'Restore Situation',
          evolution: 'Restore Evolution',
          radiologyTests: 'X-Ray',
          medicalTreatment: 'Pain meds',
          homeTreatment: 'Rest',
          notes: 'Test notes',
          sickLeave: true
        },
        timestamp: Date.now(),
        formId: 'record-new-' + Date.now(),
        savedByError: true
      };
      localStorage.setItem('draft_record', JSON.stringify(draftData));
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
    const treatment = await page.inputValue('textarea[name="physiotherapyTreatment"]');
    expect(treatment).toBe('Restore Treatment');

    // ALERT SHOULD STILL BE VISIBLE
    await expect(page.locator('#draft-alert')).toBeVisible();

    // Check draft - savedByError should STILL be true
    const draftData = await page.evaluate(() => {
      const data = localStorage.getItem('draft_record');
      return data ? JSON.parse(data) : null;
    });

    expect(draftData).not.toBeNull();
    expect(draftData.savedByError).toBe(true);
  });

  test('should NOT auto-save modifications after restoring draft from network error', async () => {
    await page.goto(`/patients/${testPatientId}/records/new`);

    // Create a draft with savedByError: true
    await page.evaluate(() => {
      const draftData = {
        type: 'record',
        data: {
          physiotherapyTreatment: 'Original Treatment',
          consultationReason: 'Original Reason',
          onset: 'Original Onset',
          currentSituation: 'Original Situation',
          evolution: 'Original Evolution',
          radiologyTests: '',
          medicalTreatment: '',
          homeTreatment: '',
          notes: '',
          sickLeave: false
        },
        timestamp: Date.now(),
        formId: 'record-new-' + Date.now(),
        savedByError: true
      };
      localStorage.setItem('draft_record', JSON.stringify(draftData));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Restore draft
    await page.click('text=Recuperar borrador');
    await page.click('text=Sí, recuperar');
    await page.waitForTimeout(500);

    // Verify form fields are populated with original data
    let treatment = await page.inputValue('textarea[name="physiotherapyTreatment"]');
    expect(treatment).toBe('Original Treatment');

    // Modify form fields
    await page.fill('textarea[name="physiotherapyTreatment"]', 'Modified Treatment');
    await page.fill('textarea[name="consultationReason"]', 'Modified Reason');
    await page.fill('textarea[name="onset"]', 'Modified Onset');

    // Wait for what used to be the auto-save interval (6 seconds)
    await page.waitForTimeout(6000);

    // Check draft - should STILL have ORIGINAL data (not modified data)
    // This confirms auto-save is NOT running
    const draftData = await page.evaluate(() => {
      const data = localStorage.getItem('draft_record');
      return data ? JSON.parse(data) : null;
    });

    expect(draftData).not.toBeNull();
    expect(draftData.savedByError).toBe(true);
    expect(draftData.data.physiotherapyTreatment).toBe('Original Treatment'); // Original data
    expect(draftData.data.consultationReason).toBe('Original Reason'); // Original data
    expect(draftData.data.onset).toBe('Original Onset'); // Original data

    // Alert should still be visible
    await expect(page.locator('#draft-alert')).toBeVisible();
  });

  test('should allow modifying form and then recovering draft without error', async () => {
    await page.goto(`/patients/${testPatientId}/records/new`);

    // 1. Create a draft with savedByError: true (simulating network error)
    await page.evaluate(() => {
      const draftData = {
        type: 'record',
        data: {
          physiotherapyTreatment: 'Original Treatment Text',
          consultationReason: 'Original Reason Text',
          onset: '',
          currentSituation: '',
          evolution: '',
          radiologyTests: '',
          medicalTreatment: '',
          homeTreatment: '',
          notes: '',
          sickLeave: false
        },
        timestamp: Date.now(),
        formId: 'record-new-' + Date.now(),
        savedByError: true
      };
      localStorage.setItem('draft_record', JSON.stringify(draftData));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // 2. Verify alert is visible
    await expect(page.locator('#draft-alert')).toBeVisible();

    // 3. Modify the form (simulating user changing their mind or trying to fix it)
    await page.fill('textarea[name="physiotherapyTreatment"]', 'Modified Treatment Text');
    await page.fill('textarea[name="consultationReason"]', 'Modified Reason Text');

    // 4. Click "Recuperar borrador"
    await page.click('text=Recuperar borrador');

    // 5. Confirm restore
    await page.click('text=Sí, recuperar');

    // 6. Verify NO error message is shown
    const errorVisible = await page.locator('text=Ocurrió un error inesperado').isVisible();
    expect(errorVisible).toBe(false);

    // 7. Verify data is restored to ORIGINAL values
    const treatment = await page.inputValue('textarea[name="physiotherapyTreatment"]');
    expect(treatment).toBe('Original Treatment Text');

    const reason = await page.inputValue('textarea[name="consultationReason"]');
    expect(reason).toBe('Original Reason Text');
  });

  test('should discard draft when clicking "Descartar"', async () => {
    await page.goto(`/patients/${testPatientId}/records/new`);

    // Create a draft with savedByError: true
    await page.evaluate(() => {
      const draftData = {
        type: 'record',
        data: {
          physiotherapyTreatment: 'Discard Treatment',
          consultationReason: 'Discard Reason',
          onset: '',
          currentSituation: '',
          evolution: '',
          radiologyTests: '',
          medicalTreatment: '',
          homeTreatment: '',
          notes: '',
          sickLeave: false
        },
        timestamp: Date.now(),
        formId: 'record-new-' + Date.now(),
        savedByError: true
      };
      localStorage.setItem('draft_record', JSON.stringify(draftData));
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
      return localStorage.getItem('draft_record');
    });
    expect(draftData).toBeNull();
  });

  test('should clear draft on successful save', async () => {
    // Navigate to new record
    await page.goto(`/patients/${testPatientId}/records/new`);
    await page.waitForLoadState('networkidle');

    // Fill form
    await page.fill('textarea[name="physiotherapyTreatment"]', 'Success Treatment');
    await page.fill('textarea[name="consultationReason"]', 'Success Reason');

    // Verify NO draft exists yet (no auto-save)
    let draftData = await page.evaluate(() => {
      return localStorage.getItem('draft_record');
    });
    expect(draftData).toBeNull();

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for navigation back to patient detail
    await page.waitForURL(/\/patients\/\d+$/);

    // Wait a bit for local storage cleanup
    await page.waitForTimeout(1000);

    // Draft should be cleared
    draftData = await page.evaluate(() => {
      return localStorage.getItem('draft_record');
    });
    expect(draftData).toBeNull();
  });

  test('should work in edit mode', async () => {
    // First, create a record to edit
    await page.goto(`/patients/${testPatientId}/records/new`);
    await page.waitForLoadState('networkidle');

    await page.fill('textarea[name="physiotherapyTreatment"]', 'Edit Mode Treatment');
    await page.fill('textarea[name="consultationReason"]', 'Edit Mode Reason');
    await page.click('button[type="submit"]');

    // Wait for redirect to patient detail
    await page.waitForURL(/\/patients\/\d+$/);
    await page.waitForLoadState('networkidle');

    // Find the record in the list and navigate to edit
    // Records are shown in the patient detail page
    const recordRow = page.locator('text=Edit Mode Treatment').first();
    await expect(recordRow).toBeVisible();

    // Click the edit button (pencil icon) for this record
    // The button has a title attribute "Editar" (or "Edit" in EN)
    const recordContainer = page.locator('li', { hasText: 'Edit Mode Treatment' }).first();
    const editButton = recordContainer.locator('button[title="Editar"], button[title="Edit"]');
    
    // Ensure button is visible before clicking
    await expect(editButton).toBeVisible();
    await editButton.click();

    await page.waitForLoadState('networkidle');

    // Modify the form
    await page.fill('textarea[name="physiotherapyTreatment"]', 'Modified in Edit Mode');
    await page.locator('textarea[name="physiotherapyTreatment"]').blur();

    // Verify NO draft exists (no auto-save)
    let draftData = await page.evaluate(() => {
      return localStorage.getItem('draft_record');
    });
    expect(draftData).toBeNull();

    // Submit
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/patients\/\d+$/);

    // Wait for cleanup
    await page.waitForTimeout(1000);

    // Draft should be gone
    draftData = await page.evaluate(() => {
      return localStorage.getItem('draft_record');
    });
    expect(draftData).toBeNull();
  });
});
