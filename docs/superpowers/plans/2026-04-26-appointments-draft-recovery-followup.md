# Appointments Draft Recovery Follow-up Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reuse existing draft-recovery logic in Appointments modal flow (create/edit) and clean dead/obsolete draft code paths, without implementing offline queue for drag/drop/resize.

**Architecture:** Keep current form-draft pattern (`useFormDraft`/`useDraft`) and apply it to appointment modal submit flow only. Do not add new infra for offline sync queue. Remove or align stale draft artifacts (unused interceptor, outdated tests/docs) to avoid regressions and confusion.

**Tech Stack:** React + TypeScript, Axios, localStorage draft persistence, existing FormDraftUI components.

---

## Scope and Constraints

### In Scope
- Draft save/restore/discard for appointment modal submit path (`saveAppointment`).
- Network-error-driven draft behavior only (no periodic autosave).
- Cleanup of obviously unused or stale draft-related code/tests/docs.

### Out of Scope (explicit)
- Drag/drop/resize offline queue and replay logic.
- Background sync workers.
- New backend endpoints.

---

## Current Findings (Root-Cause-Oriented)

- `Calendar` currently handles network error alerts but does not use draft hook:
  - `assets/components/Calendar.tsx`
- Draft system exists and works for forms:
  - `assets/presentation/hooks/useFormDraft.ts`
  - `assets/presentation/hooks/useDraft.ts`
  - `assets/components/shared/FormDraftUI.tsx`
- Draft domain/repository only supports: `invoice|patient|customer|record`:
  - `assets/domain/Draft.ts`
  - `assets/infrastructure/storage/LocalStorageDraftRepository.ts`
- Interceptor exists but appears unused:
  - `assets/presentation/api/interceptors/draftInterceptor.ts`
  - No registration found in app bootstrap (`assets/app.tsx`).
- Documentation mismatch: appointments doc claims draft on move/create failures, but code does not implement draft in calendar:
  - `docs/features/appointments.md`

---

## Phase 1: Align Design and Dead-Code Strategy (No Behavior Change)

**Objective:** Decide and document what is canonical in draft handling before coding.

**Files:**
- Modify: `docs/features/appointments.md`
- Modify: `docs/features/draft-system.md`
- (Optional decision record) Create: `docs/decisions/appointments-draft-behavior.md`

- [x] Confirm canonical pattern: draft save on submit + network error only (no autosave timer).
- [x] Confirm canonical trigger source: component-level `draft.saveOnNetworkError(...)` (not global interceptor).
- [x] Mark `draftInterceptor` as either:
  - (A) deprecated and scheduled for removal, or
  - (B) future integration candidate (not in this iteration).
- [x] Update docs to reflect actual behavior and explicit out-of-scope queue.

**Deliverable:** docs aligned with real behavior; no ambiguous offline queue claims.

---

## Phase 2: Add Appointment Draft Support in Existing Pattern

**Objective:** Reuse existing draft stack for calendar modal save path.

**Files:**
- Modify: `assets/domain/Draft.ts`
- Modify: `assets/infrastructure/storage/LocalStorageDraftRepository.ts`
- Modify: `assets/components/Calendar.tsx`
- Reuse: `assets/components/shared/FormDraftUI.tsx`

- [x] Extend `DraftType` to include `appointment`.
- [x] Add `draft_appointment` storage key.
- [x] Define appointment modal draft shape (title, notes, type, startsAt, endsAt, allDay, patientId).
- [x] Integrate `useFormDraft` in `Calendar.tsx` scoped to modal form context.
- [x] On submit path:
  - save draft before API call,
  - clear draft on success,
  - saveOnNetworkError on network failure.
- [x] Add restore/discard UI via `FormDraftUI` in calendar screen.
- [x] Ensure restore writes back to modal form state deterministically.

**Rules:**
- Do not affect drag/drop/resize handlers in this phase.
- Do not introduce autosave intervals.

---

## Phase 3: Remove/Isolate Unused Draft Artifacts

**Objective:** Reduce confusion and regression risk.

**Files:**
- Modify or delete (decision-driven): `assets/presentation/api/interceptors/draftInterceptor.ts`
- Modify tests impacted by removed artifacts:
  - `assets/tests/presentation/useDraft.test.tsx` (currently includes stale auto-save expectations)

- [x] If interceptor remains unused, remove it (or mark deprecated with clear rationale).
- [x] Update tests to current hook API (no `startAutoSave`/`stopAutoSave` expectations if not present).
- [x] Ensure test suite reflects actual draft architecture.

**Deliverable:** no dead paths contradicting runtime behavior.

---

## Phase 4: Verification and Regression Safety

**Objective:** Prove behavior and prevent future breakage.

**Files:**
- Add/modify focused tests:
  - `assets/tests/presentation/*` (hook + service/repository as needed)
  - E2E draft scenarios for appointments (new feature path)

- [x] Unit:
  - `appointment` draft type persisted/restored/cleared correctly.
  - network error path sets `savedByError = true`.
- [x] E2E:
  - create/edit appointment modal -> simulate network failure -> draft alert visible.
  - restore draft repopulates modal.
  - successful save clears draft.
- [ ] Manual smoke:
  - existing patient/customer/invoice/record drafts still work unchanged.
  - appointments render/load unaffected.

**Acceptance Criteria:**
- Appointment modal supports draft recovery exactly like other forms.
- No queue behavior introduced.
- Docs and tests match implementation.

---

## Risk Notes

- Main risk is coupling calendar modal state with draft restore lifecycle.
- Secondary risk is stale tests/docs causing false confidence.
- Mitigation: phase-by-phase merge with tight validation after each phase.

---

## Suggested Commit Sequence

1. `docs(draft): align appointments and draft-system behavior`
2. `feat(appointments): add modal draft recovery using existing form draft hooks`
3. `refactor(draft): remove/mark unused interceptor and align tests`
4. `test(appointments): add draft recovery regression coverage`

---

## Handoff Notes

- Start with docs + decision alignment first.
- Implement only modal submit/recovery flow in this iteration.
- Explicitly defer drag/drop/resize offline queue to separate plan.
