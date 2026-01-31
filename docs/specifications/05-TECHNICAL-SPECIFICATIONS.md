# Technical Specifications
## Physiotherapy Clinic Management System

**Document Version:** 1.0
**Last Updated:** December 30, 2025
**Classification:** Internal - Technical
**Owner:** Principal Software Architect & Engineering Team

---

## 1. Introduction

This document provides comprehensive technical specifications for the Physiotherapy Clinic Management System, including technology stack details, development environment setup, build processes, deployment procedures, and operational guidelines.

---

## 2. Technology Stack

### 2.1 Backend Technologies

| Component | Version | Purpose | Justification |
|-----------|---------|---------|---------------|
| **PHP** | 8.4 | Application runtime | Latest features (property hooks, asymmetric visibility), performance improvements |
| **Symfony** | 7.4.* | Web framework | Enterprise-grade MVC, mature ecosystem, LTS support |
| **Doctrine ORM** | 3.3 | Database abstraction | Type-safe entity mapping, migration management |
| **API Platform** | 4.2 | REST API framework | Automatic CRUD generation, OpenAPI docs, JSON-LD support |
| **LexikJWT** | 3.2 | JWT authentication | Industry-standard token-based auth |
| **Broadway** | (Planned) | Event Sourcing | CQRS/ES infrastructure (not yet actively used) |
| **Redis Bundle** | 4.10 | Cache | High-performance key-value store (future use) |
| **Mailer** | Symfony 7.4 | Email sending | Transactional emails (future: appointment reminders) |
| **DomPDF** | 3.1 | PDF generation | Invoice export to PDF |
| **FOSJsRoutingBundle** | 3.6 | Route exposure to JS | Avoid hardcoding API URLs in React |
| **NelmioCors** | 2.6 | CORS handling | Cross-origin requests (dev frontend on different port) |
| **PentatrionViteBundle** | 8.2 | Vite integration | Hot module replacement (HMR) in Symfony |

**PHP Extensions Required:**
- `ext-ctype`, `ext-iconv`, `ext-json` (core)
- `ext-pdo`, `ext-pdo_mysql` (database)
- `ext-redis` (caching)
- `ext-intl` (internationalization)
- `ext-opcache` (performance)

---

### 2.2 Frontend Technologies

| Component | Version | Purpose | Justification |
|-----------|---------|---------|---------------|
| **React** | 18.2 | UI framework | Component-based architecture, virtual DOM, massive ecosystem |
| **TypeScript** | 5.9 | Type safety | Catch errors at compile-time, better IDE support |
| **Vite** | 6.0 | Build tool | Lightning-fast HMR, ES modules, optimized production builds |
| **TanStack Router** | 7.11 | Client-side routing | Type-safe routing, nested routes |
| **TanStack Query** | (Inferred from architecture) | Server state management | Caching, invalidation, background refetching |
| **Axios** | 1.6 | HTTP client | Promise-based, interceptors for auth headers |
| **Tailwind CSS** | 3.3 | Utility-first CSS | Rapid UI development, responsive design |
| **Headless UI** | 2.2 | Accessible components | Unstyled, accessible UI primitives |
| **Hero Icons** | 2.2 | Icon library | Consistent icon set |
| **FullCalendar** | 6.1 | Calendar UI | Appointment scheduling interface |
| **React DatePicker** | 9.1 | Date input | User-friendly date selection |
| **Fuse.js** | 7.1 | Fuzzy search | Client-side fuzzy matching |

**Build Output:**
- Modern ES modules (ESM)
- Code splitting (planned, not yet implemented)
- Minification + tree-shaking
- Source maps (dev only)

---

### 2.3 Database & Storage

| Component | Version | Purpose |
|-----------|---------|---------|
| **MariaDB** | 11.0 | Primary relational database |
| **Redis** | 7.x (Alpine) | Caching (future use) |

**Why MariaDB?**
- ✅ Legacy system used MySQL; MariaDB is drop-in compatible
- ✅ Performance optimizations for read-heavy workloads
- ✅ Widely supported by managed hosting providers
- ✅ Native support for utf8mb4 with excellent collation features

---

### 2.4 Development & DevOps Tools

