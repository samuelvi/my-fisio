/**
 * E2E Tests - Clinical Record Draft System
 *
 * End-to-end tests for draft functionality in clinical record forms
 */

import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

test.describe('Clinical Record Draft System', () => {
  let page: Page;
  let patientId: string;

  test.beforeEach(async ({ page: testPage, context, request }) => {
    page = testPage;
    
    // Reset DB and Login
    await request.post('/api/test/reset-db-empty');
    await loginAsAdmin(page, context);

    // Create a patient to add records to
    const createResponse = await request.post('/api/patients', {
        headers: {
            'Content-Type': 'application/ld+json',
            'Authorization': `Bearer ${await page.evaluate(() => localStorage.getItem('token'))}`
        },
        data: {
            firstName: 'Draft',
            lastName: 'Patient',
            allergies: 'None'
        }
    });
    const patient = await createResponse.json();
    patientId = patient.id;

    // Clean any existing drafts
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
    await page.goto(`/patients/${patientId}/records/new`);
    await page.waitForLoadState('networkidle');

    await page.getByTestId('record-physiotherapyTreatment').fill('No Auto Save');
    
    await page.waitForTimeout(6000);

    const draftData = await page.evaluate(() => localStorage.getItem('draft_record'));
    expect(draftData).toBeNull();
  });

  test('should save draft explicitly when clicking save and show alert on network error', async ({ context }) => {
    await page.goto(`/patients/${patientId}/records/new`);
    await page.waitForLoadState('networkidle');

    await page.getByTestId('record-consultationReason').fill('Network Error Reason');
    await page.getByTestId('record-physiotherapyTreatment').fill('Network Error Treatment');

    await context.setOffline(true);
    await page.waitForTimeout(500);

    await page.getByTestId('save-record-btn').click();

    await expect(page.locator('#draft-alert')).toBeVisible({ timeout: 15000 });

    const draftData = await page.evaluate(() => {
      const data = localStorage.getItem('draft_record');
      return data ? JSON.parse(data) : null;
    });

    expect(draftData).not.toBeNull();
    expect(draftData.data.physiotherapyTreatment).toBe('Network Error Treatment');
    expect(draftData.savedByError).toBe(true);
  });

  test('should show draft alert on reload (savedByError: true)', async () => {
    await page.goto(`/patients/${patientId}/records/new`);
    await page.evaluate((pid) => {
      localStorage.setItem('draft_record', JSON.stringify({
        type: 'record',
        data: { consultationReason: 'Reload Test', patient: `/api/patients/${pid}` },
        timestamp: Date.now(),
        formId: 'test-123',
        savedByError: true
      }));
    }, patientId);

    await page.reload();
    await expect(page.locator('#draft-alert')).toBeVisible({ timeout: 15000 });
  });

  test('should restore draft and KEEP savedByError flag/panel visible', async () => {
    await page.goto(`/patients/${patientId}/records/new`);
    await page.evaluate((pid) => {
      localStorage.setItem('draft_record', JSON.stringify({
        type: 'record',
        data: { 
            consultationReason: 'Restore Me', 
            physiotherapyTreatment: 'Treatment',
            patient: `/api/patients/${pid}` 
        },
        timestamp: Date.now(),
        formId: 'test-123',
        savedByError: true
      }));
    }, patientId);

    await page.reload();
    await page.getByRole('button', { name: /Recuperar borrador|Restore draft/i }).click();
    await page.getByTestId('confirm-draft-btn').click();

    await expect(page.getByTestId('confirm-draft-btn')).toBeHidden({ timeout: 10000 });

    await expect(page.getByTestId('record-consultationReason')).toHaveValue('Restore Me');
    await expect(page.locator('#draft-alert')).toBeVisible();
  });

  test('should clear draft on successful save', async () => {
    await page.goto(`/patients/${patientId}/records/new`);
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => localStorage.removeItem('draft_record'));

    await page.getByTestId('record-consultationReason').fill('Success Save');
    await page.getByTestId('record-physiotherapyTreatment').fill('Success Treatment');

    await page.getByTestId('save-record-btn').click();
    
    await page.waitForURL(/\/patients\/\d+$/);
    await page.waitForLoadState('networkidle');

    const draftData = await page.evaluate(() => localStorage.getItem('draft_record'));
    expect(draftData).toBeNull();
  });
});