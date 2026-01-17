/**
 * E2E Tests - Appointment Network & Server Error Handling
 *
 * Verifies that a status alert banner appears when network errors
 * or server errors occur during appointment operations.
 */

import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin } from './common/auth';

test.describe('Appointment Error Handling', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage, context }) => {
    page = testPage;
    await loginAsAdmin(page, context);
    await page.goto('/appointments');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.fc');
  });

  test.afterEach(async ({ context }) => {
    // Ensure we are back online after each test
    await context.setOffline(false);
  });

  test('should show error alert when clicking "Nueva Cita" while offline', async ({ context }) => {
    // 1. Go offline before clicking
    await context.setOffline(true);

    // 2. Try to click "New Appointment" button (using data-testid)
    const newBtn = page.getByTestId('new-appointment-btn');
    await newBtn.click();

    // 3. Verify alert is visible and NO modal is open
    const alert = page.locator('#status-alert');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/Error de conexi.n|Connection Error/i);
    
    // Check that modal title is NOT visible
    const modal = page.locator('h3').filter({ hasText: /Nueva Cita|New Appointment/i });
    await expect(modal).not.toBeVisible();
  });

  test('should show error alert when creating appointment fails due to network', async ({ context }) => {
    const newBtn = page.getByTestId('new-appointment-btn');
    await newBtn.click(); 

    // Wait for modal and input
    const titleInput = page.locator('form input[type="text"]').first();
    await expect(titleInput).toBeVisible();
    await titleInput.fill('Network Error Test');

    await context.setOffline(true);
    await page.getByTestId('save-appointment-btn').click();

    const alert = page.locator('#status-alert');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/Error de conexi.n|Connection Error/i);

    await alert.locator('button').click();
    await expect(alert).not.toBeVisible();
  });

  test('should show error alert when server returns 500 on creation', async () => {
    // 1. Mock API failure
    await page.route('**/api/appointments', route => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Server Error Simulated' })
        });
      } else {
        route.continue();
      }
    });

    // 2. Open modal and fill
    const newBtn = page.getByTestId('new-appointment-btn');
    await newBtn.click(); 
    
    const titleInput = page.locator('form input[type="text"]').first();
    await expect(titleInput).toBeVisible();
    await titleInput.fill('Server Error Test');

    // 3. Save
    await page.getByTestId('save-appointment-btn').click();

    // 4. Verify alert
    const alert = page.locator('#status-alert');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/Error del servidor|Server Error/i);
    await expect(alert).toContainText('Server Error Simulated');
  });

  test('should show error alert when dragging appointment fails due to network', async ({ context }) => {
    // 1. Create an appointment
    const newBtn = page.getByTestId('new-appointment-btn');
    await newBtn.click(); 
    
    const titleInput = page.locator('form input[type="text"]').first();
    await expect(titleInput).toBeVisible();
    await titleInput.fill('DragTarget');
    
    await page.getByTestId('save-appointment-btn').click();
    
    await page.waitForResponse(resp => resp.url().includes('/api/appointments') && resp.status() === 201);
    await page.waitForTimeout(2000); 

    const event = page.locator('.fc-event', { hasText: 'DragTarget' }).first();
    await expect(event).toBeVisible();

    await context.setOffline(true);

    const target = page.locator('.fc-timegrid-col').last();
    await event.dragTo(target, { force: true });

    await expect(page.locator('#status-alert')).toBeVisible();
  });

  test('should show error alert when editing appointment fails due to network', async ({ context }) => {
    // 1. Create an appointment
    const newBtn = page.getByTestId('new-appointment-btn');
    await newBtn.click(); 
    
    const titleInput = page.locator('form input[type="text"]').first();
    await expect(titleInput).toBeVisible();
    await titleInput.fill('EditTarget');
    
    await page.getByTestId('save-appointment-btn').click();
    
    await page.waitForResponse(resp => resp.url().includes('/api/appointments') && resp.status() === 201);
    await page.waitForTimeout(2000);
    
    const event = page.locator('.fc-event', { hasText: 'EditTarget' }).first();
    await event.click({ force: true });
    
    await expect(page.getByRole('heading', { name: /Edit Appointment|Editar Cita/i })).toBeVisible();
    
    const editTitleInput = page.locator('form input[type="text"]').first();
    await editTitleInput.fill('EditModified');

    await context.setOffline(true);
    await page.getByTestId('save-appointment-btn').click();

    await expect(page.locator('#status-alert')).toBeVisible();
  });

  test('should show error alert when deleting appointment fails due to network', async ({ context }) => {
    // 1. Create an appointment
    const newBtn = page.getByTestId('new-appointment-btn');
    await newBtn.click(); 
    
    const titleInput = page.locator('form input[type="text"]').first();
    await expect(titleInput).toBeVisible();
    await titleInput.fill('DeleteTarget');
    
    await page.getByTestId('save-appointment-btn').click();
    
    await page.waitForResponse(resp => resp.url().includes('/api/appointments') && resp.status() === 201);
    await page.waitForTimeout(2000);
    
    const event = page.locator('.fc-event', { hasText: 'DeleteTarget' }).first();
    await event.click({ force: true });
    
    await expect(page.getByRole('heading', { name: /Edit Appointment|Editar Cita/i })).toBeVisible();
    await page.locator('button[title="Borrar"], button[title="Delete"]').click();
    
    await page.waitForTimeout(500);
    await expect(page.locator('h3', { hasText: /Delete|Borrar/i }).last()).toBeVisible();

    await context.setOffline(true);
    // Click confirm delete button
    const confirmBtn = page.getByRole('button', { name: /Borrar|Delete/i }).last();
    await confirmBtn.click();

    await expect(page.locator('#status-alert')).toBeVisible();
  });
});