| Tool | Version | Purpose |
|------|---------|---------|
| **Docker** | 20.10+ | Containerization |
| **Docker Compose** | 2.0+ | Multi-container orchestration |
| **Make** | GNU Make | Task automation (Makefile-based commands) |
| **PHPUnit** | 11.5 | PHP unit/integration testing |
| **Playwright** | 1.57 | End-to-end testing |
| **PHPStan** | 2.1 | Static analysis (Level 8) |
| **PHP-CS-Fixer** | 3.92 | Code style enforcement |
| **Rector** | 2.3 | Automated refactoring |
| **GitHub Actions** | N/A | CI/CD pipeline |
| **Adminer** | Latest | Visual database management (dev only) |
| **MailPit** | Latest | Email testing (dev/test only) |

---

## 3. Development Environment

### 3.1 Prerequisites

**Required Software:**
- Docker Engine 20.10+
- Docker Compose 2.0+
- Make (optional but highly recommended)
- Git 2.30+

**Optional (for local development without Docker):**
- PHP 8.4 (with extensions listed above)
- Node.js 20+ & npm 10+
- MariaDB 11 or MySQL 8+
- Redis 7+

---

### 3.2 Docker Architecture

**Environment Configurations:**

```
docker/
├── common/              # Shared configs (MariaDB initialization)
├── dev/                 # Development environment
│   ├── docker-compose.yaml
│   ├── docker-compose.override.yaml  # macOS-specific overrides
│   ├── php/
│   │   ├── Dockerfile
│   │   └── php.ini
│   └── nginx/
│       ├── nginx.conf
│       └── default.conf
├── test/                # Isolated testing environment
│   └── docker-compose.yaml
└── prod/                # Production configuration
    ├── docker-compose.yaml
    ├── .env.example
    └── README.md
```

**Container Services:**

| Container | Image | Exposed Ports (dev) | Purpose |
|-----------|-------|---------------------|---------|
| **php_dev** | Custom (PHP 8.4-FPM) | 9000 | Application runtime |
| **nginx_dev** | nginx:alpine | 80 | Web server, reverse proxy |
| **mariadb_dev** | mariadb:11 | 3306 | Database |
| **redis_dev** | redis:7-alpine | 6379 | Cache (future use) |
| **node_watch** | node:20-alpine | 5173 | Vite dev server (HMR) |
| **mailpit_dev** | axllent/mailpit | 8025 (UI), 1025 (SMTP) | Email testing |
| **adminer_dev** | adminer:latest | 8080 | Database UI |

**Test Environment (Ports):**
- Web: `8081`
- Database: `5433`
- Redis: `6380`

---

### 3.3 PHP Configuration

**File:** `docker/dev/php/php.ini`

```ini
[PHP]
memory_limit = 512M
upload_max_filesize = 100M
post_max_size = 100M
max_execution_time = 300

[Date]
date.timezone = Europe/Madrid

[OPcache]
opcache.enable = 1
opcache.memory_consumption = 128
opcache.max_accelerated_files = 10000
opcache.validate_timestamps = 1  # Disable in production for performance
```

**Key Settings:**
- **Memory Limit**: 512MB (allows large invoice PDF generation)
- **Upload Max**: 100MB (future: patient document uploads)
- **Timezone**: Europe/Madrid (Spain)
- **OPcache**: Enabled (significant performance boost)

---

### 3.4 Nginx Configuration

**File:** `docker/dev/nginx/default.conf`

**Key Directives:**
```nginx
server {
    listen 80;
    server_name localhost;
    root /var/www/html/public;

    location / {
        try_files $uri /index.php$is_args$args;
    }

    location ~ ^/index\.php(/|$) {
        fastcgi_pass php_dev:9000;
        fastcgi_split_path_info ^(.+\.php)(/.*)$;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        fastcgi_param DOCUMENT_ROOT $realpath_root;
        internal;
    }

    location ~ \.php$ {
        return 404;
    }

    # Vite HMR (dev only)
    location /@vite {
        proxy_pass http://node_watch:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

**Production Differences:**
- Remove `/@vite` proxy (static assets served directly)
- Add HTTPS redirect
- Add HSTS header
- Add gzip compression
- Add static asset caching headers

---

### 3.5 Environment Variables

**File:** `.env` (committed, default values)

**Critical Variables:**
```bash
APP_ENV=dev                                  # dev, test, prod
APP_DEBUG=1                                  # 1 (dev/test), 0 (prod)
APP_SECRET=change_this_in_production         # Random string, SECRET in prod

DATABASE_URL="mysql://physiotherapy_user:physiotherapy_pass@mariadb:3306/physiotherapy_db?serverVersion=mariadb-11.0.0&charset=utf8mb4"

