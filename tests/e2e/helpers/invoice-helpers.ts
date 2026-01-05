/**
 * E2E Test Helpers - Invoice Form
 */

import { Page, expect, Locator } from '@playwright/test';

/**
 * Get invoice input by label text
 */
export function invoiceInput(page: Page, label: string): Locator {
  // Try to find input first, if not found try textarea
  const parent = page.locator('form').locator(`label:has-text("${label}")`).locator('..');
  return parent.locator('input, textarea').first();
}

/**
 * Set invoice input value by label
 */
export async function setInvoiceInputValue(page: Page, label: string, value: string): Promise<void> {
  const input = invoiceInput(page, label);
  await input.fill(value);
  await expect(input).toHaveValue(value);
}
