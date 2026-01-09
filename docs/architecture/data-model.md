# Data Model & Database Schema
## Physiotherapy Clinic Management System

**Document Version:** 1.0
**Last Updated:** December 30, 2025
**Classification:** Internal - Technical
**Owner:** Database Architect & Engineering Team

---

## 1. Introduction

### 1.1 Purpose

This document provides a comprehensive specification of the database schema, entity relationships, data integrity constraints, migration strategy, and data governance policies for the Physiotherapy Clinic Management System.

### 1.2 Database Technology

**Database Management System:** MariaDB 11.0
**ORM Framework:** Doctrine ORM 3.3
**Migration Tool:** Doctrine Migrations
**Character Set:** UTF8MB4 (full Unicode support, including emojis)
**Collation:** utf8mb4_unicode_ci (case-insensitive, supports international characters)

### 1.3 Design Principles

1. **Normalization**: Schema follows Third Normal Form (3NF) to minimize redundancy
2. **Referential Integrity**: Foreign key constraints enforce data consistency
3. **Audit Trail**: Creation timestamps on all entities; update timestamps where applicable
4. **Denormalization**: Strategic denormalization (e.g., `full_name` in invoices) for performance
5. **Soft Deletes**: Not implemented; deletion is permanent (use status flags instead)
6. **Data Types**: Consistent use of appropriate types (TEXT for long content, VARCHAR for bounded strings)

---

## 2. Entity-Relationship Diagram (ERD)

### 2.1 High-Level Entity Relationships

```
┌──────────────┐
│   USERS      │
│              │
│ - id         │
│ - email      │
│ - password   │
│ - roles      │
└──────────────┘

┌──────────────┐         ┌──────────────────┐         ┌──────────────┐
│  CUSTOMERS   │◄────────│    PATIENTS      │────────►│  RECORDS     │
│              │  0..1   │                  │  1..n   │              │
│ - id         │         │ - id             │         │ - id         │
│ - first_name │         │ - first_name     │         │ - patient_id │
│ - last_name  │         │ - last_name      │         │ - created_at │
│ - tax_id     │         │ - full_name      │         │ - consult... │
│ - email      │         │ - date_of_birth  │         │ - treatment  │
│ - phone      │         │ - status         │         └──────────────┘
│ - address    │         │ - allergies      │
└──────┬───────┘         │ - medication     │
       │                 │ - ...            │
       │                 └────────┬─────────┘
       │                          │
       │                          │ 1..n
       │                          ▼
       │                 ┌──────────────────┐
       │                 │  APPOINTMENTS    │
       │                 │                  │
       │                 │ - id             │
       │                 │ - patient_id     │
       │                 │ - user_id        │
       │                 │ - title          │
       │                 │ - starts_at      │
       │                 │ - ends_at        │
       │                 │ - type           │
       │                 └──────────────────┘
       │
       │ 1..n
       ▼
┌──────────────────┐         ┌──────────────────┐
│    INVOICES      │────────►│  INVOICE_LINES   │
│                  │  1..n   │                  │
│ - id             │         │ - id             │
│ - number         │         │ - invoice_id     │
│ - date           │         │ - concept        │
│ - amount         │         │ - description    │
│ - full_name      │         │ - quantity       │
│ - tax_id         │         │ - price          │
│ - customer_id    │         │ - amount         │
└──────────────────┘         └──────────────────┘

┌──────────────┐
│  COUNTERS    │  (Sequential numbering state)
│              │
│ - id         │
│ - name       │
│ - value      │
└──────────────┘
```

---

## 3. Table Specifications

### 3.1 Users Table

**Purpose:** Authentication and user management

**Table Name:** `users`

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | INT | NO | AUTO_INCREMENT | PRIMARY KEY | Unique user identifier |
| `email` | VARCHAR(180) | NO | - | UNIQUE | User login email address |
| `roles` | JSON | NO | - | - | User roles (ROLE_USER, ROLE_ADMIN) |
| `password` | VARCHAR(255) | NO | - | - | Bcrypt hashed password |

**Indexes:**
- PRIMARY KEY: `id`
- UNIQUE INDEX: `email` (ensures no duplicate logins)

**Relationships:**
- None (isolated authentication entity)

**Business Rules:**
- Passwords hashed using bcrypt (cost 13 in production, cost 4 in tests)
- Email must be unique across all users
- Roles stored as JSON array (e.g., `["ROLE_USER"]`, `["ROLE_ADMIN"]`)

**Implementation Status:** ✅ Complete

