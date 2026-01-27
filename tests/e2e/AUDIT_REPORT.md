# E2E Test Audit Report — vs `.skills/playwright-bdd-testing`

**Date**: 2026-01-27
**Audited files**: 44 (19 features + 25 step definitions)
**Status**: Initial audit. No code changes — tracking only.

---

## Summary

3 critical violations, 1 moderate, multiple minor. Core strengths in structure, feature readability, and tag usage. Main gaps: hard timeouts, CSS/ID selectors, and no factories.

---

## P0 — Eliminate `waitForTimeout()` (CRITICAL)

> Skill rule: "NEVER use explicit timeouts (waitForTimeout) — use conditions, retry, or polling"

### Instances to fix

| # | File | Line | Duration | Replacement strategy | Status |
|---|------|------|----------|----------------------|--------|
| 1 | `appointments/calendar/appointments.steps.ts` | 33 | 500ms | `await input.press('Enter')` already triggers change — remove wait or use `waitForLoadState` | Fixed |
| 2 | `appointments/calendar/appointments.steps.ts` | 41 | 500ms | Same as above | Fixed |
| 3 | `appointments/calendar/appointments.steps.ts` | 54 | 2000ms | Already has `toBeHidden` check on modal — remove wait, rely on assertion | Fixed |
| 4 | `appointments/network/appointments-network.steps.ts` | 61 | 2000ms | Already has `waitForResponse` — replace with `expect(event).toBeVisible()` | Fixed |
| 5 | `appointments/network/appointments-network.steps.ts` | 74 | 500ms | Replace with `await expect(dialog).toBeVisible()` (already next line) | Fixed |
| 6 | `common/steps/draft.steps.ts` | 9 | 6000ms | Use `spin()` polling for draft indicator or `expect.poll()` | Retained (Required for negative test of auto-save absence) |
| 7 | `customers/common/customers-common.steps.ts` | 120 | 500ms | Use `waitForResponse` on the last POST, or remove entirely | Fixed |
| 8 | `invoices/draft/invoice-draft.steps.ts` | 107 | 1000ms | Use `expect(element).toBeHidden()` or `waitFor({ state: 'hidden' })` | Fixed |

---

## P1 — Replace CSS/ID selectors with semantic selectors (CRITICAL)

> Skill rule: "ALWAYS use text-based selectors (getByRole, getByText, getByLabel). NEVER use CSS/ID selectors."

### ID selectors to replace

| # | File | Line(s) | Selector | Suggested replacement |
|---|------|---------|----------|-----------------------|
| 1 | `common/steps/draft.steps.ts` | 13, 17 | `#draft-alert` | `getByRole('alert')` or `getByTestId('draft-alert')` |
| 2 | `appointments/network/appointments-network.steps.ts` | 85, 94, 98, 110, 115 | `#status-alert` | `getByRole('alert')` or `getByTestId('status-alert')` |
| 3 | `invoices/invoices/invoices.steps.ts` | 11-14, 59-61 | `#invoice-customerName`, `#invoice-customerTaxId`, `#invoice-customerAddress` | `getByLabel('Customer Name')` / `getByLabel('Tax ID')` / `getByLabel('Address')` |
| 4 | `patients/common/patients-common.steps.ts` | 38, 50, 62 | `#allergies` | `getByLabel('Allergies\|Alergias')` |
| 5 | `patients/common/patients-common.steps.ts` | 22 | `#patient-form` | `getByRole('form')` or `locator('form')` with waitFor |
| 6 | `records/lifecycle/records.steps.ts` | 20 | `#record-form` | `getByRole('form')` or `locator('form')` with waitFor |

### CSS/attribute selectors to replace

