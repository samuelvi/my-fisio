/**
 * E2E Tests - Patient Draft System
 *
 * End-to-end tests for draft functionality in patient forms
 */

import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin } from '../common/auth';

test.describe('Patient Draft System', () => {
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
    await page.goto('/patients/new');
    await page.waitForLoadState('networkidle');

    await page.getByLabel(/Nombre|First Name/i).fill('No Auto Save');
    await page.getByLabel(/Apellidos|Last Name/i).fill('Test');
    
    await page.waitForTimeout(6000);

    const draftData = await page.evaluate(() => localStorage.getItem('draft_patient'));
    expect(draftData).toBeNull();
  });

  test('should save draft explicitly when clicking save and show alert on network error', async ({ context }) => {
    await page.goto('/patients/new');
    await page.waitForLoadState('networkidle');

    await page.getByLabel(/Nombre|First Name/i).fill('Network Error Test');
    await page.getByLabel(/Apellidos|Last Name/i).fill('Patient');
    await page.locator('#allergies').fill('None');

    await context.setOffline(true);
    await page.waitForTimeout(500);

    await page.getByTestId('save-patient-btn').click();

    await expect(page.locator('#draft-alert')).toBeVisible({ timeout: 15000 });

    const draftData = await page.evaluate(() => {
      const data = localStorage.getItem('draft_patient');
      return data ? JSON.parse(data) : null;
    });

    expect(draftData).not.toBeNull();
    expect(draftData.savedByError).toBe(true);
  });

  test('should show draft alert on reload (savedByError: true)', async () => {
    await page.goto('/patients/new');
    await page.evaluate(() => {
      localStorage.setItem('draft_patient', JSON.stringify({
        type: 'patient',
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
    await page.goto('/patients/new');
    await page.evaluate(() => {
      localStorage.setItem('draft_patient', JSON.stringify({
        type: 'patient',
        data: { firstName: 'Restore Me', lastName: 'Last', allergies: 'None' },
        timestamp: Date.now(),
        formId: 'test-123',
        savedByError: true
      }));
    });

    await page.reload();
    await page.getByRole('button', { name: /Recuperar borrador|Restore draft/i }).click();
    await page.getByTestId('confirm-draft-btn').click();

    await expect(page.getByTestId('confirm-draft-btn')).toBeHidden({ timeout: 10000 });

    await expect(page.getByLabel(/Nombre|First Name/i)).toHaveValue('Restore Me');
    await expect(page.locator('#draft-alert')).toBeVisible();
  });

  test('should clear draft on successful save', async () => {
    await page.goto('/patients/new');
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => localStorage.removeItem('draft_patient'));

    await page.getByLabel(/Nombre|First Name/i).fill('Success');
    await page.getByLabel(/Apellidos|Last Name/i).fill('Test');
    await page.locator('#allergies').fill('None');

    await page.getByTestId('save-patient-btn').click();
    
    await page.waitForURL(/\/patients$/);
    await page.waitForLoadState('networkidle');

    const draftData = await page.evaluate(() => localStorage.getItem('draft_patient'));
    expect(draftData).toBeNull();
  });
});