**Example Data:**
```json
{
  "id": 1,
  "email": "tina@tinafisio.com",
  "roles": ["ROLE_ADMIN"],
  "password": "$2y$13$..."
}
```

---

### 3.2 Customers Table

**Purpose:** Billing entities (separate from patients for tax/invoicing purposes)

**Table Name:** `customers`

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | INT | NO | AUTO_INCREMENT | PRIMARY KEY | Unique customer identifier |
| `first_name` | VARCHAR(100) | NO | - | - | Customer first name |
| `last_name` | VARCHAR(100) | NO | - | - | Customer last name |
| `full_name` | VARCHAR(255) | YES | NULL | - | Computed: `first_name + ' ' + last_name` |
| `tax_id` | VARCHAR(20) | NO | - | - | Tax identification number (NIF/CIF) |
| `email` | VARCHAR(180) | YES | NULL | - | Contact email |
| `phone` | VARCHAR(50) | YES | NULL | - | Contact phone number |
| `billing_address` | LONGTEXT | YES | NULL | - | Full billing address |
| `created_at` | DATETIME | NO | - | - | Record creation timestamp |
| `updated_at` | DATETIME | YES | NULL | - | Last update timestamp |

**Indexes:**
- PRIMARY KEY: `id`
- No additional indexes (small table, infrequent queries)

**Relationships:**
- Has Many: `patients` (1 customer can be billing entity for multiple patients)
- Has Many: `invoices` (1 customer can have multiple invoices)

**Business Rules:**
- `full_name` is derived field, updated manually in Application layer
- One customer can represent a family or insurance company
- Tax ID required for invoice compliance

**Implementation Status:** ✅ Complete

**Migration Strategy:**
- Patients can be migrated to have associated customer records
- Customer data auto-populated from patient data if missing

---

### 3.3 Patients Table

**Purpose:** Patient registry and medical history

**Table Name:** `patients`

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | INT | NO | AUTO_INCREMENT | PRIMARY KEY | Unique patient identifier |
| `full_name` | VARCHAR(150) | NO | - | - | Computed: `first_name + ' ' + last_name` |
| `first_name` | VARCHAR(50) | NO | - | - | Patient first name |
| `last_name` | VARCHAR(100) | NO | - | - | Patient last name |
| `date_of_birth` | DATE | YES | NULL | - | Patient date of birth |
| `tax_id` | VARCHAR(15) | YES | NULL | - | Tax identification (optional) |
| `phone` | VARCHAR(50) | YES | NULL | - | Contact phone |
| `email` | VARCHAR(100) | YES | NULL | - | Contact email |
| `address` | VARCHAR(250) | YES | NULL | - | Home address |
| `profession` | VARCHAR(250) | YES | NULL | - | Occupation |
| `sports_activity` | VARCHAR(250) | YES | NULL | - | Sports/physical activities |
| `notes` | VARCHAR(250) | YES | NULL | - | General notes |
| `rate` | VARCHAR(250) | YES | NULL | - | Pricing tier/rate |
| `allergies` | VARCHAR(250) | YES | NULL | - | Known allergies |
| `medication` | VARCHAR(250) | YES | NULL | - | Current medications |
| `systemic_diseases` | VARCHAR(250) | YES | NULL | - | Chronic conditions |
| `surgeries` | VARCHAR(250) | YES | NULL | - | Past surgical history |
| `accidents` | VARCHAR(250) | YES | NULL | - | Past accidents |
| `injuries` | VARCHAR(250) | YES | NULL | - | Past injuries |
| `bruxism` | VARCHAR(250) | YES | NULL | - | Teeth grinding notes |
| `insoles` | VARCHAR(250) | YES | NULL | - | Orthotic insoles notes |
| `others` | VARCHAR(250) | YES | NULL | - | Other medical notes |
| `status` | VARCHAR(20) | NO | 'active' | - | Patient status (active/inactive) |
| `created_at` | DATE | NO | - | - | Record creation date |
| `customer_id` | INT | YES | NULL | FOREIGN KEY | Linked billing customer |

**Indexes:**
- PRIMARY KEY: `id`
- INDEX: `full_name` (for search optimization)
- INDEX: `status` (for filtering active/inactive)
- FOREIGN KEY: `customer_id` → `customers(id)`

**Relationships:**
- Belongs To: `customer` (optional, 0..1 relationship)
- Has Many: `appointments` (1 patient can have many appointments)
- Has Many: `records` (1 patient can have many clinical records)

**Business Rules:**
- `first_name` and `last_name` are mandatory
- `full_name` is derived field, updated manually in Application layer
- Status defaults to `active`; set to `inactive` to archive patient
- Medical history fields support free-text entry (no rigid templates)

