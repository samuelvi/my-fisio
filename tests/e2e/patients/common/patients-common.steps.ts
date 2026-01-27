import { expect } from '@playwright/test';
import { Given, When, Then } from '../../common/bdd';

// Store created patient name for later reference
let createdPatientName = '';

// =============================================================================
// Patient Form Steps
// =============================================================================

When('I click the new patient button', async ({ page }) => {
  await page.getByTestId('new-patient-btn').click().catch(async () => {
    await page.getByRole('link', { name: /New Patient|Nuevo Paciente/i }).click();
  });
});

When('I click the save patient button', async ({ page }) => {
  await page.getByTestId('save-patient-btn').click();
});

When('I disable form validation', async ({ page }) => {
  await page.waitForSelector('#patient-form');
  await page.evaluate(() => {
    const form = document.querySelector('#patient-form');
    if (form) form.setAttribute('novalidate', 'true');
  });
});

When('I clear the first name field', async ({ page }) => {
  await page.getByLabel(/First Name|Nombre/i).clear();
});

When('I clear the last name field', async ({ page }) => {
  await page.getByLabel(/Last Name|Apellidos/i).clear();
});

When('I fill the allergies field with {string}', async ({ page }, value: string) => {
  await page.locator('#allergies').fill(value);
});

When('I fill all patient fields with test data', async ({ page }) => {
  await page.getByLabel(/ID Document|DNI/i).fill('12345678A');
  await page.getByLabel(/Date of Birth|Fecha de Nacimiento/i).fill('1990-05-15');
  await page.getByLabel(/Phone Number|Número de Teléfono/i).fill('600123456');
  await page.getByLabel(/Email address|Email/i).fill('testfirst.last@example.com');
  await page.getByLabel(/Address|Direcci.n/i).fill('Main Street 1');
  await page.getByLabel(/Profession|Profesi.n/i).fill('Physio');
  await page.getByLabel(/Sports|Actividad F.sica/i).fill('Running');
  await page.getByLabel(/Rate|Tarifa/i).fill('50 EUR');
  await page.locator('#allergies').fill('None');
  await page.getByLabel(/Systemic Diseases|Enfermedades Sist.micas/i).fill('None');
  await page.getByLabel(/Surgeries|Cirug.as/i).fill('None');
  await page.getByLabel(/Accidents|Traumatismos/i).fill('None');
  await page.getByLabel(/Current Medication|Medicaci.n Actual/i).fill('None');
  await page.getByLabel(/Injuries|Lesiones/i).fill('None');
  await page.getByLabel(/Bruxism|Bruxismo/i).fill('No');
  await page.getByLabel(/Insoles|Plantillas/i).fill('No');
  await page.getByLabel(/Others|Otros Detalles/i).fill('Other info');
  await page.getByLabel(/Notes|Observaciones/i).fill('Patient notes');
});

When('I click the edit details button', async ({ page }) => {
  await page.getByTestId('edit-details-btn').click();
});

When('I search for patient {string}', async ({ page }, name: string) => {
  await page.locator('input[type="text"]').first().fill(name);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');
});

When('I click on the patient link {string}', async ({ page }, name: string) => {
  const link = page.getByRole('link', { name: new RegExp(name) }).first();
  await expect(link).toBeVisible({ timeout: 10000 });
  await link.click();
  await page.waitForLoadState('networkidle');
});

When('I fill the patient name with unique values', async ({ page }) => {
  const uniqueSuffix = Date.now().toString().slice(-6);
  createdPatientName = `RecordTest${uniqueSuffix}`;
  await page.fill('input[name="firstName"]', createdPatientName);
  await page.fill('input[name="lastName"]', 'Patient');
});

When('I search for the created patient', async ({ page }) => {
  await page.locator('input[type="text"]').first().fill(createdPatientName);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');
});

When('I click on the created patient link', async ({ page }) => {
  await page.getByRole('link', { name: new RegExp(createdPatientName) }).first().click();
});

// =============================================================================
// Patient Search Assertions
// =============================================================================

Then('I should see {int} patient rows in the table', async ({ page }, count: number) => {
  await expect(page.locator('tbody tr:not(:has-text("No patients found"))')).toHaveCount(count);
});

// =============================================================================
// Patient Assertions
// =============================================================================

Then('the patient DNI field should have value {string}', async ({ page }, value: string) => {
  await expect(page.getByLabel(/ID Document|DNI/i)).toHaveValue(value);
});

// =============================================================================
// Patient Data Setup
// =============================================================================

Given('the database has fixture data', async ({ request }) => {
  const response = await request.post('/api/test/reset-db');
  expect(response.ok()).toBeTruthy();
});
