import { expect } from '@playwright/test';
import { When, Then } from '../bdd';

// =============================================================================
// Form Input Steps
// =============================================================================

When('I fill in {string} with {string}', async ({ page }, field: string, value: string) => {
  // Try multiple strategies: placeholder, label text, name attribute
  const byPlaceholder = page.getByPlaceholder(field);
  const byLabel = page.getByLabel(field);
  const byName = page.locator(`input[name="${field}"], textarea[name="${field}"]`);

  if (await byPlaceholder.count() > 0) {
    await byPlaceholder.fill(value);
  } else if (await byLabel.count() > 0) {
    await byLabel.fill(value);
  } else {
    await byName.fill(value);
  }
});

When('I fill in the field with placeholder {string} with {string}', async ({ page }, placeholder: string, value: string) => {
  await page.getByPlaceholder(placeholder).fill(value);
});

When('I clear the field {string}', async ({ page }, field: string) => {
  const byPlaceholder = page.getByPlaceholder(field);
  const byLabel = page.getByLabel(field);

  if (await byPlaceholder.count() > 0) {
    await byPlaceholder.clear();
  } else {
    await byLabel.clear();
  }
});

// =============================================================================
// Click Steps
// =============================================================================

When('I click the {string} button', async ({ page }, name: string) => {
  await page.getByRole('button', { name: new RegExp(name, 'i') }).click();
});

When('I click the {string} link', async ({ page }, name: string) => {
  await page.getByRole('link', { name: new RegExp(name, 'i') }).click();
});

When('I click on {string}', async ({ page }, text: string) => {
  await page.getByText(text, { exact: false }).first().click();
});

// =============================================================================
// Select/Checkbox Steps
// =============================================================================

When('I select {string} from {string}', async ({ page }, option: string, field: string) => {
  await page.getByLabel(field).selectOption(option);
});

When('I check {string}', async ({ page }, label: string) => {
  await page.getByLabel(label).check();
});

When('I uncheck {string}', async ({ page }, label: string) => {
  await page.getByLabel(label).uncheck();
});

// =============================================================================
// Form Field Assertions
// =============================================================================

Then('the field {string} should have value {string}', async ({ page }, field: string, value: string) => {
  const byPlaceholder = page.getByPlaceholder(field);
  const byLabel = page.getByLabel(field);

  if (await byPlaceholder.count() > 0) {
    await expect(byPlaceholder).toHaveValue(value);
  } else {
    await expect(byLabel).toHaveValue(value);
  }
});

Then('the field {string} should be empty', async ({ page }, field: string) => {
  const byPlaceholder = page.getByPlaceholder(field);
  const byLabel = page.getByLabel(field);

  if (await byPlaceholder.count() > 0) {
    await expect(byPlaceholder).toHaveValue('');
  } else {
    await expect(byLabel).toHaveValue('');
  }
});

Then('the checkbox {string} should be checked', async ({ page }, label: string) => {
  await expect(page.getByLabel(label)).toBeChecked();
});

Then('the checkbox {string} should not be checked', async ({ page }, label: string) => {
  await expect(page.getByLabel(label)).not.toBeChecked();
});
