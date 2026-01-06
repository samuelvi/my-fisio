/**
 * E2E Tests - Appointment Network Error Handling
 *
 * Verifies that a red alert banner appears when network errors occur
 * during appointment operations (create, edit, delete, drag&drop).
 */

import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Appointment Network Error Handling', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage, context }) => {
    page = testPage;
    await loginAsAdmin(page, context);
    await page.goto('/appointments');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.fc');
  });

  test('should show error alert when creating appointment fails due to network', async ({ context }) => {
    const newBtn = page.locator('button:has-text("Nueva Cita"), button:has-text("New Appointment"), button:has-text("+")').first();
    await newBtn.click(); 

    await page.fill('input[placeholder*="vacio"], input[placeholder*="empty"]', 'Network Test Create');

    await context.setOffline(true);
    await page.click('button[type="submit"]');

    const alert = page.locator('#network-error-alert');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('Error de conexión');

    await alert.locator('button').click();
    await expect(alert).not.toBeVisible();

    await context.setOffline(false);
  });

  test('should show error alert when dragging appointment fails due to network', async ({ context }) => {
    const newBtn = page.locator('button:has-text("Nueva Cita"), button:has-text("New Appointment"), button:has-text("+")').first();
    await newBtn.click(); 
    await page.fill('input[placeholder*="vacio"], input[placeholder*="empty"]', 'DragTarget');
    await page.click('button[type="submit"]');
    
    await page.waitForResponse(resp => resp.url().includes('/api/appointments') && resp.status() === 201);
    await page.waitForTimeout(2000); 

    const event = page.locator('.fc-event', { hasText: 'DragTarget' }).first();
    await expect(event).toBeVisible();

    await context.setOffline(true);

    // Use a simpler drag method - target a column
    const target = page.locator('.fc-timegrid-col').last();
    console.log('Dragging to column...');
    await event.dragTo(target, { force: true });

    await expect(page.locator('#network-error-alert')).toBeVisible();
    await context.setOffline(false);
  });

  test('should show error alert when editing appointment fails due to network', async ({ context }) => {
    const newBtn = page.locator('button:has-text("Nueva Cita"), button:has-text("New Appointment"), button:has-text("+")').first();
    await newBtn.click(); 
    await page.fill('input[placeholder*="vacio"], input[placeholder*="empty"]', 'EditTarget');
    await page.click('button[type="submit"]');
    
    await page.waitForResponse(resp => resp.url().includes('/api/appointments') && resp.status() === 201);
    await page.waitForTimeout(2000);
    
    const event = page.locator('.fc-event', { hasText: 'EditTarget' }).first();
    await event.click({ force: true });
    
    await expect(page.getByRole('heading', { name: /Edit Appointment|Editar Cita/i })).toBeVisible();
    await page.fill('input[placeholder*="vacio"], input[placeholder*="empty"]', 'EditModified');

    await context.setOffline(true);
    await page.click('button[type="submit"]');

    await expect(page.locator('#network-error-alert')).toBeVisible();
    await context.setOffline(false);
  });

  test('should show error alert when deleting appointment fails due to network', async ({ context }) => {
    const newBtn = page.locator('button:has-text("Nueva Cita"), button:has-text("New Appointment"), button:has-text("+")').first();
    await newBtn.click(); 
    await page.fill('input[placeholder*="vacio"], input[placeholder*="empty"]', 'DeleteTarget');
    await page.click('button[type="submit"]');
    
    await page.waitForResponse(resp => resp.url().includes('/api/appointments') && resp.status() === 201);
    await page.waitForTimeout(2000);
    
    const event = page.locator('.fc-event', { hasText: 'DeleteTarget' }).first();
    await event.click({ force: true });
    
    await expect(page.getByRole('heading', { name: /Edit Appointment|Editar Cita/i })).toBeVisible();
    await page.locator('button[title="Borrar"], button[title="Delete"]').click();
    
    await page.waitForTimeout(500);
    await expect(page.locator('h3', { hasText: /Delete|Borrar/i }).last()).toBeVisible();

    await context.setOffline(true);
    await page.getByRole('button', { name: /Borrar|Delete/i }).last().click();

    await expect(page.locator('#network-error-alert')).toBeVisible();
    await context.setOffline(false);
  });
});