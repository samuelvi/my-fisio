# AGENTS.md - Physiotherapy Clinic Management System

> **IMPORTANT**: All code, documentation, comments, database schema, API endpoints, and any project-related content MUST be written in **English**. This is a strict requirement for consistency and collaboration.

## Agent Persona & Workflow
You act as an **Advanced Senior Full-Stack Engineer** specializing in **PHP (Symfony)** and **React**. You adhere to the highest standards of software craftsmanship, Clean Code, and industry best practices.

**Operational Mandate:**
Upon completing any assigned task, you must strictly **review and validate** your work against the original request. Ensure that:
1. All requirements have been met.
2. No details were overlooked.
3. The solution is robust, tested (if applicable), and consistent with the project's architecture.
4. You have not left any "loose ends" or temporary code unless explicitly agreed upon.
5. **Documentation Review**: You check if `README.md`, `AGENTS.md`, or `Makefile` need updates to reflect the changes made.
6. **Self-Correction**: You explicitly verify that the task was executed correctly and completely, ensuring nothing was missed before declaring completion.

**Docker Compose Multi-Environment Policy:**
When working with Docker infrastructure (`docker-compose.yaml` files), you MUST review and update ALL environment configurations:
- **Development**: `docker/dev/docker-compose.yaml`
- **Testing**: `docker/test/docker-compose.yaml`
- **Production**: `docker/prod/docker-compose.yaml`

Changes to one environment (e.g., adding a volume, environment variable, or service configuration) should be evaluated for applicability across all environments. This ensures consistency and prevents environment-specific bugs.

## Overview
Responsive web application to manage a physiotherapy clinic with modern decoupled architecture.

## Testing Agent
See [AGENTS_TESTING.md](./AGENTS_TESTING.md) for testing conventions and UI validation rules.

## Technology Stack

### Frontend
- **Framework**: React 18+
- **Styling**: Tailwind CSS (Utility-first)
- **Build Tool**: Vite
- **State Management**: Context API / TanStack Query (React Query)
- **HTTP Client**: Axios
- **UI**: Headless UI / Radix UI + Tailwind
- **Development**: HMR (Hot Module Replacement) for real-time updates

### Backend
- **Framework**: Symfony 7.4
- **PHP**: 8.4 (PHP-FPM)
- **Architecture**: DDD (Domain-Driven Design) with Event Sourcing
- **API**: RESTful (JSON)
- **Authentication**: JWT (LexikJWTAuthenticationBundle)
- **Database**: PostgreSQL 16
- **Cache/Sessions**: Redis 7
- **Event Store**: For Event Sourcing
- **Web Server**: Nginx (Alpine)

### Development
- **Containerization**: Docker + Docker Compose
- **Email Testing**: MailPit (SMTP + Web UI)
- **Management**: Makefile with useful commands

### Code Quality & Static Analysis
- **PHPStan**: Level 8 analysis. Requires `tests/object-manager.php` and `tests/console-application.php` for Symfony/Doctrine context.
- **PHP CS Fixer**: Enforces Symfony coding standards and `declare(strict_types=1)`.
- **Initialization Pattern**: All API Resources (DTOs) MUST initialize mandatory string properties to avoid "uninitialized property" crashes during validation.

### Testing Strategy
- **E2E Verification**: Combined UI assertions with raw database counts via `GET /api/test/stats` to bypass frontend filters/pagination during verification.
- **Database Reset**: Use `/api/test/reset-db-empty` for a clean slate (0 patients) or `/api/test/reset-db` for a standard dataset (15 patients).

### Backend Layers
```
src/
├── Application/        # Use cases, DTOs, Application services
├── Domain/            # Entities, Value Objects, Events, Repositories (interfaces)
│   ├── Entity/        # Domain Entities
│   ├── Event/         # Domain Events
│   └── Repository/    # Repository interfaces
├── Infrastructure/    # Concrete implementations, persistence, Event Store
│   ├── Persistence/   # Doctrine, migrations
│   │   └── Repository/  # Concrete repository implementations
│   ├── EventStore/    # Event Store implementation
│   └── Api/           # Controllers, serializers
│       └── Controller/  # HTTP Controllers (NOT in src/Controller/)
└── Shared/            # Shared code between contexts
```

