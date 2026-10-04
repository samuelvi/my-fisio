# PCMS — Physiotherapy Clinic Management System

Web application for a physiotherapy clinic:

- Patients and clinical histories.
- Appointment calendar and available slots.
- Billing customers, invoices, PDF exports and invoice-number gap checks.
- Change history through domain events and audit records.

## Stack

Symfony 7.4 / PHP 8.4 / API Platform / Doctrine / MariaDB 11.
React 18 / TypeScript / Vite / Tailwind CSS / TanStack Query.
Docker provides PHP-FPM, Nginx, Redis, MailPit, Adminer and the Vite dev server.

## Start locally

Requires Docker with Compose v2 supporting `up --wait --wait-timeout`, and Make.
Host-side dependency tools and browser tests also require Node 22+ and pnpm 11.1.1.

```bash
git clone <repository-url> pcms
cd pcms
make dev-install
```

Open **http://localhost**. Installation builds the containers, installs locked
dependencies, generates JWT keys and frontend routes, and applies migrations.
For a fresh local database, `make db-fixtures` loads demo data and a login user;
it **replaces existing data**. See [installation](docs/operations/installation.md).

## Daily commands

| Command | Purpose |
| --- | --- |
| `make dev-up` / `make dev-down` | Start / stop development services |
| `make dev-logs service=php` | Follow one service's logs |
| `make symfony cmd="debug:router"` | Run a Symfony console command |
| `make db-migrate` | Apply database migrations |
| `make build-assets` | Generate routes, build assets and refresh cache |
| `make test` | Run PHPUnit in the test container |
| `make test-frontend` | Run Vitest in the development Node container |
| `make test-e2e` | Prepare test data and run Playwright |
| `make quality-check` | Run PHPStan and PHP style checks |
| `make help` | List commands |

See [test setup](docs/testing/e2e.md) before the first browser test run.
Use the [dependency workflow](docs/security/dependency-installation.md) when adding frontend packages.

## Code map

| Path | Responsibility |
| --- | --- |
| `src/Domain/` | Entities, events and repository interfaces |
| `src/Application/` | Commands, handlers and application services |
| `src/Infrastructure/` | API endpoints, persistence and integrations |
| `assets/app.tsx`, `assets/components/` | React navigation and screens |
| `assets/{application,domain,infrastructure,presentation}/` | Frontend supporting layers |
| `tests/`, `assets/tests/` | Backend, browser and frontend tests |
| `translations/`, `templates/` | Translation catalogs, page shell and invoice templates |

SQL stores the current state. Commands change entities; domain events record
changes for auditing. See [architecture](docs/architecture/system-architecture.md).

## Documentation

- [Documentation index](docs/README.md)
- [Local configuration](docs/operations/configuration.md)
- [Deployment](docs/operations/deployment.md)
- [Agent entry point](AGENTS.md) and [project memory](memory-bank/product-context.md)
