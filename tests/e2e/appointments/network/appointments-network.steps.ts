import { expect } from '@playwright/test';
import { Given, When, Then } from '../../common/bdd';
import { CalendarHelper } from '../../common/helpers/calendar.helper';

// =============================================================================
// Network Control Steps
// =============================================================================

Given('the browser is offline', async ({ context }) => {
  await context.setOffline(true);
});

When('the browser goes offline', async ({ context }) => {
  await context.setOffline(true);
});

// =============================================================================
// Server Mock Steps
// =============================================================================

Given('the server will return 500 on appointment creation', async ({ page }) => {
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
});

// =============================================================================
// Appointment Form Steps (network-specific)
// =============================================================================

When('I fill the appointment title with {string}', async ({ page }, title: string) => {
  const titleInput = page.getByRole('textbox').first();
  await expect(titleInput).toBeVisible();
  await titleInput.fill(title);
});

When('I click save appointment', async ({ page }) => {
  await page.getByTestId('save-appointment-btn').click();
});

When('I create a quick appointment with title {string}', async ({ page }, title: string) => {
  const newBtn = page.getByTestId('new-appointment-btn');
  await newBtn.click();

  const titleInput = page.getByRole('textbox').first();
  await expect(titleInput).toBeVisible();
  await titleInput.fill(title);

  await page.getByTestId('save-appointment-btn').click();

  await page.waitForResponse(resp =>
    resp.url().includes('/api/appointments') && resp.status() === 201
  );
});

When('the appointment {string} appears in the calendar', async ({ page }, title: string) => {
  await CalendarHelper.verifyEventVisible(page, title);
});

When('I should see the edit appointment heading', async ({ page }) => {
  await expect(page.getByRole('heading', { name: /Edit Appointment|Editar Cita/i })).toBeVisible();
});

When('I should see the delete confirmation dialog', async ({ page }) => {
  await expect(page.getByRole('heading', { name: /Delete|Borrar/i }).last()).toBeVisible();
});

When('I drag the appointment {string} to another time slot', async ({ page }, title: string) => {
  await CalendarHelper.dragEvent(page, title);
});

When('I dismiss the alert', async ({ page }) => {
  const alert = page.getByRole('alert');
  await alert.getByRole('button').click();
});

// =============================================================================
// Alert Assertions
// =============================================================================

Then('I should see the status alert', async ({ page }) => {
  await expect(page.getByRole('alert')).toBeVisible();
});

Then('I should see the status alert with connection error', async ({ page }) => {
  const alert = page.getByRole('alert');
  await expect(alert).toBeVisible();
  await expect(alert).toContainText(/Error de conexi.n|Connection Error/i);
});

Then('I should see the status alert with server error', async ({ page }) => {
  const alert = page.getByRole('alert');
  await expect(alert).toBeVisible();
  await expect(alert).toContainText(/Error del servidor|Server Error/i);
});

Then('the alert should contain {string}', async ({ page }, text: string) => {
  const alert = page.getByRole('alert');
  await expect(alert).toContainText(text);
});

Then('the status alert should not be visible', async ({ page }) => {
  await expect(page.getByRole('alert')).not.toBeVisible();
});

Then('the appointment modal should not be visible', async ({ page }) => {
  const modal = page.getByRole('heading', { name: /Nueva Cita|New Appointment/i });
  await expect(modal).not.toBeVisible();
});
