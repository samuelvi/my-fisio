# Local configuration

Put machine-specific overrides in untracked `.env.dev.local` (or `.env.test.local`
for tests). Compose supplies database/Redis connection settings and `APP_ENV` to
the containers. Frontend `VITE_*` values are loaded for the selected Vite mode:
`dev`, `test`, or `prod`; restart Vite or rebuild after changing them.

## Calendar

| Variable | Purpose |
| --- | --- |
| `VITE_CALENDAR_FIRST_DAY` | `0` for Sunday, `1` for Monday |
| `VITE_CALENDAR_SLOT_DURATION_MINUTES` | Visual slot length in minutes |
| `VITE_DEFAULT_APPOINTMENT_DURATION` | Default appointment length in minutes |
| `VITE_MAX_APPOINTMENT_DURATION` | Frontend maximum appointment length in hours |
| `VITE_CALENDAR_SCROLL_TIME` | Initial visible time, e.g. `08:00:00` |
| `VITE_CALENDAR_NARROW_SATURDAY`, `VITE_CALENDAR_NARROW_SUNDAY` | Narrow weekend columns when `true` |
| `VITE_CALENDAR_WEEKEND_WIDTH_PERCENT` | Weekend width relative to a normal day |

The backend uses `CALENDAR_SLOTS_MONDAY` through `CALENDAR_SLOTS_SUNDAY` to generate
available slots. Each comma-separated range creates one slot:

```dotenv
CALENDAR_SLOTS_MONDAY="09:00-10:00,10:00-11:00,15:00-16:00"
CALENDAR_SLOTS_SUNDAY=""
```

Appointments with an empty title represent gaps. The calendar can generate gaps
for an empty visible range or delete gaps from the visible range.

## Invoices

`COMPANY_NAME`, `COMPANY_TAX_ID`, `COMPANY_ADDRESS_LINE1`, `COMPANY_ADDRESS_LINE2`,
`COMPANY_PHONE`, `COMPANY_EMAIL` and `COMPANY_WEB` populate the PDF header.
`INVOICE_PREFIX` controls the displayed prefix.

`COMPANY_LOGO_PATH` is a **project-relative filesystem path**, not a browser URL:

```dotenv
COMPANY_LOGO_PATH="private/logo.png"
```

The PDF controller embeds the local PNG. Alternatively use `public/logo.png` if
the image should also be publicly served. Both locations are ignored by Git.
`VITE_INVOICE_EDIT_ENABLED=false` hides frontend invoice editing.

## Language and auditing

- `VITE_DEFAULT_LOCALE` sets the initial UI language; the user's choice persists locally.
- Messages live in `translations/messages.{locale}.yaml`. `TranslationExtension`
  exposes the catalogs to Twig, which injects `window.APP_TRANSLATIONS` into the page.
- `AUDIT_TRAIL_ENABLED` controls audit entries globally. Per-entity switches are
  `AUDIT_TRAIL_PATIENT_ENABLED`, `AUDIT_TRAIL_CUSTOMER_ENABLED`,
  `AUDIT_TRAIL_APPOINTMENT_ENABLED`, `AUDIT_TRAIL_INVOICE_ENABLED` and
  `AUDIT_TRAIL_RECORD_ENABLED`. Events are still stored when audit entries are disabled.

## Frontend watch

`VITE_WATCH_STRATEGY` selects `events` or `polling`;
`VITE_WATCH_POLL_INTERVAL` is the polling interval in milliseconds.
`docker/dev/docker-compose.override.yaml` enables polling and is loaded by the Makefile.

PHP development settings live in `docker/dev/php/php.ini`. Service bindings and
backend environment-variable names are defined in `config/services.yaml`.
