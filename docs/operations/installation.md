# Local installation

## Requirements

- Docker and Compose v2 with `up --wait --wait-timeout` support.
- Make.
- Node 22+ and pnpm 11.1.1 on the host for dependency tooling and Playwright.
  PHP and the development frontend run in containers.

## First run

```bash
git clone <repository-url> pcms
cd pcms
make dev-install
```

`dev-install` builds images, starts services with health checks, installs
`composer.lock`, generates JWT keys, creates/migrates the database and exports
frontend routes. The Node service installs `pnpm-lock.yaml` and starts Vite.
Symfony and the required packages are already part of the project.

On a new local database, load the demo user and sample records:

```bash
make db-fixtures
```

This replaces database contents. The demo credentials and dataset are defined in
[`AppFixtures.php`](../../tests/DataFixtures/AppFixtures.php).

## Services

| Service | Local address |
| --- | --- |
| Application | http://localhost |
| Vite / HMR | http://localhost:5173 |
| MailPit | http://localhost:8025 |
| Adminer | http://localhost:8080 |
| MariaDB | localhost:3306 |
| Redis | localhost:6379 |

Adminer uses server `mariadb`, database `physiotherapy_db`, user
`physiotherapy_user`, and development password `physiotherapy_pass`.
`make urls` prints the same service addresses.

## Working on the project

```bash
make dev-up
make dev-logs service=php
make symfony cmd="debug:router"
make db-migrate
make dev-down
```

Use `make composer-install` after PHP dependency changes and `make deps-install`
after frontend dependency changes. PHPStan, CS Fixer and Rector are already
declared development dependencies; they need no separate installation targets.
Follow the [dependency policy](../security/dependency-installation.md) to add packages.

Vite serves frontend edits through HMR. `make build-assets` exports routes before
building the production-mode frontend and refreshing Symfony cache; it assumes
dependencies are installed. `make dump-routes` alone refreshes exposed API routes.

See [configuration](configuration.md) for local overrides and [testing](../testing/e2e.md)
for the separate test environment. `make dev-quick-start` remains an alias for
`make dev-install`.

## Troubleshooting

- **Service fails:** run `make dev-ps` and `make dev-logs service=<service>`.
- **Files do not refresh:** check `make dev-watch-logs`. The development Compose
  override enables polling; see [watch settings](configuration.md#frontend-watch).
- **Cache permissions:** inspect `var/` ownership from `make dev-shell-php` and
  adjust it for the container user, then run `make cache-clear`.
- **Dependency mismatch:** reinstall the relevant lockfile instead of adding packages.
- **Need a clean local dataset:** `make db-reset` drops and recreates the development database.

`make dev-down` retains data. `make dev-clean` also removes Docker-managed volumes,
but does not remove the database/Redis bind-mount directories under `docker/dev/`.
