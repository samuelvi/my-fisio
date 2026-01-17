// @ts-check
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './common/auth';

async function resetDbEmpty(request) {
  const response = await request.post('/api/test/reset-db-empty');
  expect(response.ok()).toBeTruthy();
}

test('patient creation flow with server validation', async ({ page, request, context }) => {
  await resetDbEmpty(request);
  await loginAsAdmin(page, context);

  // 1) No patients empty state
  await page.goto('/patients');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).toContainText(/No patients found|No se encontraron pacientes/i);

  // 2) New patient
  await page.getByTestId('new-patient-btn').click().catch(async () => {
      await page.getByRole('link', { name: /New Patient|Nuevo Paciente/i }).click();
  });
  await expect(page).toHaveURL('/patients/new');

  // 3) Save with empty required fields -> server errors (server-side)
    await page.waitForSelector('#patient-form');
    await page.evaluate(() => {
        const form = document.querySelector('#patient-form');
        if (form) form.setAttribute('novalidate', 'true');
    });

    await page.getByLabel(/First Name|Nombre/i).clear();
    await page.getByLabel(/Last Name|Apellidos/i).clear();

    await page.getByTestId('save-patient-btn').click();
    await expect(page.locator('body')).toContainText(/This value should not be blank|Este valor no deber.a estar vac.o/i);

  // 4) Fill required fields only
  await page.getByLabel(/First Name|Nombre/i).fill('TestFirst');
  await page.getByLabel(/Last Name|Apellidos/i).fill('TestLast');

  // 5) Save and confirm list
  await page.getByTestId('save-patient-btn').click();
  await page.waitForURL(/\/patients$/);
  await page.waitForLoadState('networkidle');
  
  // Search for the patient to ensure they are visible
  await page.locator('input[type="text"]').first().fill('TestFirst');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');
  
  await expect(page.locator('body')).toContainText('TestFirst TestLast');

  // 6) Edit and verify values
  await page.getByRole('link', { name: /TestFirst TestLast/ }).first().click();
  await page.waitForLoadState('networkidle');
  
  await expect(page.locator('body')).toContainText('TestFirst TestLast');
  
  await page.getByTestId('edit-details-btn').click();
  await expect(page).toHaveURL(/\/patients\/\d+\/edit/);
  await expect(page.getByLabel(/First Name|Nombre/i)).toHaveValue('TestFirst');
  await expect(page.getByLabel(/Last Name|Apellidos/i)).toHaveValue('TestLast');

  // 7) Fill all fields and save
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

  await page.getByTestId('save-patient-btn').click();
  await page.waitForURL(/\/patients\/\d+$/);

  // 8) Re-open edit and verify all values
  await page.getByTestId('edit-details-btn').click();
  await expect(page).toHaveURL(/\/patients\/\d+\/edit/);
  await expect(page.getByLabel(/ID Document|DNI/i)).toHaveValue('12345678A');
});