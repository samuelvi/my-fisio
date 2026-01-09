# Database Schema Documentation
## Physiotherapy Clinic Management System

**Last Updated:** January 9, 2026
**Database Engine:** MariaDB 11
**Charset:** utf8mb4
**Collation:** utf8mb4_unicode_ci

---

## Overview

This document describes the current database schema for the Physiotherapy Clinic Management System using MariaDB 11, following DDD (Domain-Driven Design) principles and clean code naming conventions.

For legacy migration mapping, see [private/docs/LEGACY_MIGRATION_MAPPING.md](../private/docs/LEGACY_MIGRATION_MAPPING.md).

---

## Naming Conventions

Following the conventions defined in [AGENTS.md](./AGENTS.md):

- **Tables**: `snake_case` plural (e.g., `appointments`, `patients`)
- **Columns**: `snake_case` (e.g., `first_name`, `starts_at`)
- **Foreign Keys**: `{singular_table}_id` (e.g., `user_id`, `patient_id`)
- **Timestamps**: `created_at`, `updated_at`
- **Booleans**: Descriptive names (e.g., `all_day`, `editable`)
- **Date/Time fields**: Use `_at` suffix for timestamps (e.g., `starts_at`, `ends_at`)

---

## Table: appointments

### Description
Manages appointment scheduling and calendar events for the physiotherapy clinic. Stores all appointments associated with users (physiotherapists) with configuration for calendar display and behavior.

### Schema

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| `user_id` | INTEGER | NOT NULL | User (physiotherapist) reference |
| `title` | VARCHAR(255) | NULLABLE | Appointment title (empty for gaps) |
| `all_day` | BOOLEAN | DEFAULT false | All-day event flag |
| `starts_at` | TIMESTAMP | NOT NULL | Appointment start time |
| `ends_at` | TIMESTAMP | NOT NULL | Appointment end time |
| `type` | VARCHAR(255) | NOT NULL | Appointment type (appointment, other) |
| `notes` | TEXT | NULLABLE | Additional notes/comments |
| `created_at` | TIMESTAMP | NOT NULL | Record creation timestamp |
| `updated_at` | TIMESTAMP | NULLABLE | Record last update timestamp |

### UI Color Coding

The calendar interface applies the following color logic:

- **Marrón (`rgb(160, 112, 94)`)**: Appointments with a non-empty title
- **Amarillo (`rgb(245, 239, 224)`)**: Appointments with an empty title (empty slots/gaps)
- **Verde Oliva (`rgb(151, 160, 94)`)**: "Other" type events with a non-empty title

### Indexes

- `PRIMARY KEY` on `id`
- `INDEX idx_appointments_user_id` on `user_id` - For querying appointments by user
- `INDEX idx_appointments_starts_at` on `starts_at` - For date range queries
- `INDEX idx_appointments_ends_at` on `ends_at` - For date range queries

### Foreign Keys

- `user_id` → References `users.id`

### Domain Model

**Entity Location:**
```
src/Domain/Entity/Appointment.php
```

**Key Features:**
- Immutable Timestamps using `DateTimeImmutable`
- Strong typing for all properties
- Lifecycle callbacks for `updated_at` management

---

## Table: patients

### Description
Stores personal and medical contact information for patients. Core entity for clinic management.

### Schema

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| `first_name` | VARCHAR(50) | NOT NULL | Patient first name |
| `last_name` | VARCHAR(100) | NOT NULL | Patient last name |
| `date_of_birth` | DATE | NULLABLE | Date of birth |
| `identity_document` | VARCHAR(15) | NULLABLE | ID Document (DNI/NIE) |
| `phone` | VARCHAR(50) | NULLABLE | Contact phone |
| `address` | VARCHAR(250) | NULLABLE | Postal address |
| `email` | VARCHAR(100) | NULLABLE | Email address |
| `profession` | VARCHAR(250) | NULLABLE | Profession |
| `sports_activity` | VARCHAR(250) | NULLABLE | Sports/physical activity info |
| `notes` | VARCHAR(250) | NULLABLE | General notes |
| `rate` | VARCHAR(250) | NULLABLE | Rate/Pricing information |
| `allergies` | VARCHAR(250) | NULLABLE | Medical allergies |
| `medication` | VARCHAR(250) | NULLABLE | Current medication |
| `systemic_diseases` | VARCHAR(250) | NULLABLE | Systemic diseases |
| `surgeries` | VARCHAR(250) | NULLABLE | Past surgeries |
| `accidents` | VARCHAR(250) | NULLABLE | Past accidents |
| `injuries` | VARCHAR(250) | NULLABLE | Past injuries |
| `bruxism` | VARCHAR(250) | NULLABLE | Bruxism history |
| `insoles` | VARCHAR(250) | NULLABLE | Use of insoles |
| `others` | VARCHAR(250) | NULLABLE | Other medical information |
| `status` | VARCHAR(20) | DEFAULT 'active' | Patient status (active/inactive) |
| `customer_id` | INTEGER | NULLABLE | Link to customer for billing |
| `created_at` | TIMESTAMP | NOT NULL | Record creation date |