**Implementation Status:** ✅ Complete

**Data Validation:**
- Backend: Symfony Validator constraints (`#[Assert\NotBlank]` on required fields)
- Frontend: Basic validation with visual error feedback

**Search Strategy:**
- Accent-insensitive search using MariaDB `UNACCENT` custom function
- Fuzzy search support via partial matching
- Supports searching by full name, phone, email

---

### 3.4 Appointments Table

**Purpose:** Calendar scheduling and appointment management

**Table Name:** `appointments`

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | INT | NO | AUTO_INCREMENT | PRIMARY KEY | Unique appointment identifier |
| `user_id` | INT | NO | - | - | Practitioner/user ID (not FK) |
| `patient_id` | INT | YES | NULL | FOREIGN KEY | Associated patient |
| `title` | VARCHAR(255) | YES | NULL | - | Appointment title (empty = gap) |
| `all_day` | TINYINT | YES | NULL | - | All-day event flag |
| `starts_at` | DATETIME | NO | - | - | Appointment start time |
| `ends_at` | DATETIME | NO | - | - | Appointment end time |
| `type` | VARCHAR(255) | YES | NULL | - | Type: 'appointment' or 'other' |
| `notes` | LONGTEXT | YES | NULL | - | Internal notes |
| `created_at` | DATETIME | NO | - | - | Record creation timestamp |
| `updated_at` | DATETIME | YES | NULL | - | Last update timestamp |

**Indexes:**
- PRIMARY KEY: `id`
- INDEX: `starts_at`, `ends_at` (for date range queries)
- INDEX: `patient_id` (for filtering by patient)
- FOREIGN KEY: `patient_id` → `patients(id)`

**Relationships:**
- Belongs To: `patient` (optional, 0..1 relationship)
- Note: `user_id` is not a foreign key (simplifies multi-user scenarios)

**Business Rules:**
- Empty `title` indicates an available time slot ("gap")
- `starts_at` must be before `ends_at`
- Maximum duration: 10 hours (enforced at Application layer)
- Conflict detection: no overlapping appointments for same user
- Color coding:
  - Yellow: Gaps (empty title)
  - Brown: Regular appointments (non-empty title)
  - Olive green: "Other" type events

**Implementation Status:** ✅ Complete

**Gap Management:**
- Gaps generated based on `CALENDAR_SLOTS_*` environment variables
- Gap generation/deletion operations available via UI
- Gaps serve as visual availability indicators

---

### 3.5 Records Table

**Purpose:** Clinical consultation history and treatment documentation

**Table Name:** `records`

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | INT | NO | AUTO_INCREMENT | PRIMARY KEY | Unique record identifier |
| `patient_id` | INT | YES | NULL | FOREIGN KEY | Associated patient |
| `created_at` | DATE | NO | - | - | Consultation date |
| `consultation_reason` | LONGTEXT | YES | NULL | - | Reason for visit |
| `onset` | LONGTEXT | YES | NULL | - | When symptoms started |
| `radiology_tests` | LONGTEXT | YES | NULL | - | X-ray, MRI, etc. results |
| `evolution` | LONGTEXT | YES | NULL | - | Progress since last visit |
| `current_situation` | LONGTEXT | YES | NULL | - | Current patient condition |
| `sick_leave` | TINYINT | YES | NULL | - | Sick leave status (boolean) |
| `physiotherapy_treatment` | LONGTEXT | NO | - | - | Treatment performed (required) |
| `medical_treatment` | LONGTEXT | YES | NULL | - | Medications prescribed |
| `home_treatment` | LONGTEXT | YES | NULL | - | Home exercise plan |
| `notes` | LONGTEXT | YES | NULL | - | Internal practitioner notes |

**Indexes:**
- PRIMARY KEY: `id`
- INDEX: `patient_id` (for patient record timeline)
- INDEX: `created_at` (for chronological sorting)
- FOREIGN KEY: `patient_id` → `patients(id)`

**Relationships:**
- Belongs To: `patient` (1 record belongs to 1 patient)

**Business Rules:**
- `physiotherapy_treatment` is mandatory (core clinical data)
- All other fields optional (supports flexible documentation)
- Records are immutable (no edit functionality by design for audit compliance)
- Alternative to editing: Create new record with "Correction to record #XXX" note

**Implementation Status:** ✅ Complete

**Audit Considerations:**
- ⚠️ No `updated_at` field (immutability by design)
- ⚠️ No soft deletes (permanent record retention)
- Future enhancement: Add digital signature field for legal compliance

