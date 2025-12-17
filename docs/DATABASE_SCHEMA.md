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
| `url` | `url` | VARCHAR(255) | Associated URL | No change |
| `className` | `class_name` | VARCHAR(255) | CSS class for styling | Converted to snake_case |
| `editable` | `editable` | BOOLEAN | Whether appointment is editable | No change |
| `strartEditable` | `start_editable` | BOOLEAN | Whether start time is editable | Fixed typo, converted to snake_case |
| `durationEditable` | `duration_editable` | BOOLEAN | Whether duration is editable | Converted to snake_case |
| `rendering` | `rendering` | VARCHAR(255) | Rendering mode | No change |
| `overlap` | `overlap` | BOOLEAN | Whether overlap is allowed | No change |
| `event_constraint` | `constraint_id` | INTEGER | Constraint reference | Renamed, converted to snake_case |
| `event_source` | `source` | VARCHAR(255) | Event source identifier | Simplified name |
| `color` | `color` | VARCHAR(255) | Event color | No change |
| `backgroundColor` | `background_color` | VARCHAR(255) | Background color | Converted to snake_case |
| `textColor` | `text_color` | VARCHAR(255) | Text color | Converted to snake_case |
| `customFields` | `custom_fields` | JSON | Additional custom data | Converted to snake_case, changed from LONGTEXT to JSON |
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
   - `LONGTEXT` with array serialization → `JSON` (native JSON support)
   - `DATETIME` → `TIMESTAMP` (PostgreSQL standard)
7. **Typo Fix**: `strartEditable` → `start_editable`

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

## Migration File

The migration file is located at:
```
src/Infrastructure/Persistence/Doctrine/Migrations/Version20251217000001.php
```

### Running the Migration

```bash
# Create the database (if not exists)
make db-create

# Run the migration
make db-migrate

# Validate the schema
make db-validate
```

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

## Related Tables (To Be Migrated)

- `users` - User management
- `patients` - Patient information
- `historial` - Medical history records

## Notes

- All code, comments, and documentation are in English per project requirements
- The schema follows PostgreSQL best practices
- Indexes are optimized for common query patterns (user-based and date-range queries)
- The `custom_fields` JSON column provides flexibility for future extensions without schema changes
