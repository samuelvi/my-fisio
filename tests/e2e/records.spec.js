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

  // 3. Open patient detail before adding first record
  await expect(page).toHaveURL('/patients');

  // VERIFY EXACTLY 1 PATIENT IN LIST (Desktop & Mobile)
  const desktopRows = page.locator('tbody tr:not(:has-text("No patients found"))');
  const mobileLinks = page.locator('.md\\:hidden a[href^="/patients/"]');
  
  await expect(desktopRows).toHaveCount(1);
  if (await mobileLinks.count() > 0) {
      await expect(mobileLinks).toHaveCount(1);
  }

  // DIRECT API VERIFICATION (Patient count)
  const statsResponse = await request.get('/api/test/stats');
  const stats = await statsResponse.json();
  expect(stats.patients).toBe(1);

  await page.getByPlaceholder('Search by name, phone or email...').fill(`${patientFirstName} ${patientLastName}`);
  await page.getByRole('button', { name: 'Search' }).click();
  await page.getByRole('link', { name: `${patientFirstName} ${patientLastName}` }).first().click();

  // 4. Go to Add First Record
  await page.click('text=Add First Record');
  
  // 5. Test Server Validation (Empty Form)
  await page.waitForSelector('#record-form');
  // Disable HTML5 validation
  await page.evaluate(() => {
      const form = document.querySelector('#record-form');
      if (form) form.setAttribute('novalidate', 'true');
  });

  // Ensure mandatory field is empty
  await page.fill('textarea[name="physiotherapyTreatment"]', '');

  // Submit and expect 422 error
  const [invalidResponse] = await Promise.all([
      page.waitForResponse(response =>
          response.url().includes('/api/records') &&
          response.request().method() === 'POST'
      ),
      page.click('button:has-text("Save History Entry")')
  ]);
  
  expect(invalidResponse.status()).toBe(422);
  const invalidContentType = invalidResponse.headers()['content-type'] || '';
  if (invalidContentType.includes('json')) {
      const invalidData = await invalidResponse.json();
      expect(Array.isArray(invalidData.violations)).toBeTruthy();
  }

  // Verify error message in UI
  await expect(page.getByText('This value should not be blank.').first()).toBeVisible();
  await expect(page).toHaveURL(/\/patients\/\d+\/records\/new/);

  // 5. Fill ALL fields
  const recordData = {
      physiotherapyTreatment: 'Full treatment session',
      consultationReason: 'Back pain',
      onset: '2 days ago',
      currentSituation: 'Pain level 7/10',
      evolution: 'Improving',
      radiologyTests: 'X-Ray clear',
      medicalTreatment: 'Ibuprofen',
      homeTreatment: 'Stretching',
      notes: 'Private notes for physio',
      sickLeave: true
  };

  await page.fill('textarea[name="physiotherapyTreatment"]', recordData.physiotherapyTreatment);
  await page.fill('textarea[name="consultationReason"]', recordData.consultationReason);
  await page.fill('textarea[name="onset"]', recordData.onset);
  await page.fill('textarea[name="currentSituation"]', recordData.currentSituation);
  await page.fill('textarea[name="evolution"]', recordData.evolution);
  await page.fill('input[name="radiologyTests"]', recordData.radiologyTests);
  await page.fill('input[name="medicalTreatment"]', recordData.medicalTreatment);
  await page.fill('textarea[name="homeTreatment"]', recordData.homeTreatment);
  await page.fill('input[name="notes"]', recordData.notes);
  
  // Check sick leave
  await page.check('input[name="sickLeave"]');

  // 6. Save and Verify Success
  const [successResponse] = await Promise.all([
      page.waitForResponse(response =>
          response.url().includes('/api/records') &&
          response.request().method() === 'POST' &&
          response.status() === 201
      ),
      page.click('button:has-text("Save History Entry")')
  ]);

  // Expect redirect back to patient profile
  await expect(page).toHaveURL(/\/patients\/\d+$/);
  
  // DIRECT API VERIFICATION (1 Record)
  const stats1 = await (await request.get('/api/test/stats')).json();
  expect(stats1.records).toBe(1);

  // Verify record appears in timeline
  await expect(page.locator('text=Full treatment session')).toBeVisible();

  // VERIFY EXACTLY 1 RECORD
  const timelineItemsBefore = page.locator('ul[role="list"] li');
  await expect(timelineItemsBefore).toHaveCount(1);

  // 7. Add SECOND Record
  await page.getByRole('button', { name: '+ Add Item' }).click();
  await expect(page).toHaveURL(/\/patients\/\d+\/records\/new/);

  const secondRecordData = {
      physiotherapyTreatment: 'Second treatment session',
      notes: 'Second record notes'
  };

  await page.fill('textarea[name="physiotherapyTreatment"]', secondRecordData.physiotherapyTreatment);
  await page.fill('input[name="notes"]', secondRecordData.notes);

  const [secondSuccessResponse] = await Promise.all([
      page.waitForResponse(response =>
          response.url().includes('/api/records') &&
          response.request().method() === 'POST' &&
          response.status() === 201
      ),
      page.click('button:has-text("Save History Entry")')
  ]);

  // Expect redirect back to patient profile
  await expect(page).toHaveURL(/\/patients\/\d+$/);

  // DIRECT API VERIFICATION (2 Records)
  const stats2 = await (await request.get('/api/test/stats')).json();
  expect(stats2.records).toBe(2);

  // VERIFY EXACTLY 2 RECORDS
  const timelineItemsAfter = page.locator('ul[role="list"] li');
  await expect(timelineItemsAfter).toHaveCount(2);
  await expect(page.locator('text=Second treatment session')).toBeVisible();
  await expect(page.locator('text=Full treatment session')).toBeVisible();

  // 8. Click Edit on the first record to verify persistence (the first one in the UI is the newest)
  await page.getByRole('link', { name: 'Edit' }).first().click();

  // 8. Verify ALL fields in Edit Mode
  await expect(page.locator('textarea[name="physiotherapyTreatment"]')).toHaveValue(recordData.physiotherapyTreatment);
  await expect(page.locator('textarea[name="consultationReason"]')).toHaveValue(recordData.consultationReason);
  await expect(page.locator('textarea[name="onset"]')).toHaveValue(recordData.onset);
  await expect(page.locator('textarea[name="currentSituation"]')).toHaveValue(recordData.currentSituation);
  await expect(page.locator('textarea[name="evolution"]')).toHaveValue(recordData.evolution);
  await expect(page.locator('input[name="radiologyTests"]')).toHaveValue(recordData.radiologyTests);
  await expect(page.locator('input[name="medicalTreatment"]')).toHaveValue(recordData.medicalTreatment);
  await expect(page.locator('textarea[name="homeTreatment"]')).toHaveValue(recordData.homeTreatment);
  await expect(page.locator('input[name="notes"]')).toHaveValue(recordData.notes);
  
  // Verify checkbox state
  await expect(page.locator('input[name="sickLeave"]')).toBeChecked();
});
