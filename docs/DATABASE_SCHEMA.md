# Database Schema Documentation

## Overview

This document describes the database schema migration from the legacy MariaDB database to the new PostgreSQL database, following DDD principles and naming conventions.

## Naming Conventions

Following the conventions defined in [AGENTS.md](./AGENTS.md):

- **Tables**: `snake_case` plural (e.g., `appointments`, `patients`)
- **Columns**: `snake_case` (e.g., `first_name`, `starts_at`)
- **Foreign Keys**: `{singular_table}_id` (e.g., `user_id`)
- **Timestamps**: `created_at`, `updated_at`
- **Booleans**: Descriptive names (e.g., `all_day`, `editable`)
- **Date/Time fields**: Use `_at` suffix for timestamps (e.g., `starts_at`, `ends_at`)

## Table: appointments

### Description
Manages appointment scheduling and calendar events for the physiotherapy clinic. This table stores all appointments associated with users (physiotherapists) and contains configuration for calendar display and behavior.

### Migration from Legacy Schema

**Legacy table name (MariaDB)**: `event`
**New table name (PostgreSQL)**: `appointments`

### Schema Mapping

| Legacy Field (MariaDB) | New Field (PostgreSQL) | Type (PostgreSQL) | Description | Changes Made |
|------------------------|------------------------|-------------------|-------------|--------------|
| `evento_id` | `id` | SERIAL PRIMARY KEY | Unique identifier | Renamed to English, changed to SERIAL |
| `user_id` | `user_id` | INTEGER NOT NULL | User (physiotherapist) reference | No change |
| `title` | `title` | VARCHAR(255) | Appointment title | No change |
| `allDay` | `all_day` | BOOLEAN | All-day event flag | Converted to snake_case |
| `event_start` | `starts_at` | TIMESTAMP NOT NULL | Appointment start time | Renamed following timestamp convention |
| `event_end` | `ends_at` | TIMESTAMP NOT NULL | Appointment end time | Renamed following timestamp convention |
| `color` | `type` | VARCHAR(255) | Appointment type | Renamed, "cita" -> "appointment", "otros" -> "other" |

### UI Color Coding

The calendar interface applies the following color logic based on the appointment data:

- **Marrón (`rgb(160, 112, 94)`)**: Appointments with a non-empty title.
- **Amarillo (`rgb(245, 239, 224)`)**: Appointments with an empty title (empty slots).
- **Verde Oliva (`rgb(151, 160, 94)`)**: "Other" type events with a non-empty title.

| `comentario` | `notes` | TEXT | Additional notes/comments | Translated to English |
| N/A | `created_at` | TIMESTAMP NOT NULL | Record creation timestamp | Added per convention |
| N/A | `updated_at` | TIMESTAMP | Record last update timestamp | Added per convention |

### Indexes

- `PRIMARY KEY` on `id`
- `INDEX idx_appointments_user_id` on `user_id` - For querying appointments by user
- `INDEX idx_appointments_starts_at` on `starts_at` - For date range queries
- `INDEX idx_appointments_ends_at` on `ends_at` - For date range queries

### Foreign Keys

- `user_id` → References `users.id` (to be implemented when users table is migrated)

### Key Changes Summary

1. **Table Naming**: `event` → `appointments` (more descriptive and following plural convention)
2. **Primary Key**: `evento_id` → `id` with SERIAL type (PostgreSQL auto-increment)
3. **Timestamp Fields**:
   - `event_start` → `starts_at`
   - `event_end` → `ends_at`
   - Added `created_at` and `updated_at` for audit trail
4. **Snake Case Conversion**: All camelCase fields converted to snake_case
5. **Translation**: Spanish field `comentario` → English `notes`
6. **Type Improvements**:
   - `TINYINT(1)` → `BOOLEAN` (proper PostgreSQL boolean type)
   - `DATETIME` → `TIMESTAMP` (PostgreSQL standard)
7. **Simplified Schema**: Removed multiple FullCalendar-specific fields (`url`, `className`, etc.) to keep the domain model clean.
8. **Field Renaming**: `color` field renamed to `type` with value transformation.

## Domain Model

The `Appointment` entity is located in:
```
src/Domain/Model/Appointment/Appointment.php
```

This entity follows DDD principles and uses PHP 8.4 attributes for Doctrine ORM mapping.

### Key Features

- **Immutable Timestamps**: Uses `DateTimeImmutable` for created_at
- **Lifecycle Callbacks**: `@PreUpdate` hook automatically updates `updated_at`
- **Type Safety**: Strong typing for all properties
- **Value Objects**: Ready for refactoring to use value objects (e.g., `AppointmentId`, `TimeRange`)

