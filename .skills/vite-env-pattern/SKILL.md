---
name: vite-env-pattern
description: Pattern for managing environment variables shared between Symfony backend and Vite frontend, ensuring single source of truth and avoiding duplication
---

# Vite Environment Variable Pattern

## Overview

This project follows a **DRY (Don't Repeat Yourself)** pattern for environment variables that need to be accessible from both Symfony backend and Vite frontend.

## Pattern Rules

### 1. Define Base Variable Once

Base variables are defined in their respective configuration sections (e.g., `# Invoice settings`, `# Base configuration values`, `###> brand/colors ###`):

```env
# Invoice settings
INVOICE_PREFIX=F
DEFAULT_CURRENCY=EUR

# Base configuration values
MAX_APPOINTMENT_DURATION=10
DEFAULT_LOCALE=en

###> brand/colors ###
COLOR_PRIMARY="140 107 93"
###< brand/colors ###
```

### 2. Reference in Vite Section

All Vite-exposed variables are grouped in the `###> vite/vars ###` section and **reference** the base values using shell variable expansion `"${VARIABLE_NAME}"`:

```env
###> vite/vars ###
# Vite-exposed variables (reference base values to avoid duplication)
VITE_INVOICE_PREFIX="${INVOICE_PREFIX}"
VITE_DEFAULT_CURRENCY="${DEFAULT_CURRENCY}"
VITE_MAX_APPOINTMENT_DURATION="${MAX_APPOINTMENT_DURATION}"
VITE_DEFAULT_LOCALE="${DEFAULT_LOCALE}"

# Vite-exposed color variables (reference base values)
VITE_COLOR_PRIMARY="${COLOR_PRIMARY}"
###< vite/vars ###
```

## Why This Pattern?

### ✅ Benefits

1. **Single Source of Truth**: Base value defined only once
2. **Consistency**: Backend and frontend always use the same value
3. **Maintainability**: Change one value, updates everywhere
4. **No Duplication**: Avoid copy-paste errors
5. **Clear Organization**: Vite variables grouped separately

### ❌ Anti-Pattern

**DON'T** duplicate values:

```env
# ❌ WRONG - Duplicated value
DEFAULT_CURRENCY=EUR
VITE_DEFAULT_CURRENCY=EUR  # Hard to maintain, can get out of sync
```

**DO** reference base value:

```env
# ✅ CORRECT - Single source of truth
DEFAULT_CURRENCY=EUR
VITE_DEFAULT_CURRENCY="${DEFAULT_CURRENCY}"
```

## Implementation Checklist

When adding a new environment variable that needs to be shared:

1. ✅ Define base variable in appropriate section (not in vite/vars)
2. ✅ Add Vite reference in `###> vite/vars ###` section
3. ✅ Use shell variable syntax: `VITE_VARNAME="${VARNAME}"`
4. ✅ Add descriptive comment if variable group is new
5. ✅ Use backend variable directly in PHP: `$_ENV['VARNAME']`
6. ✅ Use Vite variable in frontend: `import.meta.env.VITE_VARNAME`

## Examples

### Example 1: Invoice Configuration

```env
# Define once
INVOICE_PREFIX=F
DEFAULT_CURRENCY=EUR

# Reference in Vite section
VITE_INVOICE_PREFIX="${INVOICE_PREFIX}"
VITE_DEFAULT_CURRENCY="${DEFAULT_CURRENCY}"
```

**Backend usage:**
```php
$currency = $_ENV['DEFAULT_CURRENCY'] ?? 'EUR';
```

**Frontend usage:**
```typescript
const currency = import.meta.env.VITE_DEFAULT_CURRENCY || 'EUR';
```

### Example 2: Brand Colors

```env
# Define once
COLOR_PRIMARY="140 107 93"
COLOR_PRIMARY_DARK="74 55 45"

# Reference in Vite section
VITE_COLOR_PRIMARY="${COLOR_PRIMARY}"
VITE_COLOR_PRIMARY_DARK="${COLOR_PRIMARY_DARK}"
```

### Example 3: Calendar Settings

```env
# Define once
CALENDAR_SLOT_DURATION_MINUTES=30
CALENDAR_FIRST_DAY=0

# Reference in Vite section
VITE_CALENDAR_SLOT_DURATION_MINUTES="${CALENDAR_SLOT_DURATION_MINUTES}"
VITE_CALENDAR_FIRST_DAY="${CALENDAR_FIRST_DAY}"
```

## .env File Structure

The `.env` file should follow this organization:

1. Framework configuration (`APP_ENV`, `DATABASE_URL`, etc.)
2. Domain-specific base values (invoices, calendar, brand colors, etc.)
3. `###> vite/vars ###` section with all Vite references
4. Other framework-specific sections (audit, Redis, etc.)

## Common Mistakes to Avoid

1. ❌ Defining `VITE_` variables outside the vite/vars section
2. ❌ Hard-coding values in `VITE_` variables instead of referencing
3. ❌ Creating base variables inside vite/vars section
4. ❌ Mixing Vite and non-Vite variables in the same section

## Verification

To verify correct implementation:

```bash
# Check that VITE variables reference base values
grep "^VITE_" .env | grep -v '="${'
# Should return empty (all VITE_ vars should reference base vars)

# Check base variables are not duplicated
grep "^INVOICE_PREFIX=" .env | wc -l
# Should return 1 (defined only once)
```

## Related Configuration

- Vite reads `VITE_*` variables automatically
- Symfony reads all variables via `$_ENV` or `%env()%`
- Shell variable expansion happens when .env is loaded
- Docker Compose can also use these variables

## When to Use This Pattern

Use this pattern when:
- ✅ Variable needs to be accessed from both backend and frontend
- ✅ Value should be consistent across stack
- ✅ Configuration should be centralized

Don't use this pattern when:
- ❌ Variable is only used in backend (no `VITE_` needed)
- ❌ Variable is only used in frontend (define as `VITE_` directly)
- ❌ Values intentionally differ between backend/frontend