---

### 3.6 Invoices Table

**Purpose:** Billing and invoice generation

**Table Name:** `invoices`

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | INT | NO | AUTO_INCREMENT | PRIMARY KEY | Unique invoice identifier |
| `number` | VARCHAR(20) | NO | - | UNIQUE | Sequential invoice number (YYYY000001) |
| `date` | DATETIME | NO | - | - | Invoice date |
| `amount` | DOUBLE | NO | - | - | Total invoice amount |
| `full_name` | VARCHAR(255) | NO | - | - | Customer full name (denormalized) |
| `tax_id` | VARCHAR(15) | YES | NULL | - | Customer tax ID (denormalized) |
| `phone` | VARCHAR(50) | YES | NULL | - | Customer phone (denormalized) |
| `email` | VARCHAR(100) | YES | NULL | - | Customer email (denormalized) |
| `address` | VARCHAR(250) | YES | NULL | - | Customer address (denormalized) |
| `customer_id` | INT | YES | NULL | FOREIGN KEY | Reference to customer entity |
| `created_at` | DATE | NO | - | - | Invoice creation date |

**Indexes:**
- PRIMARY KEY: `id`
- UNIQUE INDEX: `number` (ensures no duplicate invoice numbers)
- INDEX: `date` (for date range filtering)
- INDEX: `customer_id` (for customer invoice history)
- FOREIGN KEY: `customer_id` → `customers(id)`

**Relationships:**
- Belongs To: `customer` (optional, 0..1 relationship)
- Has Many: `invoice_lines` (1 invoice has many line items, cascade delete)

**Business Rules:**
- Invoice number format: `YYYY000001` (year + 6-digit sequential counter)
- Counter resets annually (new year = counter starts at 1)
- Customer data denormalized (snapshot at invoice creation time)
- Sequential numbering enforced by `Counters` table + database unique constraint
- Invoice editing controlled by feature flag (`VITE_INVOICE_EDIT_ENABLED`)

**Implementation Status:** ✅ Complete

**Invoice Number Management:**
- Sequence managed via `counters` table (row: `invoice_number_YYYY`)
- Gap detection endpoint: `GET /api/invoices/number-gaps`
- Duplicate prevention: Database unique constraint + Application layer validation

**Denormalization Rationale:**
- Customer details may change over time
- Invoice must reflect customer info at time of creation (historical accuracy)
- Supports regulatory compliance (invoices must be immutable snapshots)

---

### 3.7 Invoice Lines Table

**Purpose:** Line items for invoices (services, products)

**Table Name:** `invoice_lines`

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | INT | NO | AUTO_INCREMENT | PRIMARY KEY | Unique line item identifier |
| `invoice_id` | INT | NO | - | FOREIGN KEY | Parent invoice |
| `concept` | VARCHAR(255) | YES | NULL | - | Line item name/concept |
| `description` | LONGTEXT | YES | NULL | - | Detailed description |
| `quantity` | INT | NO | - | - | Quantity of units |
| `price` | DOUBLE | NO | - | - | Unit price |
| `amount` | DOUBLE | NO | - | - | Line total (quantity × price) |

**Indexes:**
- PRIMARY KEY: `id`
- INDEX: `invoice_id` (for line item loading)
- FOREIGN KEY: `invoice_id` → `invoices(id)` ON DELETE CASCADE

**Relationships:**
- Belongs To: `invoice` (1 line belongs to 1 invoice)

**Business Rules:**
- `amount` is computed field (quantity × price), calculated in Application layer
- Cascade delete: Deleting invoice deletes all line items
- No minimum/maximum line count enforced

**Implementation Status:** ✅ Complete

**Data Validation:**
- `quantity` must be positive integer
- `price` can be negative (discounts), zero, or positive
- `amount` auto-calculated, not user-editable

---

### 3.8 Counters Table

**Purpose:** Sequential numbering state management (invoice numbers)

**Table Name:** `counters`

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | INT | NO | AUTO_INCREMENT | PRIMARY KEY | Unique counter identifier |
| `name` | VARCHAR(50) | NO | - | UNIQUE | Counter name (e.g., 'invoice_number_2025') |
| `value` | LONGTEXT | NO | - | - | Current counter value (JSON) |

**Indexes:**
- PRIMARY KEY: `id`
- UNIQUE INDEX: `name` (ensures one counter per name)

**Relationships:**
- None (standalone state table)