| # | File | Line(s) | Selector | Suggested replacement |
|---|------|---------|----------|-----------------------|
| 7 | `common/steps/assertions.steps.ts` | 45, 53 | `tbody tr` | `getByRole('row')` (subtract header row in count) |
| 8 | `common/steps/assertions.steps.ts` | 49 | `tbody` | `getByRole('table')` or keep locator with role check |
| 9 | `appointments/calendar/appointments.steps.ts` | 53 | `.fixed.inset-0` (Tailwind) | `getByRole('dialog')` or `getByTestId('modal-overlay')` |
| 10 | `appointments/common/appointments-common.steps.ts` | 9 | `.fc` | FullCalendar — encapsulate in helper; acceptable if isolated |
| 11 | `appointments/common/appointments-common.steps.ts` | 25, 31, 44, 48 | `.fc-event` | Encapsulate in calendar helper; acceptable if isolated |
| 12 | `appointments/network/appointments-network.steps.ts` | 39, 52 | `form input[type="text"]` | `getByRole('textbox').first()` |
| 13 | `customers/common/customers-common.steps.ts` | 80, 86 | `input[type="text"]`, `button[type="submit"]` | `getByRole('textbox')`, `getByRole('button', { name: /Search/ })` |
| 14 | `invoices/search/invoices-search.steps.ts` | 47, 48 | `input[type="text"]`, `button[type="submit"]` | Same as above |
| 15 | `patients/common/patients-common.steps.ts` | 82, 83 | `input[name="firstName"]`, `input[name="lastName"]` | `getByLabel('First Name')`, `getByLabel('Last Name')` |
| 16 | `records/lifecycle/records.steps.ts` | 31, 32, 34, 37 | `textarea[name="..."]`, `input[name="..."]` | `getByLabel(...)` for each field |
| 17 | `common/steps/search.steps.ts` | 9 | `button:has-text("Limpiar"), button:has-text("Clear")` | `getByRole('button', { name: /Clear\|Limpiar/i })` |
| 18 | `common/steps/search.steps.ts` | 14 | `input[type="text"]` | `getByRole('textbox')` or `getByRole('searchbox')` |
| 19 | `security/protection/security-protection.steps.ts` | 24, 25 | `input[name="email"]`, `input[name="password"]` | `getByLabel('Email')`, `getByLabel('Password')` |
| 20 | `appointments/calendar/appointments.steps.ts` | 12, 23, 30 | `.locator('label').filter().locator('..').locator('input')` | `getByLabel(/Title\|Titulo/i)` directly |
| 21 | `customers/common/customers-common.steps.ts` | 23 | `.locator('form').locator('label').filter().locator('..').locator('input')` | `getByLabel(labelRegex)` directly |

### FullCalendar selectors (encapsulate, don't eliminate)

These are 3rd-party component internals. The skill allows CSS when encapsulated in custom steps:

| File | Selectors | Status |
|------|-----------|--------|
| `appointments/common/appointments-common.steps.ts` | `.fc`, `.fc-event` | Already in domain step file — acceptable |
| `appointments/calendar/appointments.steps.ts` | `.fc-event`, `.fc-timegrid-col` | Already in domain step file — acceptable |
| `appointments/network/appointments-network.steps.ts` | `.fc-event`, `.fc-timegrid-col` | Already in domain step file — acceptable |

**Action**: Extract shared FullCalendar selectors into a `calendar.helper.ts` module so they're defined once.

---

## P2 — Introduce factories with Faker (CRITICAL)

> Skill rule: "Use structured factories with Faker — never SQL dumps or hardcoded IDs"

### Current state

No `@faker-js/faker` or `fishery` installed. All test data is hardcoded inline.

### Files with hardcoded test data

| # | File | Line(s) | Data | Notes |
|---|------|---------|------|-------|
| 1 | `customers/common/customers-common.steps.ts` | 96-120 | 3 customer objects with names, tax IDs | Seed data for search tests |
| 2 | `invoices/search/invoices-search.steps.ts` | 13-37 | 2 invoice objects with names, amounts | Seed data for search tests |
| 3 | `patients/common/patients-common.steps.ts` | 42-59 | Patient data (DOB, phone, email, address) | Form fill data |
| 4 | `login/login.steps.ts` | 8-14 | Credentials: `tina@tinafisio.com`, `password` | Auth credentials |
| 5 | `common/auth.ts` | 12-13 | Same credentials as above | Login helper |
| 6 | `customers/draft/customer-draft.steps.ts` | 22-37 | `formId: 'test-123'`, `firstName: 'Reload Test'` | Draft test data |
| 7 | `invoices/draft/invoice-draft.steps.ts` | 22-50 | Same pattern with invoice data | Draft test data |
| 8 | `patients/draft/patient-draft.steps.ts` | 22-37 | Same pattern with patient data | Draft test data |
| 9 | `records/draft/record-draft.steps.ts` | 49, 64 | Hardcoded API IRI `/api/patients/` | Record draft data |
| 10 | `records/lifecycle/records.steps.ts` | 23-25 | `'Draft'`, `'Patient'`, `'None'` | Patient creation data |

