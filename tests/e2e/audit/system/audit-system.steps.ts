import { expect } from '@playwright/test';
import { Given, When, Then } from '../../common/bdd';

let initialAuditCount = 0;

// =============================================================================
// API Helpers
// =============================================================================

async function apiFetch(page, url: string, options: any = {}) {
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

async function getAuditTrails(page, entityType: string | null = null) {
  let url = `/api/audit_trails?order[changedAt]=desc&_t=${new Date().getTime()}`;
  if (entityType) {
    url += `&entityType=${entityType}`;
  }
  return apiFetch(page, url);
}

async function getAuditTrailCount(page) {
  const response = await getAuditTrails(page);
  expect(response.status).toBe(200);
  
  if (response.data['hydra:totalItems'] !== undefined) {
    return response.data['hydra:totalItems'];
  }

  const members = response.data.member || response.data['hydra:member'] || [];
  return members.length;
}

// =============================================================================
// Audit Steps
// =============================================================================

Given('I note the current audit trail count', async ({ page }) => {
  initialAuditCount = await getAuditTrailCount(page);
});

Then('the audit trail count should have increased', async ({ page }) => {
  const count = await getAuditTrailCount(page);
  expect(count).toBeGreaterThan(initialAuditCount);
});

Then('the latest audit trail for {string} should have operation {string}', async ({ page }, entityType: string, operation: string) => {
  const auditResponse = await getAuditTrails(page, entityType);
  expect(auditResponse.status).toBe(200);

  const audits = auditResponse.data.member || auditResponse.data['hydra:member'] || [];
  expect(audits.length).toBeGreaterThan(0);

  const latestAudit = audits[0];
  expect(latestAudit.entityType).toBe(entityType);
  expect(latestAudit.operation).toBe(operation);
});