REDIS_URL=redis://redis:6379

MAILER_DSN=smtp://mailpit:1025               # Prod: smtp://smtp.sendgrid.net:587

JWT_SECRET_KEY=%kernel.project_dir%/config/jwt/private.pem
JWT_PUBLIC_KEY=%kernel.project_dir%/config/jwt/public.pem
JWT_PASSPHRASE=your_jwt_passphrase           # MUST be secret in prod
JWT_TOKEN_TTL=2419200                        # 28 days
```

**File:** `.env.dev.local` (gitignored, local overrides)

**Company Customization:**
```bash
COMPANY_NAME="Your Clinic Name"
COMPANY_TAX_ID="12345678A"
COMPANY_ADDRESS_LINE1="Street Address"
COMPANY_ADDRESS_LINE2="City, ZIP, Country"
COMPANY_PHONE="+34 000 000 000"
COMPANY_EMAIL="info@yourclinic.com"
COMPANY_WEB="www.yourclinic.com"
COMPANY_LOGO_PATH="/logo.png"          # Place logo in public/
```

**Frontend Variables (Vite):**
```bash
VITE_DEFAULT_LOCALE=es                        # Default language (es, en)
VITE_CALENDAR_FIRST_DAY=1                     # 0 = Sunday, 1 = Monday
VITE_CALENDAR_SLOT_DURATION_MINUTES=60        # Visual slot height
VITE_DEFAULT_APPOINTMENT_DURATION=60          # Minutes
VITE_CALENDAR_NARROW_SATURDAY=true            # Narrow weekend columns
VITE_CALENDAR_NARROW_SUNDAY=true
VITE_CALENDAR_WEEKEND_WIDTH_PERCENT=50        # Weekend column width %
VITE_CALENDAR_SCROLL_TIME=08:00:00            # Initial calendar scroll position
VITE_INVOICE_EDIT_ENABLED=true                # Enable invoice editing

# Working hours per day (for gap generation)
CALENDAR_SLOTS_MONDAY="09:00-10:00,10:00-11:00,11:00-12:00,12:00-13:00,14:00-15:00,15:00-16:00"
CALENDAR_SLOTS_TUESDAY="09:00-10:00,10:00-11:00,11:00-12:00,15:00-16:00"
CALENDAR_SLOTS_WEDNESDAY="09:00-10:00,10:00-11:00,11:00-12:00,12:00-13:00,14:00-15:00,15:00-16:00"
CALENDAR_SLOTS_THURSDAY="09:00-10:00,10:00-11:00,11:00-12:00,15:00-16:00"
CALENDAR_SLOTS_FRIDAY="09:00-10:00,10:00-11:00,11:00-12:00,12:00-13:00,14:00-15:00,15:00-16:00"
```

**Vite and Symfony Environment File Sharing:**

**CRITICAL**: Vite and Symfony share the same `.env` files to ensure consistency. Vite modes are configured to match Symfony environment names.

**Configuration in `package.json`:**
```json
{
  "scripts": {
    "dev": "vite --mode dev",
    "build": "vite build --mode prod"
  }
}
```

**Environment File Loading Order (highest priority last):**

1. `.env` - Base configuration (default values)
2. `.env.local` - Local overrides (not committed)
3. `.env.dev` - Development (Symfony: `APP_ENV=dev`, Vite: `--mode dev`)
4. `.env.dev.local` - Development local overrides
5. `.env.prod` - Production (Symfony: `APP_ENV=prod`, Vite: `--mode prod`)
6. `.env.prod.local` - Production local overrides
7. `.env.test` - Testing
8. `.env.test.local` - Testing local overrides

**Important Rules:**

- Default values → `.env` (e.g., `VITE_CALENDAR_FIRST_DAY=0` for Sunday)
- Environment overrides → `.env.dev`, `.env.prod` (e.g., `VITE_CALENDAR_FIRST_DAY=1` for Monday)
- Backend variables (`APP_ENV`, `DATABASE_URL`) → Symfony only
- Frontend variables (`VITE_*`) → Injected at **build time** into JavaScript
- Changes to `VITE_*` require **recompilation** (`npm run build`)
- **Never use** `.env.development` or `.env.production` - use `.env.dev` and `.env.prod`

**Variable Referencing Pattern (Avoiding Duplication):**

Define base values without `VITE_` prefix, then reference them in `VITE_*` variables:

```bash
# .env (base)
CALENDAR_FIRST_DAY=0                              # Base: Sunday
VITE_CALENDAR_FIRST_DAY="${CALENDAR_FIRST_DAY}"  # References base