### Suggested approach

1. Install: `npm install -D @faker-js/faker fishery`
2. Create `tests/e2e/factories/` directory
3. Create factories: `customerFactory.ts`, `patientFactory.ts`, `invoiceFactory.ts`
4. Centralize auth credentials in `tests/e2e/common/constants.ts`
5. Replace inline data with factory calls

---

## P3 — Reconcile skill documentation with CI reality (MODERATE)

### The contradiction

**Skill says** (SKILL.md:242, tags-and-workflow.md:247-249):
> "In CI mode: ALL scenarios reset (test independence)"
> "Tags @no-reset are IGNORED"
> "Every scenario is independent, no shared state"

**Code says** (bdd.ts — after our fix):
> `@no-reset` is respected in CI — otherwise 6 tests fail because they depend on data from the previous scenario.

### Root cause

The tests are designed as sequential journeys (create customer → duplicate check → update). This is **correct per the skill's own parallelism model** ("Scenarios within a feature are sequential — model user journeys naturally"). But the CI independence requirement contradicts this design.

### Options

| Option | Impact |
|--------|--------|
| **A: Update skill** to say `@no-reset` is always respected (CI and local) | Matches reality. Lose "every scenario independent in CI" guarantee. |
| **B: Rewrite tests** so every `@no-reset` scenario creates its own prerequisites | Matches skill. Slower, more repetitive setup. |
| **C: Hybrid** — respect `@no-reset` but reset once per feature (current behavior) | Pragmatic. Document as deliberate choice. |

**Recommendation**: Option A — update the skill. The current test design (sequential journeys with `@no-reset`) is the correct BDD approach. The CI independence rule was aspirational but conflicts with the sequential journey model.

Specific lines to update in the skill:
- `SKILL.md:242` — remove "In CI mode: ALL scenarios reset (test independence)"
- `SKILL.md:297` — remove "CI Independence" point
- `references/tags-and-workflow.md:60-61` — remove "In CI: ALL scenarios reset"
- `references/tags-and-workflow.md:244-261` — rewrite CI Mode section
- `references/best-practices.md:784-786` — remove CI independence checklist items

---

## What's already correct

| Practice | Skill requirement | Status |
|----------|-------------------|--------|
| Domain-centric folder organization | Required | Done |
| Features as business-readable specs | Required | Done |
| `@reset`/`@no-reset` tag usage | Required | Correct |
| Sequential scenarios model journeys | Required | Done |
| Login via API (not UI) | Recommended | Done |
| `waitForLoadState('networkidle')` | Recommended | Done |
| `waitForResponse()` for API waits | Recommended | Done |
| `Promise.all([waitForResponse, click])` | Recommended | Done |
| Atomic steps (one action per step) | Required | Mostly done |
| No cleanup after tests | Required | Done |
| Screenshots/video only on failure | Recommended | Done |
| Multilingual regex `/EN\|ES/i` | N/A (project-specific) | Done |
| `spin()` for API polling | Required (retry pattern) | Done (audit steps) |
| No SQL dumps | Required | Done (API-based seeding) |

---

## Tracking

- [x] **P0**: Eliminate 7/8 `waitForTimeout()` instances (1 retained for negative test)
- [ ] **P1**: Replace 21+ CSS/ID selectors with semantic alternatives
- [ ] **P1**: Extract FullCalendar selectors to `calendar.helper.ts`
- [ ] **P2**: Install `@faker-js/faker` + `fishery`
- [ ] **P2**: Create factories for customer, patient, invoice, record
- [ ] **P2**: Centralize auth credentials
- [ ] **P3**: Update skill documentation re: CI + `@no-reset`