## Future Enhancements

1. **Foreign Key Constraints**: Add foreign key constraint to `users` table once migrated
2. **Check Constraints**:
   - Ensure `starts_at` < `ends_at`
   - Validate color format (hex colors)
3. **Partitioning**: Consider partitioning by date for large datasets
4. **Full-Text Search**: Add GIN index on `title` and `notes` for search functionality
5. **Value Objects**: Refactor to use DDD value objects:
   - `AppointmentId` for the primary key
   - `TimeRange` for start/end times
   - `ColorScheme` for color-related fields

## Table: patients

### Description
Stores personal and medical contact information for patients. This is the core entity for the clinic's management.

### Migration from Legacy Schema

**Legacy table name (MariaDB)**: `paciente`
**New table name (PostgreSQL)**: `patients`

### Schema Mapping

| Legacy Field (MariaDB) | New Field (PostgreSQL) | Type (PostgreSQL) | Description | Changes Made |
|------------------------|------------------------|-------------------|-------------|--------------|
| `paciente_id` | `id` | SERIAL PRIMARY KEY | Unique identifier | Renamed to English, changed to SERIAL |
| `nombre` | `first_name` | VARCHAR(50) | Patient first name | Translated |
| `apellidos` | `last_name` | VARCHAR(100) | Patient last name | Translated |
| `fecha_de_nacimiento` | `date_of_birth` | DATE | Date of birth | Translated |
| `dni` | `identity_document` | VARCHAR(15) | ID Document (DNI/NIE) | Translated |
| `telefono` | `phone` | VARCHAR(50) | Contact phone | Translated |
| `direccion` | `address` | VARCHAR(250) | Postal address | Translated |
| `email` | `email` | VARCHAR(100) | Email address | Translated |
| `profesion` | `profession` | VARCHAR(250) | Profession | Translated |
| `actividad_deportiva` | `sports_activity` | VARCHAR(250) | Sports info | Translated |
| `notas` | `notes` | VARCHAR(250) | General notes | Translated |
| `tarifa` | `rate` | VARCHAR(250) | Rate/Pricing info | Translated |
| `alergias` | `allergies` | VARCHAR(250) | Medical allergies | Translated |
| `medicacion` | `medication` | VARCHAR(250) | Current medication | Translated |
| `enfermedades_sistemicas` | `systemic_diseases` | VARCHAR(250) | Systemic diseases | Translated |
| `intervenciones_quirurgicas` | `surgeries` | VARCHAR(250) | Past surgeries | Translated |
| `accidentes` | `accidents` | VARCHAR(250) | Past accidents | Translated |
| `lesiones` | `injuries` | VARCHAR(250) | Past injuries | Translated |
| `bruxismo` | `bruxism` | VARCHAR(250) | Bruxism history | Translated |
| `plantillas` | `insoles` | VARCHAR(250) | Use of insoles | Translated |
| `otros` | `others` | VARCHAR(250) | Other medical info | Translated |
| `fecha_de_creacion` | `created_at` | DATE | Creation date | Translated |
| N/A | `status` | VARCHAR(20) | Patient status | Added (default: 'active') |
| N/A | `customer_id` | INTEGER | Link to customer | Added (nullable) |

## Table: records

### Description
Stores clinical history and visit records for patients.

### Migration from Legacy Schema

**Legacy table name (MariaDB)**: `historial`
**New table name (PostgreSQL)**: `records`

### Schema Mapping

| Legacy Field (MariaDB) | New Field (PostgreSQL) | Type (PostgreSQL) | Description | Changes Made |
|------------------------|------------------------|-------------------|-------------|--------------|
| `historial_id` | `id` | SERIAL PRIMARY KEY | Unique identifier | Renamed, SERIAL |
| `paciente_id` | `patient_id` | INTEGER | Foreign Key to patients | Renamed |
| `fecha_de_creacion` | `created_at` | DATE | Date of record | Translated |
| `motivo_consulta` | `consultation_reason` | TEXT | Reason for visit | Translated |
| `aparicion` | `onset` | TEXT | Onset of symptoms | Translated |
| `pruebas_rx` | `radiology_tests` | TEXT | X-Rays/Tests | Translated |
| `evolucion` | `evolution` | TEXT | Progress/Evolution | Translated |
| `situacion_actual` | `current_situation` | TEXT | Current status | Translated |
| `baja_laboral` | `sick_leave` | BOOLEAN | Sick leave status | Translated, converted to BOOL |
| `tratamiento_de_fisioterapia` | `physiotherapy_treatment` | TEXT | Treatment applied | Translated |
| `tratamiento_medico` | `medical_treatment` | TEXT | Medical treatment | Translated |
| `tratamiento_en casa` | `home_treatment` | TEXT | Home exercises | Translated, fixed typo |
| `notas` | `notes` | TEXT | Internal notes | Translated |

