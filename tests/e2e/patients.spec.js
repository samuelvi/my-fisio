// @ts-check
import { test, expect } from '@playwright/test';

// test.beforeEach(async ({ request }) => {
//   // Reset Database before each test
//   const response = await request.post('/api/test/reset-db');
//   expect(response.ok()).toBeTruthy();
// });

test('can create a patient and see it in the list', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  
  // 1. Login
  await page.goto('/login');
  await page.fill('input[name="email"]', 'admin@example.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/');

  // 2. Go to Patients list
  await page.click('text=Patients');
  await expect(page).toHaveURL('/patients');
  
  // Initially list might be empty (except if reset-db added some, but it only adds admin user)
  // Let's check if there's a "No patients found" message or similar if implemented
  
  // 3. Click New Patient
  await page.click('text=+ New Patient');
  await expect(page).toHaveURL('/patients/new');

  // 4. Fill form
  await page.fill('input[name="firstName"]', 'TestFirst');
  await page.fill('input[name="lastName"]', 'TestLast');
  await page.fill('input[name="phone"]', '555-1234');
  await page.fill('input[name="email"]', 'test@patient.com');
  
  // 5. Save
  await page.click('button:has-text("Save Patient")');

  // 6. Should be redirected back to list and see the patient
  await expect(page).toHaveURL('/patients');
  await expect(page.locator('text=TestFirst TestLast')).toBeVisible();
  await expect(page.locator('text=555-1234')).toBeVisible();
});
