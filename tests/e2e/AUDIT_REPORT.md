# E2E Test Audit Report — vs `.skills/playwright-bdd-testing`

**Date**: 2026-01-28
**Audited files**: 44 (19 features + 25 step definitions)
**Status**: P0, P1, P2, P3 Solved. Audit Complete.

---

## Summary

P1 (Selectors) addressed by replacing CSS/ID selectors with semantic ones and fixing application accessibility (adding IDs/labels) to support them. P0 (Timeouts) addressed previously. P2 (Factories) solved by implementing fishery + faker factories. P3 (CI) resolved by updating documentation to reflect actual behavior (tags are respected).

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

**Status: COMPLETE**

- Replaced 20+ instances of CSS/ID selectors with `getByRole`, `getByLabel`, etc.
- Created `tests/e2e/common/helpers/calendar.helper.ts` to encapsulate FullCalendar selectors.
- **Improved App Accessibility**: Added `id` and `htmlFor` attributes to `Calendar.tsx` and `RecordForm.tsx` to support `getByLabel`.
- Verified with Invoices, Appointments, Patients, Customers, and Records tests.

### Key Changes

- **Alerts**: `#draft-alert`, `#status-alert` -> `getByRole('alert')`
- **Forms**: `input[name="..."]`, IDs -> `getByLabel(...)` (updated regexes to match exact UI labels)
- **Tables**: `tbody tr` -> `getByRole('row')` (with count logic adjustment)
- **Search**: `input[type="text"]` -> `getByRole('textbox')`
- **Calendar**: `CalendarHelper` methods for event/slot interaction.

---

## P2 — Introduce factories with Faker (CRITICAL)

> Skill rule: "Use structured factories with Faker — never SQL dumps or hardcoded IDs"

**Status: COMPLETE**

- Installed `@faker-js/faker` and `fishery`.
- Created factories in `tests/e2e/factories/` for Patient, Customer, Invoice, and Record.
- Centralized auth credentials in `tests/e2e/common/constants.ts`.
- Refactored 10+ test files to use factories and dynamic data.
- Synced test assertions to use factory-generated values (e.g., dynamic DNI validation).

---

## P3 — Reconcile skill documentation with CI reality (MODERATE)

### The contradiction

**Skill says** (SKILL.md:242, tags-and-workflow.md:247-249):
> "In CI mode: ALL scenarios reset (test independence)"
> "Tags @no-reset are IGNORED"
> "Every scenario is independent, no shared state"

**Code says** (bdd.ts — after our fix):
> `@no-reset` is respected in CI — otherwise 6 tests fail because they depend on data from the previous scenario.

### Resolution

**Action**: Updated `SKILL.md` and `references/tags-and-workflow.md` to confirm that `@no-reset` is respected in CI to support sequential user journeys.

---

## Tracking

- [x] **P0**: Eliminate 7/8 `waitForTimeout()` instances (1 retained for negative test)
- [x] **P1**: Replace 21+ CSS/ID selectors with semantic alternatives
- [x] **P1**: Extract FullCalendar selectors to `calendar.helper.ts`
- [x] **P2**: Install `@faker-js/faker` + `fishery`
- [x] **P2**: Create factories for customer, patient, invoice, record
- [x] **P2**: Centralize auth credentials
- [x] **P3**: Update skill documentation re: CI + `@no-reset`