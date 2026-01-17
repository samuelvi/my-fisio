/**
 * E2E tests for Audit System
 *
 * These tests verify that the audit trail system correctly captures
 * database changes made through the UI and API.
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

async function resetDbEmpty(request) {
  const response = await request.post('/api/test/reset-db-empty');
  expect(response.ok()).toBeTruthy();
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

function customerInput(page, labelRegex) {
  return page.locator('form').locator('label').filter({ hasText: labelRegex }).locator('..').locator('input, textarea');
}

async function setCustomerInputValue(page, labelRegex, value) {
  const input = customerInput(page, labelRegex);
  await input.waitFor({ state: 'attached' });
  await expect(input).toBeEnabled({ timeout: 10000 });
  await input.fill(value);
}

test('audit trail captures customer creation', async ({ page, request, context }) => {
  // Reset database and login
  await resetDbEmpty(request);
  await loginAsAdmin(page, context);

  // Get initial audit trail count
  const initialAuditCount = await getAuditTrailCount(page);

  // Navigate to customers and create a new customer
  await page.goto('/customers');
  await page.getByRole('link', { name: /New Customer|Nuevo Cliente/i }).click();

  // Fill in customer details
  await setCustomerInputValue(page, /First Name|Nombre/i, 'John');
  await setCustomerInputValue(page, /Last Name|Apellidos/i, 'AuditTest');
  await setCustomerInputValue(page, /Tax Identifier|Identificador Fiscal/i, 'AUDIT001');
  await setCustomerInputValue(page, /Address|Direcci.n/i, '123 Audit St');

  // Save customer
  await page.getByRole('button', { name: /Save|Guardar/i }).first().click();

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
});

test('audit trail captures customer updates', async ({ page, request, context }) => {
  await resetDbEmpty(request);
  await loginAsAdmin(page, context);

  // Create a customer first
  await page.goto('/customers');
  await page.getByRole('link', { name: /New Customer|Nuevo Cliente/i }).click();

  await setCustomerInputValue(page, /First Name|Nombre/i, 'Jane');
  await setCustomerInputValue(page, /Last Name|Apellidos/i, 'UpdateTest');
  await setCustomerInputValue(page, /Tax Identifier|Identificador Fiscal/i, 'UPDATE001');
  await setCustomerInputValue(page, /Address|Direcci.n/i, '456 Update St');

  await page.getByRole('button', { name: /Save|Guardar/i }).first().click();
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
  await page.getByRole('row').filter({ hasText: 'Jane' }).getByTitle(/Edit|Editar/i).click();

  // Wait for form to load
  await page.waitForTimeout(500);

  // Update some fields
  await setCustomerInputValue(page, /First Name|Nombre/i, 'Janet');

  // Save changes
  await page.getByRole('button', { name: /Save|Guardar/i }).first().click();
  await expect(page).toHaveURL(/\/customers$/);
  await page.waitForTimeout(1000);

  // Verify audit trail was created for the update
  const afterUpdateAuditCount = await getAuditTrailCount(page);
  expect(afterUpdateAuditCount).toBeGreaterThan(beforeUpdateAuditCount);
});

test('audit trail captures patient creation', async ({ page, request, context }) => {
  await resetDbEmpty(request);
  await loginAsAdmin(page, context);

  const initialAuditCount = await getAuditTrailCount(page);

  await page.goto('/patients');
  await page.getByRole('link', { name: /New Patient|Nuevo Paciente/i }).click();

  await page.getByLabel(/First Name|Nombre/i).fill('Alice');
  await page.getByLabel(/Last Name|Apellidos/i).fill('PatientAudit');
  await page.locator('#allergies').fill('None');

  // Save patient
  await page.getByTestId('save-patient-btn').click();

  // Wait for redirect
  await expect(page).toHaveURL(/\/patients$/);
  await page.waitForTimeout(1000);

  const finalAuditCount = await getAuditTrailCount(page);
  expect(finalAuditCount).toBeGreaterThan(initialAuditCount);
});