# .env.dev.local (development)
CALENDAR_FIRST_DAY=1  # Override to Monday → automatically updates VITE_*

# .env.prod (production)
CALENDAR_FIRST_DAY=1  # Override to Monday → automatically updates VITE_*
```

**Complete Example:**
```bash
# .env
MAX_APPOINTMENT_DURATION=10
DEFAULT_APPOINTMENT_DURATION=60
CALENDAR_FIRST_DAY=0
CALENDAR_NARROW_SATURDAY=true
APP_TITLE=MyPhysio
DEFAULT_LOCALE=en

# Vite variables reference base values
VITE_MAX_APPOINTMENT_DURATION="${MAX_APPOINTMENT_DURATION}"
VITE_DEFAULT_APPOINTMENT_DURATION="${DEFAULT_APPOINTMENT_DURATION}"
VITE_CALENDAR_FIRST_DAY="${CALENDAR_FIRST_DAY}"
VITE_CALENDAR_NARROW_SATURDAY="${CALENDAR_NARROW_SATURDAY}"
VITE_APP_TITLE="${APP_TITLE}"
VITE_DEFAULT_LOCALE="${DEFAULT_LOCALE}"
```

**Benefits:**
- Single source of truth
- No duplication
- Override once, affects both Symfony and Vite
- Reduces configuration errors

When running `npm run build --mode prod`, Vite loads `.env`, then `.env.prod`, resolves all `${}` references, and compiles the final values into the bundle.

**Security Notes:**
- ⚠️ **NEVER commit** `.env.local`, `.env.*.local` files (contain secrets)
- ✅ **Rotate secrets** before production deployment
- ✅ **Use long random strings** for APP_SECRET (minimum 32 characters)
- ✅ **Strong passphrase** for JWT keys (minimum 16 characters)

---

## 4. Build & Deployment Processes

### 4.1 Backend Build (Symfony)

**Install Dependencies:**
```bash
composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev
```

**Generate Optimized Autoloader:**
```bash
composer dump-autoload --optimize --classmap-authoritative
```

**Clear & Warm Cache:**
```bash
php bin/console cache:clear --env=prod
php bin/console cache:warmup --env=prod
```

**Generate JWT Keys:**
```bash
php bin/console lexik:jwt:generate-keypair --skip-if-exists
```

**Run Database Migrations:**
```bash
php bin/console doctrine:migrations:migrate --no-interaction
```

**Production Checklist:**
- [ ] `APP_ENV=prod`
- [ ] `APP_DEBUG=0`
- [ ] Secure `APP_SECRET` generated
- [ ] JWT keys generated with strong passphrase
- [ ] Database credentials secured (not default values)
- [ ] Redis connection configured
- [ ] Mailer DSN configured (not MailPit)

---

### 4.2 Frontend Build (React + Vite)

**Install Dependencies:**
```bash
npm ci  # Clean install from package-lock.json
```

**Dump Exposed Routes (FOSJsRoutingBundle):**
```bash
php bin/console fos:js-routing:dump --format=json --target=assets/routing/routes.json
```

**Build Production Assets:**
```bash
npm run build
```

**Output:**
- Directory: `public/build/`
- Files: Hashed bundles (`app-{hash}.js`, `app-{hash}.css`)
- Manifest: `public/build/manifest.json` (used by Symfony to resolve asset paths)

**Production Optimizations:**
- Minification (JavaScript + CSS)
- Tree-shaking (unused code removed)
- Code splitting (NOT yet implemented - single bundle currently)
- Asset fingerprinting (cache busting)

---

### 4.3 Docker Production Build

**Build PHP Image:**
```bash
docker buildx build \
  --platform linux/amd64 \
  --cache-from type=registry,ref=yourregistry/physiotherapy-php:cache \
  --cache-to type=registry,ref=yourregistry/physiotherapy-php:cache,mode=max \
  -t yourregistry/physiotherapy-php:latest \
  -f docker/prod/php/Dockerfile \
  docker/prod/php
```

**Start Production Stack:**
```bash
docker compose -f docker/prod/docker-compose.yaml up -d
```

**Post-Deployment:**
```bash
# Run migrations
docker compose exec php_prod php bin/console doctrine:migrations:migrate --no-interaction

