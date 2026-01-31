# Changelog & Updates
## Physiotherapy Clinic Management System

**Document Version:** 1.0
**Last Updated:** January 31, 2026
**Classification:** Internal - Technical
**Purpose:** Record of recent changes and updates to the system.

---

## 1. Recent Changes

### January 31, 2026 - Patient & Record Management Enhancements

**Type:** Feature Enhancement + UI/UX Improvement
**Scope:** Patient Detail View, Clinical Records, Translations
**Document Updated:** [02-PRODUCT-REQUIREMENTS.md](./02-PRODUCT-REQUIREMENTS.md), [06-DATA-MODEL.md](./06-DATA-MODEL.md)

**Summary:**
Implemented significant improvements to the Patient Detail view and Clinical Record management, focusing on data visibility, optionality of fields, and translation completeness.

**What Changed:**

#### 1. Patient Management
- **Optional Fields:** Made the "Allergies" field optional in the patient creation/edit form. Removed the asterisk (*) and updated validation logic.
- **E2E Tests:** Updated `patients-create.feature` to reflect that allergies are no longer mandatory.
- **Patient Detail View Reorganization:**
    - **Medical Alerts:** Moved inside the "Patient Information" card (top). Now *only* displays "Observations" (`notes`), highlighted in red.
    - **Conditional Rendering:** The "Medical Alerts" block is hidden if "Observations" are empty.
    - **History Details:** Moved "Allergies", "Systemic Diseases", and "Medication" to this section (standard styling). Added "Injuries" (`injuries`) field.
    - **Next Appointments:** Moved inside the "Patient Information" card (bottom).
    - **Desktop Grid Optimization:** Reorganized "Address", "DNI", and "Rate" to share a single row (Address first), saving vertical space.
    - **Mobile Ordering:** "History Details" (sidebar) now appears *before* "Clinical History" (timeline) on mobile devices using CSS order classes.

#### 2. Clinical Records
- **Form Improvements:**
    - Converted "Radiology Tests", "Medical Treatment", and "Confidential Notes" to **textarea** components for better input experience.
    - Made "Confidential Notes" full-width.
    - Added placeholder ("Notas privadas...") to "Confidential Notes".
- **Timeline Detail View:**
    - Added display of "Home Tasks / Treatment" (`homeTreatment`) in the record detail modal.
    - Fixed hardcoded English strings ("Reason", "Radiology") to use correct translation keys.

#### 3. Internationalization (i18n)
- **New Translations:** Added missing keys for:
    - `entry_details` ("Entry Details" / "Detalles de la Entrada")
    - `main_treatment` ("Main Treatment" / "Tratamiento Principal")
    - `sick_leave` ("Sick Leave" / "Baja Laboral")
    - `edit_entry` ("Edit Entry" / "Editar Entrada")
    - `medical_treatment` ("Medical Treatment" / "Tratamiento Médico")
- **Fixes:** Ensured all new UI elements use translation keys.

**Impact:**
- ✅ Improved UX: Better visibility of critical information (Observations).
- ✅ Optimized Layout: More compact desktop view, logical mobile flow.
- ✅ Data Completeness: All record fields now visible in detail view.
- ✅ Localization: Full Spanish support for new features.

**Files Modified:**
- `assets/components/PatientDetail.tsx`
- `assets/components/PatientForm.tsx`
- `assets/components/RecordForm.tsx`
- `assets/components/RecordTimeline.tsx`
- `translations/messages.en.yaml`
- `translations/messages.es.yaml`
- `tests/e2e/patients/create/patients-create.feature`
- `tests/e2e/patients/common/patients-common.steps.ts`

**Test Results:**
- ✅ E2E tests for patient creation passing (optional allergies).
- ✅ UI visualization verified (Medical alerts conditional rendering, Grid layout).
- ✅ Translation checks passed.

---
