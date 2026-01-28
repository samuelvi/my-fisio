# Patient Management Module

Comprehensive system for managing clinic patients, their personal data, and clinical history.

## Overview

The Patient Management module is the core of the MyPhysio system. It allows administrative staff to register new patients, update their information, track their clinical history, and manage their active status.

## Key Capabilities

### 1. Patient Registry
- **CRUD Operations**: Create, Read, Update, and Deactivate (soft delete) patients.
- **Data Validation**: Strict server-side validation for mandatory fields (Name, Surname) and format checks (Email, Phone).
- **Status Management**: "Danger Zone" interface for deactivating patients, requiring explicit confirmation to prevent accidental data loss.

### 2. Intelligent Search
- **Fuzzy Search**: Finds patients even with partial or slightly misspelled names (e.g., "goms" matches "Gómez").
- **Accent Insensitivity**: Searching for "jose" finds "José".
- **Filters**: Filter by status (Active/Inactive) or sort alphabetically/chronologically.
- **N+1 Pagination**: Optimized pagination performance for large datasets.

### 3. Clinical History (Records)
- **Timeline View**: Chronological display of all clinical interactions.
- **Detailed Records**:
    - **Treatment**: Main physiotherapy treatment description.
    - **Diagnosis**: Reason for consultation, onset, and current situation.
    - **Medical Data**: Radiology tests, parallel medical treatments, and sick leave status.
- **Quick Access**: "Add First Record" shortcuts for new patients.

### 4. Data Safety
- **Draft System**: All forms (Create/Edit/Record) are protected by the [Draft Recovery System](draft-system.md). If the network fails or the browser crashes, data is saved locally and can be restored upon return.
- **Concurrency Protection**: Inputs are disabled during save operations to prevent double submissions.

## User Workflows

### Creating a Patient
1. Navigate to "Patients" -> "New Patient".
2. Fill in personal details (Name, DNI, Contact).
3. Fill in medical alerts (Allergies, Systemic Diseases).
4. Click "Save".
5. *Automatic redirection to Patient Detail view.*

### Managing Clinical Records
1. Open a Patient Detail view.
2. Scroll to "Clinical History".
3. Click "Add Item" (or "Add First Record").
4. Fill in the treatment details.
5. Click "Save".
6. *Record appears instantly in the timeline.*

## Technical Details

### Backend Structure
- **Entity**: `App\Domain\Entity\Patient`
- **Repository**: `App\Infrastructure\Persistence\Doctrine\Repository\DoctrinePatientRepository`
- **API Resource**: `App\Infrastructure\Api\Resource\PatientResource` (API Platform)

### Frontend Components
- **List**: `assets/components/PatientList.tsx`
- **Form**: `assets/components/PatientForm.tsx`
- **Detail**: `assets/components/PatientDetail.tsx`
- **History**: `assets/components/RecordTimeline.tsx`

### Database Schema
See [Database Schema](../architecture/database-schema.md) for full details on `patients` and `records` tables.
