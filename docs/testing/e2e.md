# Testing

## Suites

| Command | Suite | Runtime |
| --- | --- | --- |
| `make test` | PHPUnit | Test PHP container |
| `make test-frontend` | Vitest | Development Node container |
| `make test-e2e` | Playwright specs and Gherkin scenarios | Host browser runner + test containers |
| `make quality-check` | PHPStan and CS Fixer | Development PHP container |

PHP tests live under `tests/`; frontend tests under `assets/tests/`.
PHPUnit configuration is `phpunit.dist.xml`; Playwright configuration is
`playwright.config.ts`. `make test-coverage` writes `var/coverage/` and requires
a PHP coverage driver. `make test-all` runs all three suites and requires both
the development Node service and the browser prerequisites below.

## First browser test run

Requires Node 22+, Corepack/pnpm and Docker. The test database is separate from development.

```bash
make test-build
make test-up
make test-assets-build
corepack pnpm exec playwright install chromium
make test-e2e
```

Test services: application `http://127.0.0.1:8081`, MariaDB `localhost:3307`,
Redis `localhost:6380`. Override the web port consistently with
`TEST_WEB_PORT=18081`; `E2E_BASE_URL` defaults to that port.

Test preparation starts/waits for services, installs Composer dependencies only
if `vendor/autoload.php` is missing, generates JWT keys, refreshes test cache and
recreates the test database with fixtures. After changing `composer.lock`, run
`make composer-install` in the development stack before testing; both stacks
mount the same checkout and dependencies.

`test-assets-build` installs the frontend lockfile and builds with Vite mode `test`.
Re-run it after frontend changes. Browser runs generate BDD specs before Playwright.

## Selecting tests and debugging

```bash
make test-e2e args="--project=bdd"
make test-e2e file=".features-gen/tests/e2e/security/login/login.feature.spec.js"
make test-e2e-ui
make test-e2e-video
make test-down
```

Use generated `.feature.spec.js` paths for Gherkin tests and original `.spec.ts`
paths for ordinary Playwright tests. `file` and `args` also work with UI/video targets.
The HTML report is in `var/log/playwright/report`; recordings and artifacts are in
`var/log/playwright/test-results`. By default videos are retained on failure;
the video target sets `PLAYWRIGHT_VIDEO=on` and retains all recordings.
Failed tests always return a failing Make exit status.

`make test-down` removes the test containers but keeps bind-mounted database files.
Each E2E invocation resets test data before running.

## Writing browser tests

- Reuse fixtures and step definitions in `tests/e2e/common/`.
- Use factories in `tests/e2e/factories/` for scenario data.
- Keep related `.feature` and `.steps.ts` files together under the domain directory.
- Prefer role/label locators and auto-retrying assertions over fixed sleeps.
- Playwright runs with one worker because scenarios share database state.

The BDD fixture calls `/api/test/reset-db-empty` before the first scenario of each
feature. Later scenarios reuse its data. `@reset` forces a reset; `@no-reset`
skips it, including in CI. See `tests/e2e/common/bdd.ts` for the implementation.