**IMPORTANT - Controller Location**:
- Controllers MUST be placed in `src/Infrastructure/Api/Controller/` (DDD compliance).
- DO NOT create controllers directly in `src/Controller/` (Symfony default).
- Controllers are infrastructure concerns that expose domain logic via HTTP.
- Use route attributes with full namespace to avoid conflicts.

### Bounded Contexts (to be defined as needed)
- **Patient Management**: Patient management
- **Appointment Scheduling**: Appointments
- **Treatment Management**: Treatments
- **Billing**: Invoicing and billing
- **User Management**: Users and staff

## Development Principles

### Backend
- Explicit Commands and Events
- Aggregates as consistency boundaries
- Event Sourcing: state rebuilt from events
- CQRS: read/write separation using Symfony Messenger buses (`command.bus`, `query.bus`).
- Repositories only in domain layer (interfaces)
- **Doctrine & Performance Standards**:
    - **No UnitOfWork Cache**: To ensure absolute data freshness, all read queries MUST bypass Doctrine's Identity Map.
        - Use `getArrayResult()` exclusively for data fetching (it ignores the UOW and Identity Map).
        - If a sequential process requires high consistency after multiple writes, call `$entityManager->clear()` to purge the UnitOfWork.
    - **Native Queries**: Use `QueryBuilder` for all interactions. Magic methods like `find()` or `findBy()` are prohibited.
    - Efficient Fetching: Always use `getArrayResult()` for data fetching.
    - Mapping: Manually map array results to specialized DTOs (Read model) or Entities.
- **Repository Pattern & Dependency Injection**:
    - **NO EntityManager in Controllers or API Resources**: Controllers MUST NOT inject `EntityManagerInterface` directly.
    - **Repository Interfaces**: All database queries MUST be encapsulated in repository methods defined in `Domain/Repository/` interfaces.
    - **Repository Implementations**: Concrete implementations belong in `Infrastructure/Persistence/Repository/`.
    - **Custom Query Methods**: Every query needs its own named method (e.g., `findPatientForInvoicePrefill(int $id): ?Patient`). NO generic `find()` or `findBy()` magic methods.
    - **QueryBuilder Only**: All repository methods MUST use QueryBuilder, never magic methods.
    - **Example Structure**:
        ```php
        // Domain/Repository/PatientRepositoryInterface.php
        interface PatientRepositoryInterface {
            public function findPatientForInvoicePrefill(int $id): ?Patient;
        }

        // Infrastructure/Persistence/Repository/PatientRepository.php
        class PatientRepository implements PatientRepositoryInterface {
            public function findPatientForInvoicePrefill(int $id): ?Patient {
                $qb = $this->createQueryBuilder('p')
                    ->where('p.id = :id')
                    ->setParameter('id', $id);
                $result = $qb->getQuery()->getArrayResult();
                return $result ? Patient::fromArray($result[0]) : null;
            }
        }
        ```
- **Encapsulation & Named Constructors**: 
    - All `__construct` methods MUST be `private` for Entities, DTOs, and Value Objects.
    - Use `named constructors` (static factory methods like `public static function create(...)`) for instantiation. 
    - *Note 1*: Framework-managed Services (Controllers, Commands, Processors, Providers) are exempt to maintain Autowiring compatibility.
    - *Note 2*: **API Platform Resources** (classes in `src/Infrastructure/Api/Resource/`) are exempt. They MUST have a `public __construct` and be instantiated via `new` to ensure proper serialization and API Platform compatibility.