### Foreign Keys
- `patient_id` → `patients.id`

## Table: invoices

### Description
Stores billing information. Linked to customers (optionally) for billing purposes.

### Migration from Legacy Schema

**Legacy table name (MariaDB)**: `factura`
**New table name (PostgreSQL)**: `invoices`

### Schema Mapping

| Legacy Field (MariaDB) | New Field (PostgreSQL) | Type (PostgreSQL) | Description | Changes Made |
|------------------------|------------------------|-------------------|-------------|--------------|
| `factura_id` | `id` | SERIAL PRIMARY KEY | Unique identifier | Renamed, SERIAL |
| `numero` | `number` | VARCHAR(20) | Invoice number | Translated |
| `fecha_de_factura` | `date` | TIMESTAMP | Invoice date | Translated |
| `total` | `amount` | DOUBLE PRECISION | Total amount | Translated |
| `nombre` | `name` | VARCHAR(50) | Billing name | Translated |
| `telefono` | `phone` | VARCHAR(50) | Billing phone | Translated |
| `direccion` | `address` | VARCHAR(250) | Billing address | Translated |
| `email` | `email` | VARCHAR(100) | Billing email | Translated |
| `nif` | `tax_id` | VARCHAR(15) | Tax ID (NIF) | Translated |
| `fecha_de_creacion` | `created_at` | DATE | Creation record | Translated |
| N/A | `customer_id` | INTEGER | Foreign Key to customers | Added new relation (nullable) |

### Foreign Keys
- `customer_id` → `customers.id`

## Table: invoice_lines

### Description
Stores detailed line items for each invoice (concepts, prices, quantities).

### Migration from Legacy Schema

**Legacy table name (MariaDB)**: `factura_detalle`
**New table name (PostgreSQL)**: `invoice_lines`

### Schema Mapping

| Legacy Field (MariaDB) | New Field (PostgreSQL) | Type (PostgreSQL) | Description | Changes Made |
|------------------------|------------------------|-------------------|-------------|--------------|
| `factura_detalle_id` | `id` | SERIAL PRIMARY KEY | Unique identifier | Renamed, SERIAL |
| `factura_id` | `invoice_id` | INTEGER | Foreign Key to invoices | Renamed |
| `precio` | `price` | DOUBLE PRECISION | Unit price | Translated |
| `total` | `amount` | DOUBLE PRECISION | Line total | Translated |
| `concepto` | `concept` | VARCHAR(255) | Short concept | Translated |
| `cantidad` | `quantity` | INTEGER | Quantity | Translated |
| `descripcion` | `description` | TEXT | Extended description | Translated |

### Foreign Keys
- `invoice_id` → `invoices.id`

## Table: counters

### Description
Key-value store for system counters (e.g., auto-incrementing invoice numbers per year).

### Migration from Legacy Schema

**Legacy table name (MariaDB)**: `contador`
**New table name (PostgreSQL)**: `counters`

### Schema Mapping

| Legacy Field (MariaDB) | New Field (PostgreSQL) | Type (PostgreSQL) | Description | Changes Made |
|------------------------|------------------------|-------------------|-------------|--------------|
| N/A | `id` | SERIAL PRIMARY KEY | Unique identifier | Added for Doctrine consistency |
| `nombre` | `name` | VARCHAR(50) UNIQUE | Counter key | Translated. Renamed prefixes: `invoice_` -> `invoices_` |
| `valor` | `value` | TEXT | Counter value | Translated |

## Table: customers

### Description
Entities responsible for billing. Can be linked to one or more invoices. Note: This table was not populated from legacy data (as it didn't exist explicitly), but structure is created for future use.

### Schema (New)

| Field | Type | Description |
|-------|------|-------------|
| `id` | SERIAL PRIMARY KEY | Unique Identifier |
| `first_name` | VARCHAR(100) | First Name |
| `last_name` | VARCHAR(100) | Last Name |
| `full_name` | VARCHAR(255) | Full Name |
| `tax_id` | VARCHAR(20) | Tax ID for billing |
| `email` | VARCHAR(180) | Contact email |
| `phone` | VARCHAR(50) | Contact phone |
| `billing_address` | TEXT | Address |
| `created_at` | TIMESTAMP | Creation date |
| `updated_at` | TIMESTAMP | Update date |