# Verify health
docker compose exec php_prod php bin/console about
```

---

## 5. Database Management

### 5.1 Migrations

**Create New Migration:**
```bash
make db-migration-create
# OR
php bin/console make:migration
```

**Apply Migrations:**
```bash
make db-migrate
# OR
php bin/console doctrine:migrations:migrate --no-interaction
```

**Rollback Migration:**
```bash
php bin/console doctrine:migrations:migrate prev
```

**Migration Best Practices:**
- ✅ **Test rollback** before production deployment
- ✅ **Backup database** before migration
- ✅ **Review SQL** generated by migration (avoid destructive operations)
- ❌ **Never edit** executed migrations (create new migration instead)

---

### 5.2 Fixtures (Test Data)

**Load Fixtures:**
```bash
make db-fixtures
# OR
php bin/console doctrine:fixtures:load --no-interaction
```

**Fixture Classes:**
- `UserFixtures.php`: Creates admin user (email: `tina@tinafisio.com`, password: `password`)
- Additional fixtures for patients, appointments (if needed)

**Use Case:**
- Development: Seed database with sample data
- Testing: Reset database to known state

---

### 5.3 Database Validation

**Validate Schema:**
```bash
make db-validate
# OR
php bin/console doctrine:schema:validate
```

**Check Mapping:**
- Ensures entity annotations match database schema
- Detects drift between code and database

---

## 6. Testing Infrastructure

### 6.1 Backend Testing (PHPUnit)

**Run Tests:**
```bash
make test
# OR
php bin/phpunit
```

**Configuration:** `phpunit.dist.xml`

**Test Types:**
- **Unit Tests**: `tests/Unit/` (domain logic, services)
- **Functional Tests**: `tests/Functional/` (API endpoints, integration)

**Coverage Report:**
```bash
make test-coverage
# Generates HTML report: var/coverage/index.html
```

**Best Practices:**
- ✅ Test business logic in isolation (unit tests)
- ✅ Test API endpoints with real database (functional tests)
- ✅ Use Fixtures for consistent test data
- ❌ Do NOT mock domain entities (test real behavior)

---

### 6.2 Frontend Testing (Playwright E2E)

**Run All E2E Tests:**
```bash
make test-e2e
# OR
npx playwright test
```

**Run Single Test:**
```bash
make test-e2e file=tests/e2e/patients-create.spec.ts
# OR
npx playwright test tests/e2e/patients-create.spec.ts
```

**Run in UI Mode (Debug):**
```bash
make test-e2e-ui
# OR
npx playwright test --ui
```

**Configuration:** `playwright.config.cjs`

**Test Strategy:**
- **Critical Workflows**: Login, patient creation, appointment scheduling, invoice generation
- **Data Management**: Each test resets database via `/api/test/reset-db` endpoint
- **Assertions**: Role-based selectors (accessible name), not CSS classes

**Example Test:**
```javascript
test('create patient successfully', async ({ page }) => {
  // Reset database to clean state
  await page.request.post('http://localhost:8081/api/test/reset-db-empty');

  // Login
  await page.goto('http://localhost:8081/');
  await page.getByRole('textbox', { name: 'Email' }).fill('tina@tinafisio.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('password');
  await page.getByRole('button', { name: 'Login' }).click();

  // Navigate to patient form
  await page.getByRole('link', { name: 'Patients' }).click();
  await page.getByRole('button', { name: 'New Patient' }).click();

  // Fill form
  await page.getByRole('textbox', { name: 'First Name' }).fill('John');
  await page.getByRole('textbox', { name: 'Last Name' }).fill('Doe');
  await page.getByRole('button', { name: 'Save' }).click();

  // Verify success
  await expect(page.getByText('Patient created successfully')).toBeVisible();
});
```

---

### 6.3 CI/CD Pipeline (GitHub Actions)

**File:** `.github/workflows/ci.yml`

**Jobs:**
1. **Backend Tests**
   - Build PHP Docker image (with cache)
   - Start services (MariaDB, Redis)
   - Install Composer dependencies
   - Generate JWT keys
   - Setup database (drop, create, fixtures)
   - Run PHPUnit
   - Run PHPStan (continue-on-error)
   - Run PHP-CS-Fixer (continue-on-error)

2. **E2E Tests** (depends on backend-tests)
   - Build PHP Docker image
   - Start services
   - Install Composer + npm dependencies
   - Cache Playwright browsers
   - Generate JWT keys
   - Setup database with fixtures
   - Dump exposed routes
   - Build frontend assets (Vite)
   - Install Playwright browsers
   - Run Playwright tests
   - Upload test reports + screenshots (on failure)

**Caching Strategy:**
- Docker layers (BuildKit cache)
- Composer `vendor/` (keyed by `composer.lock`)
- npm `node_modules/` (automatic via `setup-node` action)
- Playwright browsers (keyed by `package-lock.json`)

**Performance:**
- Cold build: ~10-15 minutes
- Cached build: ~5-8 minutes

---

## 7. Code Quality Standards

### 7.1 PHPStan (Static Analysis)

**Level:** 8 (maximum)

**Run:**
```bash
make phpstan
# OR
vendor/bin/phpstan analyse src --level=8
```

**Configuration:** `phpstan.neon`

**Key Rules:**
- No `mixed` types allowed
- All method return types declared
- All parameter types declared
- No unused variables/imports
- Strict comparison (`===`, not `==`)

**PHPStan Extensions:**
- `phpstan/phpstan-doctrine`: Doctrine-specific rules
- `phpstan/phpstan-symfony`: Symfony-specific rules

---

### 7.2 PHP-CS-Fixer (Code Style)

**Ruleset:** Symfony standard + `declare(strict_types=1)` enforcement

**Check:**
```bash
make cs-check
# OR
vendor/bin/php-cs-fixer fix --dry-run --diff
```

**Fix:**
```bash
make cs-fix
# OR
vendor/bin/php-cs-fixer fix
```

**Configuration:** `.php-cs-fixer.dist.php`

**Key Rules:**
- Symfony coding standard
- `declare(strict_types=1)` at top of every PHP file
- No trailing whitespace
- PSR-12 compliance
- Import optimization

---

### 7.3 Rector (Automated Refactoring)

**Dry Run:**
```bash
make rector
# OR
vendor/bin/rector process --dry-run
```

**Apply:**
```bash
make rector-fix
# OR
vendor/bin/rector process
```

**Configuration:** `rector.php`

**Rulesets:**
- PHP 8.4 compatibility checks
- Symfony 7.x upgrade rules
- Code quality improvements
- Type declarations

---

### 7.4 Git Workflow & Commit Standards

**Commit Message Format:** [Conventional Commits](https://www.conventionalcommits.org/)

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Build process, dependencies
- `perf`: Performance improvements
- `ci`: CI/CD changes
- `build`: Build system changes

**Examples:**
```
feat(patient): add fuzzy search capability

Implements accent-insensitive and typo-tolerant search using MariaDB UNACCENT function and SOUNDEX.

Closes #42

🤖 Generated with Claude Code
Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

```
fix(invoice): prevent duplicate invoice numbers

Added database unique constraint on invoice number field.

Fixes #58
```

**Maximum Line Length:** 200 characters

---

## 8. Operational Procedures

### 8.1 Local Development Workflow

**Daily Workflow:**
```bash
# Start environment
make dev-up

# Watch frontend (HMR)
# (node_watch container auto-starts with Vite dev server)

# Work on features...

# Run tests before commit
make test
make test-e2e

# Check code quality
make cs-fix
make phpstan

# Commit changes
git add .
git commit -m "feat(scope): description"

# Stop environment (optional)
make dev-down
```

**Database Reset (when needed):**
```bash
make db-reset  # Drops, creates, migrates, loads fixtures
```

---

### 8.2 Production Deployment Checklist

**Pre-Deployment:**
1. ✅ All tests passing (CI/CD green)
2. ✅ Security audit completed
3. ✅ Environment variables configured (`.env.prod.local`)
4. ✅ Database backup taken
5. ✅ Rollback plan documented

**Deployment Steps:**
1. Build Docker images (with production Dockerfile)
2. Push images to registry
3. Pull images on production server
4. Stop old containers
5. Start new containers
6. Run database migrations
7. Clear cache
8. Verify health (`/api/health` endpoint - if configured)
9. Monitor logs for errors

**Post-Deployment:**
1. Smoke test critical workflows (login, patient search, invoice generation)
2. Monitor error rates (Sentry, logs)
3. Monitor performance (APM, response times)
4. Announce deployment to users

**Rollback Procedure:**
1. Revert database migrations (if needed)
2. Start previous Docker image version
3. Clear cache
4. Verify rollback successful
5. Investigate failure root cause

---

### 8.3 Backup & Restore

**Backup (Manual):**
```bash
# Database backup
docker compose exec mariadb mysqldump -u physiotherapy_user -p physiotherapy_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Application files (if needed)
tar -czf app_backup_$(date +%Y%m%d).tar.gz src/ config/ public/ composer.json composer.lock
```

**Restore:**
```bash
# Database restore
docker compose exec -T mariadb mysql -u physiotherapy_user -p physiotherapy_db < backup_20251230_120000.sql

# Verify data integrity
docker compose exec mariadb mysql -u physiotherapy_user -p physiotherapy_db -e "SELECT COUNT(*) FROM patients;"
```

⚠️ **Production Requirement:** Automate backups via cron or managed database service.

---

## 9. Troubleshooting Guide

### 9.1 Common Issues

**Issue:** Docker containers fail to start
**Symptoms:** `docker compose up` exits with error
**Resolution:**
```bash
# Check logs
docker compose logs

# Clean and rebuild
make dev-clean
make dev-build
make dev-up
```

---

**Issue:** Permission denied errors in PHP container
**Symptoms:** `var/log/`, `var/cache/` write errors
**Resolution:**
```bash
# Access PHP container
make dev-shell-php

# Fix permissions
chown -R www-data:www-data var/
chmod -R 775 var/
```

---

**Issue:** Database connection refused
**Symptoms:** `SQLSTATE[HY000] [2002] Connection refused`
**Resolution:**
```bash
# Check MariaDB status
docker compose ps mariadb_dev

# Wait for health check
timeout 90s bash -c 'until [ "$(docker inspect -f {{.State.Health.Status}} dev_physiotherapy_mariadb)" == "healthy" ]; do sleep 3; done'

# Restart MariaDB
docker compose restart mariadb_dev
```

---

**Issue:** Frontend hot reload not working
**Symptoms:** Changes to React files not reflected in browser
**Resolution:**
```bash
# Check node_watch container logs
make dev-watch-logs

# Verify Vite dev server running on port 5173
curl http://localhost:5173

# Restart node_watch
docker compose restart node_watch
```

---

**Issue:** JWT token invalid
**Symptoms:** 401 Unauthorized on API calls after login
**Resolution:**
```bash
# Regenerate JWT keys
php bin/console lexik:jwt:generate-keypair --overwrite

# Clear cache
php bin/console cache:clear

# Verify keys exist
ls -la config/jwt/
```

---

## 10. Performance Tuning

### 10.1 PHP Optimizations

**OPcache Settings (Production):**
```ini
opcache.enable=1
opcache.memory_consumption=256
opcache.interned_strings_buffer=16
opcache.max_accelerated_files=20000
opcache.validate_timestamps=0  # Disable in prod (static code)
opcache.revalidate_freq=0
```

**PHP-FPM Tuning:**
```ini
pm = dynamic
pm.max_children = 50
pm.start_servers = 10
pm.min_spare_servers = 10
pm.max_spare_servers = 20
pm.max_requests = 500
```

---

### 10.2 Database Optimizations

**Indexing:**
```sql
-- Existing indexes (already in migrations)
CREATE INDEX idx_patients_full_name ON patients(full_name);
CREATE INDEX idx_appointments_starts_at ON appointments(starts_at);
CREATE INDEX idx_invoices_number ON invoices(number);

-- Future indexes (if performance issues)
CREATE INDEX idx_patients_status ON patients(status);
CREATE INDEX idx_appointments_user_id_starts_at ON appointments(user_id, starts_at);
```

**Query Optimization:**
- ✅ Use EXPLAIN to analyze slow queries
- ✅ Avoid SELECT * (specify columns)
- ✅ Use LIMIT for pagination
- ✅ Eager load relationships (avoid N+1)

---

### 10.3 Frontend Optimizations

**Code Splitting (Future):**
```javascript
// Lazy load heavy components
const Calendar = lazy(() => import('./components/Calendar'));
const InvoiceForm = lazy(() => import('./components/invoices/InvoiceForm'));
```

**Image Optimization:**
- Compress company logo (TinyPNG, ImageOptim)
- Use WebP format (with PNG fallback)
- Lazy load images below fold

**Bundle Analysis:**
```bash
npm run build -- --mode analyze
# Generates bundle size report
```

---

**Document End**
