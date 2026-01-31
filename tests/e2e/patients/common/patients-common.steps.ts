import { expect } from '@playwright/test';
import { Given, When, Then } from '../../common/bdd';
import { patientFactory } from '../../factories/patient.factory';

// Store created patient name for later reference
let createdPatientName = '';
const testPatient = patientFactory.build();

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
  await page.waitForSelector('form'); // General wait for form
  await page.evaluate(() => {
    const form = document.querySelector('form');
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
  await page.getByLabel(/Allergies|Alergias/i).fill(value);
});

When('I fill all patient fields with test data', async ({ page }) => {
  await page.getByLabel(/First Name|Nombre/i).fill(testPatient.firstName);
  await page.getByLabel(/Last Name|Apellidos/i).fill(testPatient.lastName);
  await page.getByLabel(/ID Document|DNI/i).fill(testPatient.taxId!);
  await page.getByLabel(/Date of Birth|Fecha de Nacimiento/i).fill(testPatient.dateOfBirth!);
  await page.getByLabel(/Phone Number|Número de Teléfono/i).fill(testPatient.phone!);
  await page.getByLabel(/Email address|Email/i).fill(testPatient.email!);
  await page.getByLabel(/Address|Direcci.n/i).fill(testPatient.address!);
  await page.getByLabel(/Profession|Profesi.n/i).fill(testPatient.profession!);
  await page.getByLabel(/Sports|Actividad F.sica/i).fill(testPatient.sportsActivity!);
  await page.getByLabel(/Rate|Tarifa/i).fill(testPatient.rate!);
  await page.getByLabel(/Allergies|Alergias/i).fill(testPatient.allergies!);
  await page.getByLabel(/Systemic Diseases|Enfermedades Sist.micas/i).fill(testPatient.systemicDiseases!);
  await page.getByLabel(/Surgeries|Cirug.as/i).fill(testPatient.surgeries!);
  await page.getByLabel(/Accidents|Traumatismos/i).fill(testPatient.accidents!);
  await page.getByLabel(/Current Medication|Medicaci.n Actual/i).fill(testPatient.medication!);
  await page.getByLabel(/Injuries|Lesiones/i).fill(testPatient.injuries!);
  await page.getByLabel(/Bruxism|Bruxismo/i).fill(testPatient.bruxism!);
  await page.getByLabel(/Insoles|Plantillas/i).fill(testPatient.insoles!);
  await page.getByLabel(/Others|Otros Detalles/i).fill(testPatient.others!);
  await page.getByLabel(/Notes|Observaciones/i).fill(testPatient.notes!);
});

When('I click the edit details button', async ({ page }) => {
  await page.getByTestId('edit-details-btn').click();
});

When('I search for patient {string}', async ({ page }, name: string) => {
  await page.getByRole('textbox').first().fill(name);
  await page.getByRole('button', { name: /Search|Buscar/i }).first().click();
  await page.waitForLoadState('networkidle');
});

When('I click on the patient link {string}', async ({ page }, name: string) => {
  const link = page.getByRole('link', { name: new RegExp(name) }).first();
  await expect(link).toBeVisible({ timeout: 10000 });
  await link.click();
  await page.waitForLoadState('networkidle');
});

When('I fill the patient name with unique values', async ({ page }) => {
  const uniquePatient = patientFactory.build();
  createdPatientName = uniquePatient.firstName;
  await page.getByLabel(/First Name|Nombre/i).fill(uniquePatient.firstName);
  await page.getByLabel(/Last Name|Apellidos/i).fill(uniquePatient.lastName);
});

When('I search for the created patient', async ({ page }) => {
  await page.getByRole('textbox').first().fill(createdPatientName);
  await page.getByRole('button', { name: /Search|Buscar/i }).first().click();
  await page.waitForLoadState('networkidle');
});

When('I click on the created patient link', async ({ page }) => {
  await page.getByRole('link', { name: new RegExp(createdPatientName) }).first().click();
});

// =============================================================================
// Patient Search Assertions
// =============================================================================

Then('I should see {int} patient rows in the table', async ({ page }, count: number) => {
  // Excluding the "No patients found" row if it exists, or handling empty state.
  // The original locator was tbody tr:not(:has-text("No patients found"))
  // We can use getByRole('row') but we need to filter.
  // We'll count all rows and subtract header (1).
  // If "No patients found" is present, it's 1 row (+header).
  // If valid patients, it's N rows (+header).
  // So strict logic: get rows, exclude header, exclude "No patients found".
  // This is simpler with locator logic but we want roles.
  // page.getByRole('row').filter({ hasNot: page.getByRole('columnheader') }).filter({ hasNotText: 'No patients found' })
  await expect(page.getByRole('row')
    .filter({ hasNot: page.locator('th') }) // exclude header
    .filter({ hasNotText: /No patients found|No se encontraron pacientes/i }) // exclude empty msg
  ).toHaveCount(count);
});

// =============================================================================
// Patient Assertions
// =============================================================================

Then('the patient DNI field should have the test data value', async ({ page }) => {
  await expect(page.getByLabel(/ID Document|DNI/i)).toHaveValue(testPatient.taxId!);
});

Then('the patient DNI field should have value {string}', async ({ page }, value: string) => {
  await expect(page.getByLabel(/ID Document|DNI/i)).toHaveValue(value);
});

Then('the patient injuries field should have the test data value', async ({ page }) => {
  await expect(page.getByLabel(/Injuries|Lesiones/i)).toHaveValue(testPatient.injuries!);
});

Then('the patient observations field should have the test data value', async ({ page }) => {
  await expect(page.getByLabel(/Notes|Observaciones/i)).toHaveValue(testPatient.notes!);
});

// =============================================================================
// Patient Data Setup
// =============================================================================

Given('the database has fixture data', async ({ request }) => {
  const response = await request.post('/api/test/reset-db');
  expect(response.ok()).toBeTruthy();
});
