// @ts-check
import { test, expect } from '@playwright/test';

/**
 * E2E tests for Audit System
 *
 * These tests verify that the audit trail system correctly captures
 * database changes made through the UI and API.
 */

async function resetDbEmpty(request) {
  const response = await request.post('/api/test/reset-db-empty');
  expect(response.ok()).toBeTruthy();
}

async function login(page) {
  await page.addInitScript(() => {
    localStorage.setItem('app_locale', 'en');
  });
  await page.goto('/login');
  await page.fill('input[name="email"]', 'tina@tinafisio.com');
  await page.fill('input[name="password"]', 'password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('/dashboard');
}

async function apiFetch(page, url, options = {}) {
  return await page.evaluate(async ({ url, options }) => {
    const token = localStorage.getItem('token');
    const headers = {
      Accept: 'application/ld+json',
      ...(options.headers || {}),
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const response = await fetch(url, {
      ...options,
      headers,
    });
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('json') ? await response.json() : await response.text();
    return {
      status: response.status,
      data,
      contentType,
    };
  }, { url, options });
}

async function getAuditTrails(page, entityType = null, entityId = null) {
  let url = '/api/audit_trails?order[changedAt]=desc';
  if (entityType) {
    url += `&entityType=${entityType}`;
  }
  if (entityId) {
    url += `&entityId=${entityId}`;
  }
  return apiFetch(page, url);
}

async function getAuditTrailCount(page) {
  const response = await getAuditTrails(page);
  expect(response.status).toBe(200);
  const members = response.data.member || response.data['hydra:member'] || [];
  return members.length;
}

function customerInput(page, label) {
  return page.locator('form').locator(`label:has-text("${label}")`).locator('..').locator('input, textarea');
}

async function setCustomerInputValue(page, label, value) {
  const input = customerInput(page, label);
  await input.waitFor({ state: 'attached' });
  await expect(input).toBeEnabled({ timeout: 10000 });
  await input.fill(value);
}

test('audit trail captures customer creation', async ({ page, request }) => {
  // Reset database and login
  await resetDbEmpty(request);
  await login(page);

  // Get initial audit trail count
  const initialAuditCount = await getAuditTrailCount(page);

  // Navigate to customers and create a new customer
  await page.goto('/customers');
  await page.getByRole('link', { name: 'New Customer' }).click();

  // Fill in customer details
  await setCustomerInputValue(page, 'First Name', 'John');
  await setCustomerInputValue(page, 'Last Name', 'AuditTest');
  await setCustomerInputValue(page, 'Tax ID', 'AUDIT001');
  await setCustomerInputValue(page, 'Email', 'john.audit@example.com');
  await setCustomerInputValue(page, 'Phone', '+1234567890');
  await setCustomerInputValue(page, 'Address', '123 Audit St');

  // Save customer
  await page.getByRole('button', { name: 'Save Customer' }).click();

  // Wait for redirect back to customers list
  await expect(page).toHaveURL(/\/customers$/);
  await page.waitForTimeout(1000);

  // Verify audit trail was created
  const finalAuditCount = await getAuditTrailCount(page);
  expect(finalAuditCount).toBeGreaterThan(initialAuditCount);

  // Get the latest audit trail for Customer entity
  const auditResponse = await getAuditTrails(page, 'Customer');
  expect(auditResponse.status).toBe(200);

  const audits = auditResponse.data.member || auditResponse.data['hydra:member'] || [];
  expect(audits.length).toBeGreaterThan(0);

  // Verify the most recent audit trail
  const latestAudit = audits[0];
  expect(latestAudit.entityType).toBe('Customer');
  expect(latestAudit.operation).toBe('created');

  // Verify captured changes include customer data
  expect(latestAudit.changes).toBeDefined();
  expect(latestAudit.changes.firstName).toBeDefined();
  expect(latestAudit.changes.firstName.after).toBe('John');
  expect(latestAudit.changes.firstName.before).toBeNull();

  expect(latestAudit.changes.lastName).toBeDefined();
  expect(latestAudit.changes.lastName.after).toBe('AuditTest');

  expect(latestAudit.changes.taxId).toBeDefined();
  expect(latestAudit.changes.taxId.after).toBe('AUDIT001');
});

test('audit trail captures customer updates', async ({ page, request }) => {
  // Reset database and login
  await resetDbEmpty(request);
  await login(page);

  // Create a customer first
  await page.goto('/customers');
  await page.getByRole('link', { name: 'New Customer' }).click();

  await setCustomerInputValue(page, 'First Name', 'Jane');
  await setCustomerInputValue(page, 'Last Name', 'UpdateTest');
  await setCustomerInputValue(page, 'Tax ID', 'UPDATE001');
  await setCustomerInputValue(page, 'Email', 'jane.update@example.com');
  await setCustomerInputValue(page, 'Address', '456 Update St');

  await page.getByRole('button', { name: 'Save Customer' }).click();
  await expect(page).toHaveURL(/\/customers$/);
  await page.waitForTimeout(1000);

  // Get the customer ID from the list
  const customersResponse = await apiFetch(page, '/api/customers?page=1&itemsPerPage=10');
  const customers = customersResponse.data.member || customersResponse.data['hydra:member'] || [];
  expect(customers.length).toBeGreaterThan(0);
  const customer = customers[0];
  const customerId = customer.id;

  // Clear existing audit trails for clean test
  const beforeUpdateAuditCount = await getAuditTrailCount(page);

  // Now edit the customer
  await page.getByRole('row').filter({ hasText: 'Jane' }).getByTitle('Edit').click();

  // Wait for form to load
  await page.waitForTimeout(500);

  // Update some fields
  await setCustomerInputValue(page, 'First Name', 'Janet');
  await setCustomerInputValue(page, 'Email', 'janet.updated@example.com');

  // Save changes
  await page.getByRole('button', { name: 'Save Customer' }).click();
  await expect(page).toHaveURL(/\/customers$/);
  await page.waitForTimeout(1000);

  // Verify audit trail was created for the update
  const afterUpdateAuditCount = await getAuditTrailCount(page);
  expect(afterUpdateAuditCount).toBeGreaterThan(beforeUpdateAuditCount);

  // Get audit trails for this specific customer
  const auditResponse = await getAuditTrails(page, 'Customer', customerId.toString());
  const audits = auditResponse.data.member || auditResponse.data['hydra:member'] || [];

  // Find the update operation (should be the first one after sorting by date desc)
  const updateAudit = audits.find(a => a.operation === 'updated');
  expect(updateAudit).toBeDefined();

  // Verify the changes captured
  expect(updateAudit.changes.firstName).toBeDefined();
  expect(updateAudit.changes.firstName.before).toBe('Jane');
  expect(updateAudit.changes.firstName.after).toBe('Janet');

  expect(updateAudit.changes.email).toBeDefined();
  expect(updateAudit.changes.email.before).toBe('jane.update@example.com');
  expect(updateAudit.changes.email.after).toBe('janet.updated@example.com');

  // Verify timestamp is recent (lenient for timezone diffs)
  expect(updateAudit.changedAt).toBeDefined();
  const auditTime = new Date(updateAudit.changedAt);
  const now = new Date();
  const diffMinutes = Math.abs(now - auditTime) / 1000 / 60;
  expect(diffMinutes).toBeLessThan(120); 
});

test('audit trail captures patient creation', async ({ page, request }) => {
  // Reset database and login
  await resetDbEmpty(request);
  await login(page);

  // Get initial audit trail count
  const initialAuditCount = await getAuditTrailCount(page);

  // Navigate to patients and create a new patient
  await page.goto('/patients');
  await page.getByRole('link', { name: 'New Patient' }).click();

  // Fill in patient details using standard input locators
  const firstNameInput = page.locator('input[name="firstName"]');
  await firstNameInput.waitFor({ state: 'attached' });
  await firstNameInput.fill('Alice');

  const lastNameInput = page.locator('input[name="lastName"]');
  await lastNameInput.fill('PatientAudit');

  const emailInput = page.locator('input[name="email"]');
  await emailInput.fill('alice.patient@example.com');

  // Save patient
  await page.getByRole('button', { name: 'Save Patient' }).click();

  // Wait for redirect
  await page.waitForTimeout(1000);

  // Verify audit trail was created
  const finalAuditCount = await getAuditTrailCount(page);
  expect(finalAuditCount).toBeGreaterThan(initialAuditCount);

  // Get the latest audit trail for Patient entity
  const auditResponse = await getAuditTrails(page, 'Patient');
  expect(auditResponse.status).toBe(200);

  const audits = auditResponse.data.member || auditResponse.data['hydra:member'] || [];
  expect(audits.length).toBeGreaterThan(0);

  // Verify the most recent audit trail
  const latestAudit = audits[0];
  expect(latestAudit.entityType).toBe('Patient');
  expect(latestAudit.operation).toBe('created');

  // Verify captured changes
  expect(latestAudit.changes.firstName).toBeDefined();
  expect(latestAudit.changes.firstName.after).toBe('Alice');
  expect(latestAudit.changes.firstName.before).toBeNull();

  expect(latestAudit.changes.lastName).toBeDefined();
  expect(latestAudit.changes.lastName.after).toBe('PatientAudit');
});

test('audit trail includes user context when authenticated', async ({ page, request }) => {
  // Reset database and login
  await resetDbEmpty(request);
  await login(page);

  // Create a customer
  await page.goto('/customers');
  await page.getByRole('link', { name: 'New Customer' }).click();

  await setCustomerInputValue(page, 'First Name', 'Context');
  await setCustomerInputValue(page, 'Last Name', 'Test');
  await setCustomerInputValue(page, 'Tax ID', 'CONTEXT001');
  await setCustomerInputValue(page, 'Address', '789 Context St');

  await page.getByRole('button', { name: 'Save Customer' }).click();
  await expect(page).toHaveURL(/\/customers$/);
  await page.waitForTimeout(1000);

  // Get the latest audit trail
  const auditResponse = await getAuditTrails(page, 'Customer');
  const audits = auditResponse.data.member || auditResponse.data['hydra:member'] || [];
  expect(audits.length).toBeGreaterThan(0);

  const latestAudit = audits[0];

  // Verify user context is captured
  expect(latestAudit.changedAt).toBeDefined();
  expect(latestAudit).toHaveProperty('ipAddress');
  expect(latestAudit).toHaveProperty('userAgent');
});

test('no audit trail created when no changes are saved', async ({ page, request }) => {
  // Reset database and login
  await resetDbEmpty(request);
  await login(page);

  // Create a customer first
  await page.goto('/customers');
  await page.getByRole('link', { name: 'New Customer' }).click();

  await setCustomerInputValue(page, 'First Name', 'NoChange');
  await setCustomerInputValue(page, 'Last Name', 'Test');
  await setCustomerInputValue(page, 'Tax ID', 'NOCHANGE001');
  await setCustomerInputValue(page, 'Address', '321 NoChange St');

  await page.getByRole('button', { name: 'Save Customer' }).click();
  await expect(page).toHaveURL(/\/customers$/);
  await page.waitForTimeout(1000);

  // Get current audit count
  const beforeEditAuditCount = await getAuditTrailCount(page);

  // Edit the customer but don't change anything
  await page.waitForSelector('table');
  await page.getByRole('row').filter({ hasText: 'NoChange' }).getByTitle('Edit').click();
  await page.waitForTimeout(500);

  // Just save without changing anything
  await page.getByRole('button', { name: 'Save Customer' }).click();
  await expect(page).toHaveURL(/\/customers$/);
  await page.waitForTimeout(1000);

  // Verify no new audit trail was created
  const afterEditAuditCount = await getAuditTrailCount(page);
  expect(afterEditAuditCount).toBe(beforeEditAuditCount);
});