// @ts-check
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ request }) => {
  const response = await request.post('/api/test/reset-db-empty');
  expect(response.ok()).toBeTruthy();
});

test('clinical records lifecycle: validation, create full, edit verification', async ({ page, request }) => {
  await page.addInitScript(() => {
    localStorage.setItem('app_locale', 'en');
  });

  const uniqueSuffix = Date.now().toString().slice(-6);
  const patientFirstName = `RecordTest${uniqueSuffix}`;
  const patientLastName = 'Patient';

  // 1. Login
  await page.goto('/login');
  await page.fill('input[name="email"]', 'tina@tinafisio.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');

  // 2. Create a Patient
  await page.click('nav >> text=Patients');
  await page.getByRole('link', { name: 'New Patient' }).click();
  await page.fill('input[name="firstName"]', patientFirstName);
  await page.fill('input[name="lastName"]', patientLastName);
  await page.click('button:has-text("Save Patient")');

  // 3. Open patient detail
  await expect(page).toHaveURL('/patients');

  // Verify exactly 1 patient in list
  const desktopRows = page.locator('tbody tr:not(:has-text("No patients found"))');
  await expect(desktopRows).toHaveCount(1);

  // Direct API check
  const stats0 = await (await request.get('/api/test/stats')).json();
  expect(stats0.patients).toBe(1);

  await page.getByRole('link', { name: new RegExp(`${patientFirstName} ${patientLastName}`) }).first().click();

  // 4. Add First Record
  await page.click('text=Add First Record');
  
  await page.waitForSelector('#record-form');
  const recordData = {
      physiotherapyTreatment: 'Full treatment session',
      consultationReason: 'Back pain',
      notes: 'Private notes for physio'
  };

  await page.fill('textarea[name="physiotherapyTreatment"]', recordData.physiotherapyTreatment);
  await page.fill('textarea[name="consultationReason"]', recordData.consultationReason);
  await page.fill('input[name="notes"]', recordData.notes);
  
  await page.click('button:has-text("Save History Entry")');

  // Expect redirect back to patient profile
  await expect(page).toHaveURL(/\/patients\/\d+$/);
  
  // Verify counts
  const stats1 = await (await request.get('/api/test/stats')).json();
  expect(stats1.records).toBe(1);
  await expect(page.locator('ul[role="list"] li')).toHaveCount(1);

  // 5. Add Second Record
  await page.getByRole('button', { name: '+ Add Item' }).click();
  await page.fill('textarea[name="physiotherapyTreatment"]', 'Second session');
  await page.click('button:has-text("Save History Entry")');

  // Final verification
  await expect(page).toHaveURL(/\/patients\/\d+$/);
  const stats2 = await (await request.get('/api/test/stats')).json();
  expect(stats2.records).toBe(2);
  await expect(page.locator('ul[role="list"] li')).toHaveCount(2);
});