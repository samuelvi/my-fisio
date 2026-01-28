# Test Suite Expansion Plan

**Status:** Draft / Proposal
**Target:** Increase coverage from "MVP Functional" to "Enterprise Robust"
**Tools:** PHPUnit (Backend), Playwright (E2E/Visual)

---

## 1. Executive Summary

Current testing covers the "Happy Paths" (standard creation, listing, and basic editing) and basic resilience (offline drafts). This plan proposes expanding coverage to **edge cases, complex domain logic, security boundaries, and visual regressions** to ensure long-term maintainability.

---

## 2. Phase 1: Domain Logic Hardening (Backend)

**Objective:** Verify complex business rules in isolation (Unit Tests) rather than via expensive UI tests.

### 1.1 Invoice Number Generation
**Risk:** High. Duplicate or non-sequential invoices are a legal compliance issue.
*   **Current:** Basic integration test checks numbers are sequential.
*   **Proposed Unit Tests (`tests/Unit/Domain/Service/`):**
    *   **Race Conditions:** Simulate concurrent requests requesting a number.
    *   **Year Rollover:** Verify sequence resets correctly on Jan 1st.
    *   **Concurrency:** Mock locking mechanisms to ensure atomicity.

### 1.2 Appointment Conflict Algorithms
**Risk:** Medium. Double bookings annoy patients and staff.
*   **Current:** Basic check "cannot book same slot".
*   **Proposed Unit Tests:**
    *   **Partial Overlap:** New appt starts 5 mins before existing ends.
    *   **Encapsulation:** New appt completely covers an existing one.
    *   **Multi-Day:** Appointments spanning midnight (if supported).
    *   **Boundary:** Appt starts exactly at closing time.

---

## 3. Phase 2: Complex User Journeys (E2E)

**Objective:** Validate multi-step workflows that involve state changes across multiple entities.

### 2.1 The "Golden Path" (End-to-End Lifecycle)
**Scenario:** "From first call to final invoice".
1.  **Admin** creates Patient "Maria".
2.  **Admin** books Appointment for "Maria" next Tuesday.
3.  **Admin** adds Clinical Record to "Maria" after appointment.
4.  **Admin** generates Invoice pre-filled from "Maria's" data.
5.  **System** verifies the Invoice appears in "Maria's" file.
6.  **Admin** deactivates "Maria".
7.  **System** ensures "Maria" does not appear in active search but Invoice remains valid.

### 2.2 The "Correction Flow" (Undo/Redo)
**Scenario:** Human error correction.
1.  Create Invoice.
2.  Realize address is wrong.
3.  Edit Customer (source of truth).
4.  Regenerate/Update Invoice (verify snapshot data vs. live data behavior).
5.  Delete Appointment (cancellation).
6.  Verify calendar gap opens up.

---

## 4. Phase 3: Security & Boundaries

**Objective:** Ensure the system is secure against standard vulnerabilities and logic hacks.

### 3.1 Role-Based Access Control (RBAC)
*   **Scenario:** Create a "Staff" user (non-Admin) if applicable.
*   **Tests:**
    *   Staff tries to access `/audit-logs` -> 403 Forbidden.
    *   Staff tries to Delete an Invoice -> 403 Forbidden.
    *   Staff tries to access `GET /api/users` -> 403 Forbidden.

### 3.2 Input Sanitization & Limits
*   **XSS Injection:** Fill patient name with `<script>alert('hack')</script>`. Verify it renders as text, not code.
*   **SQL Injection:** Attempt `' OR '1'='1` in search bars.
*   **Data Limits:**
    *   Create a text record with 5,000 characters (verify truncation or handling).
    *   Enter a future date 50 years from now.
    *   Enter negative prices in Invoices.

---

## 5. Phase 4: Visual & UX Regression

**Objective:** Catch UI breaks (CSS issues, broken layouts) that functional tests miss.

### 5.1 Playwright Visual Comparisons
*   **Snapshot Testing:**
    *   Capture screenshot of "Invoice PDF Preview". Compare against "Golden Master".
    *   Capture "Calendar Weekly View" with complex overlapping events.
*   **Mobile Responsiveness:**
    *   Run critical flows (Book Appointment) in iPhone 14 viewport.
    *   Verify "hamburger menu" works.
    *   Verify tables scroll horizontally or stack cards.

### 5.2 Empty States & Loading
*   **Empty States:** Verify "No Invoices Found" screens look professional (not just text).
*   **Loading States:** Intercept network requests, delay them by 2s, verify "Skeleton Loader" or "Spinner" appears.

---

## 6. Implementation Roadmap

| Priority | Step | Effort | Value |
|:--------:|:-----|:------:|:------|
| **P1** | **1.1 & 1.2** (Backend Unit Tests) | Low | High (Compliance) |
| **P2** | **2.1** (Golden Path E2E) | Medium | High (Integrity) |
| **P3** | **3.2** (Input/Limits) | Low | Medium (Robustness) |
| **P4** | **5.1** (Visual Snapshots) | Medium | Medium (UX Safety) |

## 7. Next Immediate Actions

To start this plan, run:

```bash
# 1. Create directory for Backend Unit Tests
mkdir -p tests/Unit/Domain

# 2. Create the "Golden Path" feature file
touch tests/e2e/golden-path/full-cycle.feature
```