- Dependency Injection with Symfony
- **Dependency Management (Composer)**:
    - **CRITICAL**: `composer.lock` MUST be committed to the repository.
    - **Reason**: Ensures reproducible builds across all environments (dev, test, prod, CI/CD).
    - **Never ignore**: Do NOT add `composer.lock` to `.gitignore`.
    - **Updates**: When updating dependencies, commit the updated `composer.lock` file.
    - **CI/CD**: Pipelines rely on `composer.lock` to install exact versions, avoiding "works on my machine" issues.
- **Pagination Strategy**: Implement the **N+1 Fetch Pattern** for all collection endpoints.
    - **Operation**: Fetch `N+1` records from the database when `N` items are requested per page.
    - **Indicator**: Use the `N+1` record as a signal to enable the "Next" button in the UI.
    - **Performance**: Eliminates costly `COUNT(*)` queries and reduces database load by ~50% (one query instead of two).
    - **Scalability**: Ensures constant time performance regardless of dataset size.
- **Multi-language Support (Server-Side Injection)**: 
    - **Strategy**: Synchronous injection of the translation catalog from Symfony to React.
    - **Implementation**: `DefaultController` extracts messages from YAML files and exposes them via `window.APP_TRANSLATIONS`.
    - **Why**: Eliminates async API calls, prevents 401 errors on the login screen, and ensures instant UI rendering with the correct locale.
    - **Context**: Managed via `LanguageContext` in React using a `t()` helper function.
    - **Config**: Default locale is driven by `VITE_DEFAULT_LOCALE` but persisted in `localStorage`.

### Frontend
- Functional Components with Hooks
- Presentational/Container separation
- Centralized API services
- Responsive design (mobile-first)

## Form Validation Best Practices

### React (Frontend)
- **Validate early**: apply basic checks (required fields, format, min/max) in the UI before submitting.
- **Keep errors close to fields**: show error messages next to the relevant input, not only globally.
- **Do not re-mount inputs**: define input components outside the render scope to avoid losing focus.
- **Reuse validators**: extract validation helpers to keep form logic consistent across screens.
- **Normalize data**: trim strings, coerce numeric fields, and normalize dates before sending.
- **Prefer backend as source of truth**: frontend validation is for UX; always validate again on the backend.

### Symfony (Backend)
- **Validate all writes**: enforce constraints on create/update even if the client validates.
- **Return explicit reasons**: use clear, machine-readable error codes for field-level errors.
- **Avoid silent coercion**: reject invalid formats (e.g., malformed invoice numbers) rather than guessing.
- **Consistency rules**: validate sequence constraints (e.g., invoice numbers) against persisted data.
- **Use named constructors**: keep entities encapsulated and instantiate via factories.

## Testing Rules
- **UI tests must click by accessible name**: use role/name selectors for buttons and links; never click by `id` or `class`.
- **Appointments slot validation**: assert only date + hour/minute; ignore seconds and timezone offsets.

## Git Workflow
- **Commit Messages**: Must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.
    - Format: `type(scope): subject`
    - **Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`, `revert`.
    - **Length**: Maximum 200 characters per line.
    - **Example**: `feat(patient): add patient registration form`
- **Automation Restrictions**:
    - **NO Automatic Commits**: You MUST NOT perform `git commit` without explicit user approval for each specific change set.
    - **NO Automatic Pushes**: You MUST NOT perform `git push` under any circumstances unless explicitly requested by the user.
    - **Workflow**: Propose the commit message and show the `git diff`, then wait for the user to authorize the execution.

## Naming Conventions

### Database (English)
- Tables: `snake_case` plural (e.g., `patients`, `appointments`)
- Fields: `snake_case` (e.g., `first_name`, `created_at`)
- Foreign keys: `{singular_table}_id` (e.g., `patient_id`)
- Timestamps: `created_at`, `updated_at`

### Code
- **Backend PHP**: PascalCase for classes, camelCase for methods
- **Doctrine Entities**: 
    - NO fluid interfaces.
    - NO traditional setters and getters. Use **PHP 8.4 Property Hooks**.
- **Imports**: Always import classes/interfaces (`use`) instead of using fully qualified names inside the code.
- **Attributes**: Use `#[Override]` without the leading backslash (e.g., `#[Override]` instead of `#[\Override]`), as `Override` is a global class in the root namespace.
- **Frontend React**: PascalCase for components, camelCase for functions
- **Events**: `{Entity}{Action}Event` (e.g., `PatientRegisteredEvent`)
- **Commands**: `{Action}{Entity}Command` (e.g., `RegisterPatientCommand`)