**Business Rules:**
- One row per counter type (e.g., one row for `invoice_number_2025`)
- `value` stored as JSON (supports complex state if needed)
- Invoice counter incremented atomically via database transaction

**Implementation Status:** ✅ Complete

**Example Data:**
```json
{
  "name": "invoice_number_2025",
  "value": "{\"lastNumber\": 42}"
}
```

**Concurrency Handling:**
- Atomic increment via `SELECT FOR UPDATE` or optimistic locking
- Prevents duplicate invoice numbers in multi-user scenarios

---

## 4. Data Integrity & Constraints

### 4.1 Primary Keys

All tables use auto-incrementing integer primary keys (`id` column) for simplicity and performance.

**Rationale:**
- ✅ Simple, predictable
- ✅ Excellent index performance
- ✅ Easy foreign key relationships
- ⚠️ Not globally unique (requires table context)

**Alternative Considered:** UUIDs (rejected due to index performance and storage overhead)

---

### 4.2 Foreign Key Constraints

| Parent Table | Child Table | Foreign Key Column | On Delete | On Update |
|--------------|-------------|-------------------|-----------|-----------|
| `customers` | `patients` | `customer_id` | SET NULL | CASCADE |
| `customers` | `invoices` | `customer_id` | SET NULL | CASCADE |
| `patients` | `appointments` | `patient_id` | SET NULL | CASCADE |
| `patients` | `records` | `patient_id` | SET NULL | CASCADE |
| `invoices` | `invoice_lines` | `invoice_id` | CASCADE | CASCADE |

**Referential Integrity Policy:**
- ✅ All relationships enforced at database level
- ✅ Cascade deletes where appropriate (invoice lines)
- ✅ SET NULL for soft dependencies (patient appointments)

---

### 4.3 Unique Constraints

| Table | Column(s) | Purpose |
|-------|-----------|---------|
| `users` | `email` | Prevent duplicate logins |
| `invoices` | `number` | Prevent duplicate invoice numbers |
| `counters` | `name` | One counter per name |

---

### 4.4 Check Constraints

⚠️ **NOT IMPLEMENTED** (MariaDB supports CHECK constraints, but not currently used)

**Future Enhancements:**
```sql
-- Ensure appointment end time is after start time
ALTER TABLE appointments ADD CONSTRAINT chk_appointment_times
  CHECK (ends_at > starts_at);

-- Ensure invoice amount matches sum of line amounts
-- (Complex, may require triggers)
```

---

### 4.5 Nullability Policy

**Guidelines:**
1. **Required Fields:** `NOT NULL` (e.g., `first_name`, `last_name`, `email` in users)
2. **Optional Fields:** `NULL` allowed (e.g., `date_of_birth`, `phone`, `notes`)
3. **Default Values:** Use `DEFAULT` for status flags (e.g., `status DEFAULT 'active'`)
4. **Empty Strings:** Prefer `NULL` over empty strings for missing data (except where UI requires)

**Current Deviations:**
- Some VARCHAR fields allow NULL but could use empty strings (e.g., `phone`)
- Inconsistent between tables (future cleanup opportunity)

---

## 5. Indexing Strategy

### 5.1 Existing Indexes

| Table | Index Type | Column(s) | Purpose | Status |
|-------|-----------|-----------|---------|--------|
| `patients` | BTREE | `full_name` | Fast name search | ✅ Implemented |
| `patients` | BTREE | `status` | Filter active/inactive | ✅ Implemented |
| `appointments` | BTREE | `starts_at` | Date range queries | ✅ Implemented |
| `appointments` | BTREE | `ends_at` | Date range queries | ✅ Implemented |
| `invoices` | UNIQUE | `number` | Ensure uniqueness | ✅ Implemented |
| `invoices` | BTREE | `date` | Date filtering | ✅ Implemented |

### 5.2 Performance Monitoring

**Current Status:** ⚠️ No slow query log analysis or query profiling

**Recommendation:**
- Enable slow query log in production
- Set `long_query_time = 1` (log queries > 1 second)
- Analyze with `pt-query-digest` (Percona Toolkit)

### 5.3 Future Index Candidates

**If Performance Issues Arise:**
```sql
-- Composite index for appointment filtering by user + date
CREATE INDEX idx_appointments_user_starts ON appointments(user_id, starts_at);

-- Full-text search for patient notes (if needed)
CREATE FULLTEXT INDEX idx_patients_notes ON patients(notes);

-- Invoice search by customer name
CREATE INDEX idx_invoices_full_name ON invoices(full_name);
```

---

## 6. Migration Strategy

### 6.1 Migration Management

