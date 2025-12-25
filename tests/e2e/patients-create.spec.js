// @ts-check
import { test, expect } from '@playwright/test';

async function resetDbEmpty(request) {
  const response = await request.post('/api/test/reset-db-empty');
  expect(response.ok()).toBeTruthy();
}

async function login(page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'tina@tinafisio.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
}

test('patient creation flow with server validation', async ({ page, request }) => {
  await page.addInitScript(() => {
    localStorage.setItem('app_locale', 'en');
  });

  await resetDbEmpty(request);
  await login(page);

  // 1) No patients empty state
  await page.goto('/patients');
  await expect(page.getByText(/No patients found/).first()).toBeVisible();

  // 2) New patient
  await page.getByRole('link', { name: 'New Patient' }).click();
  await expect(page).toHaveURL('/patients/new');

  // 3) Save with empty required fields -> server errors (server-side)
    // Wait for form to be ready
    await page.waitForSelector('#patient-form');
    // Disable client-side validation
    await page.evaluate(() => {
        const form = document.querySelector('#patient-form');
        if (form) form.setAttribute('novalidate', 'true');
    });

    await page.getByLabel(/First Name/).clear();
    await page.getByLabel(/Last Name/).clear();

    const [invalidResponse] = await Promise.all([
        page.waitForResponse(response =>
            response.url().includes('/api/patients') &&
            response.request().method() === 'POST'
        ),
        page.getByRole('button', { name: 'Save Patient' }).click()
    ]);

    const invalidData = await invalidResponse.json();
  expect(Array.isArray(invalidData.violations)).toBeTruthy();
  await expect(page).toHaveURL('/patients/new');
  await expect(page.getByText('This value should not be blank.').first()).toBeVisible();

  // 4) Fill required fields only
  await page.getByLabel(/First Name/).fill('TestFirst');
  await page.getByLabel(/Last Name/).fill('TestLast');

  // 5) Save and confirm list
  const successResponsePromise = page.waitForResponse(
    (response) => response.url().includes('/api/patients') && response.status() === 201
  );
  await page.getByRole('button', { name: 'Save Patient' }).click();
  await successResponsePromise;
  await expect(page).toHaveURL('/patients');
  await expect(page.getByRole('link', { name: /TestFirst TestLast/ }).first()).toBeVisible();

  // 6) Edit and verify values
  await page.getByRole('link', { name: /TestFirst TestLast/ }).first().click();
  await page.getByRole('button', { name: 'Edit Details' }).click();
  await expect(page).toHaveURL(/\/patients\/\d+\/edit/);
  await expect(page.getByLabel(/First Name/)).toHaveValue('TestFirst');
  await expect(page.getByLabel(/Last Name/)).toHaveValue('TestLast');

  // 7) Fill all fields and save
  await page.getByLabel(/ID Document/).fill('12345678A');
  await page.getByLabel(/Date of Birth/).fill('1990-05-15');
  await page.getByLabel(/Phone Number/).fill('600123456');
  await page.getByLabel(/Email address/).fill('testfirst.last@example.com');
  await page.getByLabel(/^Address$/).fill('Main Street 1');
  await page.getByLabel(/^Profession$/).fill('Physio');
  await page.getByLabel(/Sports/).fill('Running');
  await page.getByLabel(/^Rate$/).fill('50 EUR');
  await page.getByLabel(/^Allergies$/).fill('None');
  await page.getByLabel(/Systemic Diseases/).fill('None');
  await page.getByLabel(/^Surgeries$/).fill('None');
  await page.getByLabel(/Accidents/).fill('None');
  await page.getByLabel(/Current Medication/).fill('None');
  await page.getByLabel(/^Injuries$/).fill('None');
  await page.getByLabel(/^Bruxism$/).fill('No');
  await page.getByLabel(/^Insoles$/).fill('No');
  await page.getByLabel(/^Others$/).fill('Other info');
  await page.getByLabel(/^Notes$/).fill('Patient notes');

  await page.getByRole('button', { name: 'Save Patient' }).click();
  await expect(page).toHaveURL(/\/patients\/\d+$/);

  // 8) Re-open edit and verify all values
  await page.getByRole('button', { name: 'Edit Details' }).click();
  await expect(page).toHaveURL(/\/patients\/\d+\/edit/);
  await expect(page.getByLabel(/ID Document/)).toHaveValue('12345678A');
  await expect(page.getByLabel(/Date of Birth/)).toHaveValue('1990-05-15');
  await expect(page.getByLabel(/Phone Number/)).toHaveValue('600123456');
  await expect(page.getByLabel(/Email address/)).toHaveValue('testfirst.last@example.com');
  await expect(page.getByLabel(/^Address$/)).toHaveValue('Main Street 1');
  await expect(page.getByLabel(/^Profession$/)).toHaveValue('Physio');
  await expect(page.getByLabel(/Sports/)).toHaveValue('Running');
  await expect(page.getByLabel(/^Rate$/)).toHaveValue('50 EUR');
  await expect(page.getByLabel(/^Allergies$/)).toHaveValue('None');
  await expect(page.getByLabel(/Systemic Diseases/)).toHaveValue('None');
  await expect(page.getByLabel(/^Surgeries$/)).toHaveValue('None');
  await expect(page.getByLabel(/Accidents/)).toHaveValue('None');
  await expect(page.getByLabel(/Current Medication/)).toHaveValue('None');
  await expect(page.getByLabel(/^Injuries$/)).toHaveValue('None');
  await expect(page.getByLabel(/^Bruxism$/)).toHaveValue('No');
  await expect(page.getByLabel(/^Insoles$/)).toHaveValue('No');
  await expect(page.getByLabel(/^Others$/)).toHaveValue('Other info');
  await expect(page.getByLabel(/^Notes$/)).toHaveValue('Patient notes');
});
