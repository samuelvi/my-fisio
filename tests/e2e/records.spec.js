// @ts-check
import { test, expect } from '@playwright/test';

// test.beforeEach(async ({ request }) => {
//   const response = await request.post('/api/test/reset-db');
//   expect(response.ok()).toBeTruthy();
// });

test('clinical records lifecycle: create, view and edit', async ({ page }) => {
  // 1. Login
  await page.goto('/login');
  await page.fill('input[name="email"]', 'admin@example.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/');

  // 2. Create a Patient
  await page.click('nav >> text=Patients');
  await page.click('text=+ New Patient');
  await page.fill('input[name="firstName"]', 'Test');
  await page.fill('input[name="lastName"]', 'Patient');
  await page.click('button:has-text("Save Patient")');

  // 3. Go to Detail and Verify Empty State
  await page.click('text=View');
  await expect(page.locator('text=No records found for this patient')).toBeVisible();

  // 4. Create First Record
  await page.click('text=Add First Record');
  await page.fill('textarea[name="physiotherapyTreatment"]', 'Initial Massage');
  await page.fill('textarea[name="evolution"]', 'Patient feels better');
  await page.click('button:has-text("Save Record")');

  // 5. Create Second Record
  // Wait for first record to be visible to ensure data loaded
  await expect(page.locator('text=Initial Massage')).toBeVisible();
  await page.getByRole('button', { name: /Add Record/i }).click();
  await page.fill('textarea[name="physiotherapyTreatment"]', 'Second Session');
  await page.fill('textarea[name="evolution"]', 'Significant improvement');
  await page.click('button:has-text("Save Record")');

  // 6. Verify Records are visible in Timeline
  await expect(page.locator('text=Initial Massage')).toBeVisible();
  await expect(page.locator('text=Second Session')).toBeVisible();

  // 7. Test "View" one by one (Modal)
  const firstRecordItem = page.locator('.flow-root li').filter({ hasText: 'Initial Massage' });
  await firstRecordItem.getByText('View').click();
  
  const modal = page.locator('[role="dialog"]');
  await expect(modal.locator('h3:has-text("Record Details")')).toBeVisible();
  await expect(modal.locator('text=Initial Massage')).toBeVisible();
  await modal.getByText('Close').click();

  // 8. Test "View All" (Full History Page)
  await page.click('text=View All');
  await expect(page).toHaveURL(/\/patients\/\d+\/history/);
  await expect(page.locator('h1:has-text("Clinical History")')).toBeVisible();
  await expect(page.locator('text=Initial Massage')).toBeVisible();
  await expect(page.locator('text=Second Session')).toBeVisible();
  await expect(page.locator('text=Significant improvement')).toBeVisible();

  // 9. Go back
  await page.click('text=Back to Profile');
  await expect(page).toHaveURL(/\/patients\/\d+$/);
});