**Tool:** Doctrine Migrations
**Migration Directory:** `src/Infrastructure/Persistence/Doctrine/Migrations/`
**Current Migration:** `Version20251230103734.php` (baseline schema)

**Migration Lifecycle:**
```bash
# Generate new migration (based on entity changes)
php bin/console make:migration

# Review generated SQL (ALWAYS review before applying)
cat src/Infrastructure/Persistence/Doctrine/Migrations/VersionXXXXXXXXXXXXXX.php

# Apply migrations (development)
php bin/console doctrine:migrations:migrate --no-interaction

# Rollback (if needed)
php bin/console doctrine:migrations:migrate prev

# Migration status
php bin/console doctrine:migrations:status
```

### 6.2 Migration Best Practices

**Pre-Production Checklist:**
1. ✅ Test migration on development database
2. ✅ Test rollback (`down()` method)
3. ✅ Backup production database
4. ✅ Review generated SQL for destructive operations
5. ✅ Plan for zero-downtime (if applicable)

**Zero-Downtime Migrations:**
- Add new columns as nullable, populate, then make NOT NULL
- Add indexes concurrently (MariaDB `ALGORITHM=INPLACE`)
- Avoid renaming columns (add new, migrate data, drop old)

### 6.3 Baseline Migration

**File:** `Version20251230103734.php`

**Creates:**
- All 8 tables (users, customers, patients, appointments, records, invoices, invoice_lines, counters)
- All foreign key constraints
- Primary key indexes

**Status:** ✅ Applied in development/test/production

---

## 7. Data Seeding & Fixtures

### 7.1 Fixtures

**Tool:** Doctrine Data Fixtures
**Fixture Directory:** `src/DataFixtures/`

**Existing Fixtures:**
- `UserFixtures.php`: Creates default admin user (`tina@tinafisio.com` / `password`)

**Load Fixtures (Development/Test Only):**
```bash
php bin/console doctrine:fixtures:load --no-interaction
```

**Warning:** ⚠️ Fixtures purge all data before loading (destructive operation)

### 7.2 Test Data Strategy

**E2E Tests:**
- Use `/api/test/reset-db-empty` endpoint to reset database
- Tests create their own data as needed
- Isolated test environment (separate database: `physiotherapy_db_test`)

**Development:**
- Fixtures provide baseline data (admin user)
- Developers create additional test patients/appointments manually

---

## 8. Data Governance & Compliance

### 8.1 GDPR Compliance

**Personal Data Fields:**

| Table | Column | Data Type | Retention Policy |
|-------|--------|-----------|------------------|
| `patients` | `first_name`, `last_name` | PII | Retained while patient active |
| `patients` | `email`, `phone`, `address` | PII | Retained while patient active |
| `patients` | `date_of_birth` | PII (sensitive) | Retained while patient active |
| `patients` | Medical history fields | Special category PII | Retained while patient active |
| `records` | All fields | Medical data (special category) | Permanent retention (legal requirement) |
| `invoices` | `full_name`, `tax_id`, `email`, `phone`, `address` | PII | Permanent retention (tax law requirement) |

**Data Subject Rights:**
1. **Right to Access:** Patient can request copy of all data via clinic
2. **Right to Rectification:** Patient can request corrections (update operations)
3. **Right to Erasure ("Right to be Forgotten"):**
   - ⚠️ **Limitation:** Medical records and invoices MUST be retained by law (Spain: 5-15 years)
   - Patient data can be pseudonymized (replace name with "DELETED PATIENT #123")
4. **Right to Data Portability:** Export patient data as JSON or PDF
5. **Right to Object:** Patient can object to processing (requires legal review)

**Current Implementation Status:**
- ✅ Data access: Possible via admin interface
- ⚠️ Data export: Not implemented (requires CSV/JSON export feature)
- ⚠️ Data erasure: Not implemented (requires pseudonymization strategy)
- ⚠️ Consent tracking: Not implemented (requires consent log)

### 8.2 Audit Trail

**Current Status:** ⚠️ Partial

**What's Logged:**
- `created_at`: All entities (when record was created)
- `updated_at`: Some entities (patients, customers, appointments)

**What's NOT Logged:**
- Who created/updated the record (no `created_by`, `updated_by` fields)
- What changed (no field-level change tracking)
- Delete operations (no soft deletes or delete log)

**Future Enhancement (v1.2):**
```sql
-- Audit log table
CREATE TABLE audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INT NOT NULL,
  action VARCHAR(20) NOT NULL,  -- CREATE, UPDATE, DELETE
  user_id INT NOT NULL,
  changes JSON,  -- {field: {old: value, new: value}}
  created_at DATETIME NOT NULL
);
```