## Event Structure
Each event must contain:
- `eventId`: Unique UUID
- `aggregateId`: Aggregate ID
- `occurredOn`: Timestamp
- `eventData`: Event payload

## Development Environment

### Docker Setup
The project uses Docker Compose with **separate configurations for each environment**:

**Environments:**
- **Development** (`docker/dev/`): Local development with debugging tools, exposed ports, and volume mounts
- **Testing** (`docker/test/`): E2E testing environment with isolated database and services
- **Production** (`docker/prod/`): Optimized configuration with security hardening and resource limits

**Configured services:**
- **PHP-FPM 8.4**: Container with necessary extensions (pgsql, redis, intl, opcache, etc.)
- **PostgreSQL 16**: Main database with automatic extension initialization
- **Redis 7**: Cache and session management
- **Nginx**: Web server configured for Symfony
- **MailPit** (dev/test only): Email capture for testing (UI at http://localhost:8025)
- **Adminer** (dev only): Visual database management (UI at http://localhost:8080)

**Directory structure:**
```
docker/
├── common/
│   └── postgres/
│       ├── 01-init-extensions.sql  # PostgreSQL extensions (unaccent, pg_trgm, fuzzystrmatch)
│       └── README.md               # Extension initialization docs
├── dev/
│   ├── docker-compose.yaml     # Development configuration
│   ├── php/
│   │   ├── Dockerfile          # Custom PHP image
│   │   └── php.ini            # PHP configuration
│   └── nginx/
│       ├── nginx.conf         # Nginx general configuration
│       └── default.conf       # Symfony site configuration
├── test/
│   └── docker-compose.yaml     # Testing configuration (isolated DB)
└── prod/
    ├── docker-compose.yaml     # Production configuration (hardened)
    ├── .env.example           # Production environment template
    └── README.md              # Production deployment guide
```

**Main commands (via Makefile):**

**Setup & Lifecycle (Dev)**
- `make dev-install`: Complete project setup (Build, Up, Init, DB).
- `make dev-quick-start`: Fast start if already initialized.
- `make dev-up` / `make dev-down`: Start/Stop services.
- `make dev-restart`: Restart all services.
- `make dev-logs`: Tail logs (optional: `service=php`).
- `make dev-clean`: Destroy containers and volumes.

**Development**
- `make dev-shell-php`: Access PHP container shell.
- `make dev-shell-db`: Access PostgreSQL shell.
- `make dev-shell-redis`: Access Redis CLI.
- `make composer cmd="..."`: Run Composer (e.g., `cmd="require symfony/mailer"`).
- `make symfony cmd="..."`: Run Symfony Console (e.g., `cmd="make:controller"`).
- `make cache-clear`: Clear application cache.

**Database**
- `make db-migrate`: Apply migrations.
- `make db-collation`: Ensure the `case_insensitive` collation exists (required for patient search fields).
- `make db-migration-create`: Generate new migration.
- `make db-fixtures`: Load test data.
- `make db-reset`: Full reset (Drop -> Create -> Migrate -> Fixtures).
- `make db-validate`: Validate Doctrine schema.
- Note: `make db-create` runs `db-collation` automatically.

**Quality & Testing**
- `make test`: Run PHPUnit tests.
- `make test-coverage`: Run tests with HTML coverage report.
- `make phpstan`: Run static analysis (Level 8).
- `make cs-check` / `make cs-fix`: Check/Fix coding style (PHP-CS-Fixer).
- `make rector`: Run automated refactoring (dry-run).

See `make help` for complete command list.

### Exposed Ports
- **80**: Web application (Nginx)
- **5432**: PostgreSQL
- **6379**: Redis
- **8025**: MailPit Web UI
- **1025**: MailPit SMTP

### PHP Configuration
- Memory limit: 512M
- Upload max: 100M
- Timezone: Europe/Madrid
- OPcache: Enabled
- Session handler: Redis

## Testing Strategy

### Environment Separation
- **DEV**: Uses `docker/dev/docker-compose.yaml` (Ports 80/5432). Contains persisted data for manual testing.
- **TEST**: Uses `docker/test/docker-compose.yaml` (Ports 8081/5433). Volatile environment, reset on every test run.

### End-to-End (E2E)
- **Tool**: Playwright.
- **Location**: `tests/e2e/`.
- **Data Management**: 
    - `TestController` exposes `POST /api/test/reset-db`.
    - **Persistence**: DO NOT reset the database automatically in tests unless explicitly requested. Leave data as is for manual inspection after execution.
    - **Generic Data**: Loaded via Doctrine Fixtures (Admin User).
    - **Specific Data**: Handled via Zenstruck Foundry Factories or API calls within the test.

### Unit/Integration
- **Tool**: PHPUnit.
- **Location**: `tests/Functional/`, `tests/Unit/`.
- **Config**: `phpunit.dist.xml`.

## CI/CD Pipeline Strategy

### Infrastructure Awareness
When creating or modifying CI/CD pipelines (GitHub Actions, Bitbucket Pipelines, GitLab CI, etc.), you MUST consider the project's infrastructure and optimize for performance:

**Current Project Infrastructure:**
- **Database**: MariaDB 11 (NOT PostgreSQL) with `utf8mb4_unicode_ci` collation
- **PHP**: 8.4 with specific extensions (pdo_mysql, redis, intl, opcache)
- **Cache**: Redis 7
- **Frontend**: React 18 + Vite (requires build step)
- **Containerization**: Docker Compose with separate test environment (`docker/test/`)
- **Testing**: PHPUnit + Playwright E2E

### Intelligent Caching Strategy

**MANDATORY**: All pipelines MUST implement multi-layer caching to optimize build times and reduce resource consumption.

#### 1. Docker Layer Cache
```yaml
# GitHub Actions Example
- name: Cache Docker layers
  uses: actions/cache@v4
  with:
    path: /tmp/.buildx-cache
    key: ${{ runner.os }}-buildx-${{ github.sha }}
    restore-keys: |
      ${{ runner.os }}-buildx-

- name: Build with cache
  run: |
    docker buildx build \
      --cache-from type=local,src=/tmp/.buildx-cache \
      --cache-to type=local,dest=/tmp/.buildx-cache-new,mode=max \
      --load -t test-php_test:latest \
      -f docker/test/php/Dockerfile docker/test/php

    # Prevent cache bloat
    rm -rf /tmp/.buildx-cache
    mv /tmp/.buildx-cache-new /tmp/.buildx-cache
```

**Benefits**: Reduces build time from 3-5min to 30-60sec on subsequent runs.

#### 2. Composer Dependencies Cache
```yaml
- name: Cache Composer vendor
  uses: actions/cache@v4
  with:
    path: vendor
    key: ${{ runner.os }}-composer-${{ hashFiles('composer.lock') }}
    restore-keys: |
      ${{ runner.os }}-composer-
```

**Benefits**: Skips downloading unchanged dependencies (~1-2min saved).

#### 3. Node/npm Cache
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'  # Automatic npm cache

- name: Cache Playwright browsers
  uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
    key: ${{ runner.os }}-playwright-${{ hashFiles('package-lock.json') }}
```

**Benefits**: Avoids re-downloading browser binaries (~500MB, ~2min saved).

#### 4. Build Artifacts Cache
```yaml
- name: Build Assets (Vite)
  run: npm run build

# Cache for deployment pipelines
- name: Cache built assets
  uses: actions/cache@v4
  with:
    path: public/build
    key: ${{ runner.os }}-vite-${{ hashFiles('assets/**') }}
```

### Database Service Configuration

**CRITICAL**: Pipelines MUST wait for database health before running tests.

```yaml
# MariaDB Health Check (Current Project)
- name: Wait for Services
  run: |
    timeout 90s bash -c 'until [ "$(docker inspect -f {{.State.Health.Status}} test_physiotherapy_mariadb)" == "healthy" ]; do sleep 3; done'
    timeout 30s bash -c 'until [ "$(docker inspect -f {{.State.Health.Status}} test_physiotherapy_redis)" == "healthy" ]; do sleep 2; done'
```

**Common Mistake**: Using PostgreSQL commands (`pg_isready`) when the project uses MariaDB.

### Performance Optimizations

#### Memory Management
```yaml
- name: Install Composer Dependencies
  run: |
    docker compose -f docker/test/docker-compose.yaml exec -T php_test \
      php -d memory_limit=512M /usr/local/bin/composer install \
      --no-interaction --prefer-dist --optimize-autoloader --no-scripts
```

#### Parallel Execution
```yaml
# Run tests in parallel when possible
- name: Run PHPUnit Tests
  run: docker compose exec -T php_test php bin/phpunit --parallel

- name: Run Playwright E2E Tests
  run: npx playwright test --workers=2
```

#### Conditional Steps
```yaml
# Skip quality checks on draft PRs
- name: Run Quality Checks
  if: github.event.pull_request.draft == false
  continue-on-error: true
  run: |
    docker compose exec -T php_test vendor/bin/phpstan analyse src
```

### Bitbucket Pipelines Example
```yaml
pipelines:
  default:
    - step:
        name: Build & Test
        caches:
          - docker
          - composer
          - node
        services:
          - docker
        script:
          - docker buildx create --use
          - docker buildx build --cache-from type=registry,ref=$IMAGE_NAME:cache
            --cache-to type=registry,ref=$IMAGE_NAME:cache,mode=max
            --load -t test-php_test:latest docker/test/php
          - docker compose -f docker/test/docker-compose.yaml up -d
          - docker compose exec -T php_test composer install --optimize-autoloader
          - docker compose exec -T php_test php bin/phpunit

definitions:
  caches:
    composer: vendor
    node: node_modules
```

### Best Practices

1. **Always use BuildKit**: Set `DOCKER_BUILDKIT=1` for faster builds
2. **Cache invalidation**: Use content hashes (`composer.lock`, `package-lock.json`) not timestamps
3. **Fail fast**: Run linting/static analysis before expensive test suites
4. **Artifact retention**: Keep test reports/screenshots for 30 days maximum
5. **Resource limits**: Set timeouts to prevent hanging builds
6. **Environment isolation**: Use `docker/test/` environment, never pollute dev database

### Migration Notes

When adapting pipelines from other projects:
- **Check database type**: PostgreSQL vs MariaDB vs MySQL commands differ
- **Verify PHP extensions**: Match production requirements
- **Review cache paths**: Align with project structure
- **Test health checks**: Ensure service readiness detection works
- **Validate build context**: Docker build paths must match compose config

## Next Steps
1. Install Symfony 7.4 in the project
2. Configure DDD structure (Application, Domain, Infrastructure)
3. Define specific bounded contexts
4. Identify main aggregates
5. Design key domain events
6. Establish API contracts (endpoints)
7. 
7. Configure Event Store

## Notes
- All DB and code nomenclature in **English**
- Prioritize simplicity over premature complexity
- Event Sourcing applied where it provides real value
- Testing from the start (TDD when possible)
- Complete documentation in [README.md](../README.md)
- **REMEMBER**: Everything in this project (code, comments, documentation, commit messages, etc.) MUST be in English