### Indexes

- `PRIMARY KEY` on `id`
- `INDEX idx_patients_customer_id` on `customer_id`
- Full-text search indexes on `first_name` and `last_name` (case-insensitive)

### Foreign Keys

- `customer_id` → References `customers.id`

---

## Table: records

### Description
Stores clinical history and visit records for patients. Immutable once created (no editing, only appending).

### Schema

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| `patient_id` | INTEGER | NOT NULL | Foreign key to patients |
| `created_at` | DATE | NOT NULL | Date of record |
| `consultation_reason` | TEXT | NULLABLE | Reason for visit |
| `onset` | TEXT | NULLABLE | Onset of symptoms |
| `radiology_tests` | TEXT | NULLABLE | X-Rays/Tests performed |
| `evolution` | TEXT | NULLABLE | Progress/Evolution |
| `current_situation` | TEXT | NULLABLE | Current status |
| `sick_leave` | BOOLEAN | DEFAULT false | Sick leave status |
| `physiotherapy_treatment` | TEXT | NULLABLE | Treatment applied |
| `medical_treatment` | TEXT | NULLABLE | Medical treatment |
| `home_treatment` | TEXT | NULLABLE | Home exercises/treatment |
| `notes` | TEXT | NULLABLE | Internal notes |

### Indexes

- `PRIMARY KEY` on `id`
- `INDEX idx_records_patient_id` on `patient_id`
- `INDEX idx_records_created_at` on `created_at`

### Foreign Keys

- `patient_id` → References `patients.id`

---

## Table: invoices

### Description
Stores billing information. Linked to customers (optionally) for billing purposes.

### Schema

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| `number` | VARCHAR(20) | UNIQUE, NOT NULL | Invoice number (YYYY000001) |
| `date` | TIMESTAMP | NOT NULL | Invoice date |
| `amount` | DOUBLE PRECISION | NOT NULL | Total amount |
| `name` | VARCHAR(50) | NOT NULL | Billing name |
| `phone` | VARCHAR(50) | NULLABLE | Billing phone |
| `address` | VARCHAR(250) | NULLABLE | Billing address |
| `email` | VARCHAR(100) | NULLABLE | Billing email |
| `tax_id` | VARCHAR(15) | NULLABLE | Tax ID (NIF/CIF) |
| `customer_id` | INTEGER | NULLABLE | Foreign key to customers |
| `created_at` | TIMESTAMP | NOT NULL | Creation timestamp |

### Indexes

- `PRIMARY KEY` on `id`
- `UNIQUE INDEX idx_invoices_number` on `number`
- `INDEX idx_invoices_customer_id` on `customer_id`
- `INDEX idx_invoices_date` on `date`

### Foreign Keys

- `customer_id` → References `customers.id`

---

## Table: invoice_lines

### Description
Stores detailed line items for each invoice (concepts, prices, quantities).

### Schema

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| `invoice_id` | INTEGER | NOT NULL | Foreign key to invoices |
| `price` | DOUBLE PRECISION | NOT NULL | Unit price |
| `amount` | DOUBLE PRECISION | NOT NULL | Line total (price × quantity) |
| `concept` | VARCHAR(255) | NOT NULL | Short concept/title |
| `quantity` | INTEGER | NOT NULL | Quantity |
| `description` | TEXT | NULLABLE | Extended description |