### 8.3 Data Retention Policy

**Legal Requirements (Spain):**
- **Medical Records:** 15 years minimum (varies by autonomous community)
- **Invoices:** 6 years (tax law)
- **Patient Personal Data:** Duration of care relationship + legal retention period

**Current Policy:**
- ✅ No automatic deletion (manual archival only)
- ⚠️ No archival strategy implemented
- ⚠️ No backup retention policy documented

**Recommendation:**
- Implement patient status-based archival (inactive > 2 years → archive)
- Automated backup retention: 30 days daily, 12 months monthly, 7 years annual

---

## 9. Performance Optimization

### 9.1 Query Optimization Patterns

**N+1 Fetch Pattern (Pagination):**
```php
// Fetch N+1 records instead of COUNT(*)
$qb = $this->createQueryBuilder('p')
    ->setMaxResults($limit + 1);
$results = $qb->getQuery()->getArrayResult();

$hasMore = count($results) > $limit;
$data = array_slice($results, 0, $limit);
```

**Rationale:** Avoids expensive `COUNT(*)` queries on large tables

**Bypass UnitOfWork Cache:**
```php
// Fresh data on every query
$results = $qb->getQuery()->getArrayResult();
$entities = array_map(fn($row) => Patient::fromArray($row), $results);
```

**Rationale:** Prevents stale data from Doctrine Identity Map

### 9.2 Denormalization Decisions

**Denormalized Fields:**

| Table | Field | Source | Rationale |
|-------|-------|--------|-----------|
| `patients` | `full_name` | `first_name + ' ' + last_name` | Fast search without JOIN |
| `invoices` | Customer fields | `customers` table | Historical snapshot |

**Update Strategy:**
- Manual update in Application layer (no database triggers)
- Updated on every write operation (create/update)

### 9.3 Database Configuration Tuning

**MariaDB Configuration (Production):**
```ini
[mysqld]
innodb_buffer_pool_size = 2G  # 70% of available RAM
innodb_log_file_size = 512M
innodb_flush_log_at_trx_commit = 2  # Balance durability vs performance
max_connections = 200
query_cache_size = 0  # Disabled (deprecated in MariaDB 10.1+)
```

**Current Status:** ⚠️ Default Docker configuration (not optimized)

---

## 10. Backup & Recovery

### 10.1 Backup Strategy

**Current Status:** ⚠️ NOT IMPLEMENTED

**Required for Production:**

| Backup Type | Frequency | Retention | Tool |
|-------------|-----------|-----------|------|
| Full Backup | Daily (2am) | 30 days | `mysqldump` or managed service |
| Incremental Backup | Every 6 hours | 7 days | Binary log replay |
| Offsite Backup | Daily | 30 days | S3, Cloud Storage |

**Backup Script Example:**
```bash
#!/bin/bash
BACKUP_DIR="/backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u root -p physiotherapy_db | gzip > $BACKUP_DIR/physiotherapy_db_$DATE.sql.gz

# Upload to S3
aws s3 cp $BACKUP_DIR/physiotherapy_db_$DATE.sql.gz s3://your-bucket/backups/
```

### 10.2 Recovery Procedures

**Disaster Recovery Steps:**
1. Stop application (prevent new writes)
2. Restore database from backup:
   ```bash
   gunzip < physiotherapy_db_20251230.sql.gz | mysql -u root -p physiotherapy_db
   ```
3. Verify data integrity:
   ```sql
   SELECT COUNT(*) FROM patients;
   SELECT COUNT(*) FROM invoices;
   ```
4. Start application
5. Validate critical workflows (login, patient search, invoice generation)

**Recovery Point Objective (RPO):** 24 hours (acceptable data loss: 1 day)
**Recovery Time Objective (RTO):** 4 hours (time to restore service)

**Current Status:** ⚠️ Undefined (no documented procedures or tested restores)

---

## 11. Security Considerations

### 11.1 SQL Injection Prevention

**Strategy:** Parameterized queries via Doctrine QueryBuilder

**Example (Secure):**
```php
$qb = $this->createQueryBuilder('p')
    ->where('p.fullName LIKE :search')
    ->setParameter('search', '%' . $search . '%');
```

**Anti-Pattern (Vulnerable):**
```php
// NEVER do this
$sql = "SELECT * FROM patients WHERE full_name LIKE '%{$search}%'";
```

**Status:** ✅ All queries use QueryBuilder or DQL (no raw SQL with user input)

### 11.2 Database Credentials

**Storage:** Environment variables (`.env`, `.env.local`)
**Access Control:**
- Development: Shared credentials (acceptable for local development)
- Production: Unique credentials per environment, rotated quarterly

**Current Configuration:**
```bash
DATABASE_URL="mysql://physiotherapy_user:physiotherapy_pass@mariadb:3306/physiotherapy_db"
```

**Production Requirements:**
- ✅ Strong password (min 16 characters, alphanumeric + symbols)
- ✅ Database user with minimal privileges (no `DROP`, `ALTER` in production)
- ✅ Credentials stored in secrets manager (AWS Secrets Manager, Vault)

### 11.3 Encryption

**Data at Rest:**
- ⚠️ Database encryption: Not configured (MariaDB supports InnoDB encryption)
- ⚠️ Backup encryption: Not configured

**Data in Transit:**
- ✅ Application ↔ Database: Internal Docker network (encrypted in production with TLS)
- ⚠️ Database TLS: Not configured (require SSL connection in production)

**Production Requirement:**
```bash
DATABASE_URL="mysql://user:pass@host:3306/db?ssl_mode=REQUIRED"
```

---

## 12. Known Limitations & Technical Debt

### 12.1 Current Limitations

| Issue | Impact | Mitigation Strategy |
|-------|--------|---------------------|
| **No soft deletes** | Deleted data permanently lost | Implement status flags (e.g., `archived`) |
| **No audit trail (user tracking)** | Can't track who changed what | Add `created_by`, `updated_by` fields |
| **No field-level change history** | Can't see what changed | Implement audit log table |
| **No database encryption** | Data readable if database compromised | Enable InnoDB encryption |
| **No backup automation** | Manual backups error-prone | Automate via cron or managed service |
| **Invoice editing ambiguity** | Unclear if invoices should be editable | Finalize policy (recommend: immutable after 24h) |

### 12.2 Schema Evolution Roadmap

**v1.1 (Q2 2026):**
- Add `created_by`, `updated_by` to all tables
- Add `audit_log` table
- Add `archived_at` timestamp to patients/appointments

**v1.2 (Q3 2026):**
- Add `consent_log` table (GDPR consent tracking)
- Add `document_attachments` table (file uploads)
- Partition `appointments` table by year (if >1M rows)

**v2.0 (Q1 2027):**
- Multi-tenancy support (add `tenant_id` to all tables)
- Encryption at rest enabled
- Read replicas configured

---

## 13. Appendices

### 13.1 Full Schema DDL

**Generated via:**
```bash
php bin/console doctrine:schema:create --dump-sql
```

**Output:** See migration file `Version20251230103734.php` (lines 20-35)

### 13.2 Entity Class Mapping

| Database Table | Doctrine Entity | Namespace |
|----------------|-----------------|-----------|
| `users` | `User` | `App\Domain\Entity\User` |
| `customers` | `Customer` | `App\Domain\Entity\Customer` |
| `patients` | `Patient` | `App\Domain\Entity\Patient` |
| `appointments` | `Appointment` | `App\Domain\Entity\Appointment` |
| `records` | `Record` | `App\Domain\Entity\Record` |
| `invoices` | `Invoice` | `App\Domain\Entity\Invoice` |
| `invoice_lines` | `InvoiceLine` | `App\Domain\Entity\InvoiceLine` |
| `counters` | `Counter` | `App\Domain\Entity\Counter` |

### 13.3 Repository Interfaces

| Entity | Repository Interface | Implementation |
|--------|---------------------|----------------|
| `Patient` | `PatientRepositoryInterface` | `DoctrinePatientRepository` |
| `Appointment` | `AppointmentRepositoryInterface` | `DoctrineAppointmentRepository` |
| `Invoice` | `InvoiceRepositoryInterface` | `DoctrineInvoiceRepository` |
| `Customer` | `CustomerRepositoryInterface` | `DoctrineCustomerRepository` |

### 13.4 Database Size Estimates

**Assumptions:**
- 1,000 patients
- 10,000 appointments/year
- 5,000 clinical records/year
- 1,000 invoices/year

**Estimated Storage (1 year):**
- `patients`: ~1 MB
- `appointments`: ~5 MB
- `records`: ~10 MB (free-text fields)
- `invoices` + `invoice_lines`: ~2 MB

**Total:** ~20 MB/year

**Growth Projection (5 years):** ~100 MB (negligible for modern databases)

**Storage Requirements:** Minimum 1GB database storage (allows 50x growth)

---

**Document End**