### Indexes

- `PRIMARY KEY` on `id`
- `INDEX idx_invoice_lines_invoice_id` on `invoice_id`

### Foreign Keys

- `invoice_id` → References `invoices.id` ON DELETE CASCADE

---

## Table: customers

### Description
Entities responsible for billing. Can be linked to one or more patients and invoices.

### Schema

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| `first_name` | VARCHAR(100) | NOT NULL | First name |
| `last_name` | VARCHAR(100) | NOT NULL | Last name |
| `full_name` | VARCHAR(255) | NOT NULL | Full name (computed) |
| `tax_id` | VARCHAR(20) | UNIQUE | Tax ID for billing (NIF/CIF) |
| `email` | VARCHAR(180) | NULLABLE | Contact email |
| `phone` | VARCHAR(50) | NULLABLE | Contact phone |
| `billing_address` | TEXT | NULLABLE | Billing address |
| `created_at` | TIMESTAMP | NOT NULL | Creation date |
| `updated_at` | TIMESTAMP | NULLABLE | Last update date |

### Indexes

- `PRIMARY KEY` on `id`
- `UNIQUE INDEX idx_customers_tax_id` on `tax_id`
- `INDEX idx_customers_full_name` on `full_name`

---

## Table: counters

### Description
Key-value store for system counters (e.g., auto-incrementing invoice numbers per year).

### Schema

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| `name` | VARCHAR(50) | UNIQUE, NOT NULL | Counter key (e.g., "invoices_2026") |
| `value` | TEXT | NOT NULL | Counter value |

### Indexes

- `PRIMARY KEY` on `id`
- `UNIQUE INDEX idx_counters_name` on `name`

---

## Table: users

### Description
System users (physiotherapists, administrators). Authentication via JWT.

### Schema

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| `email` | VARCHAR(180) | UNIQUE, NOT NULL | User email (login) |
| `roles` | JSON | NOT NULL | User roles (ROLE_USER, ROLE_ADMIN) |
| `password` | VARCHAR(255) | NOT NULL | Hashed password |
| `created_at` | TIMESTAMP | NOT NULL | Account creation date |

### Indexes

- `PRIMARY KEY` on `id`
- `UNIQUE INDEX idx_users_email` on `email`

---

## Entity Relationships

```
users (1) ──┬──< appointments (N)
            │
patients (1) ──┬──< records (N)
               │
               └──> customers (1)

customers (1) ──< invoices (N)

invoices (1) ──< invoice_lines (N)
```

---

## Future Enhancements

### 1. Check Constraints
- Ensure `starts_at` < `ends_at` in appointments
- Validate email format in patients/customers/users
- Ensure positive values for invoice amounts

### 2. Partitioning
- Consider partitioning `appointments` by date for large datasets
- Partition `records` by year for historical data archival

### 3. Full-Text Search
- Add full-text indexes on `title` and `notes` in appointments
- Consider Elasticsearch integration for advanced search

### 4. Audit Tables
- Add audit trail tables for sensitive operations
- Track who modified what and when

### 5. Value Objects (DDD)
- Refactor to use value objects:
  - `AppointmentId` for appointment primary keys
  - `TimeRange` for start/end times
  - `EmailAddress` for email validation
  - `TaxId` for NIF/CIF validation

---

## Performance Optimization

### Current Optimizations
- ✅ utf8mb4_unicode_ci collation for case-insensitive searches
- ✅ Indexes on foreign keys
- ✅ Indexes on frequently queried fields (dates, names)

### Recommended Optimizations
- [ ] Add composite indexes for common query patterns
- [ ] Enable query cache for read-heavy operations
- [ ] Consider read replicas for reporting queries

---

## Related Documentation

- [AGENTS.md](./AGENTS.md) - Development guidelines and conventions
- [LEGACY_MIGRATION_MAPPING.md](../private/docs/LEGACY_MIGRATION_MAPPING.md) - Legacy database migration reference
- [INSTALLATION.md](./INSTALLATION.md) - Database setup instructions

---

**Database Version:** MariaDB 11.0
**Charset:** utf8mb4
**Collation:** utf8mb4_unicode_ci
**Schema Version:** Current (migrated November 2025)
