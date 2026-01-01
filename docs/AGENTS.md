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
7. **Health Check Validation**: After completing any task, verify that the application root URL ("/") returns HTTP 200. This ensures the application boots correctly and no configuration errors were introduced.

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

### Frontend Routing (FOSJsRoutingBundle)
To avoid hardcoding API URLs in React and maintain security by not exposing all backend routes, we use `friendsofsymfony/jsrouting-bundle`.

**Strategy:**
1.  **Expose Routes**: Only specific routes are exposed to the frontend.
    -   Add `options: ['expose' => true]` to your Route attribute in Controller or YAML.
    -   For named routes (e.g. API Platform), add the route name to `config/packages/fos_js_routing.yaml` under `routes_to_expose`.
2.  **Generate JSON**: The frontend consumes a JSON file containing the route definitions.
    -   Run `make dump-routes` (or `php bin/console fos:js-routing:dump ...`) to regenerate `assets/routing/routes.json`.
    -   **Important**: You must run this command whenever you change an exposed route or add a new one.
3.  **Usage in React**:
    -   Import the initialized router: `import Routing from '../../routing/init';`
    -   Generate URLs: `Routing.generate('route_name', { param: 'value' })`
    -   Example: `Routing.generate('invoice_export', { id: 123, format: 'pdf' })`

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
- `make build-assets`: Full asset build (Composer + npm + Vite + Routes).
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
- Authentication: JWT (stateless - no sessions)

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

## Operational Guidelines

### Environment Variables Documentation

**CRITICAL**: Whenever you add, modify, or remove a variable in `.env`, you **MUST** update the documentation in `README.md`.

**Process:**

1. **Adding a new variable**:
   - Add the variable to `.env` with a descriptive comment
   - Document it in the appropriate section of `README.md` under "Environment Configuration"
   - Include the variable name, description, possible values, and examples
   - Explain its purpose and impact on the application

2. **Modifying an existing variable**:
   - Update the variable value in `.env`
   - Update the corresponding documentation in `README.md`
   - Ensure examples reflect the new values or behavior

3. **Removing a variable**:
   - Remove the variable from `.env`
   - Remove or update the corresponding documentation in `README.md`
   - Check if any code references need to be removed or updated

**Documentation Sections in README.md:**

Variables should be documented in the following sections:
- **Environment Configuration** → General environment variables
- **Calendar Configuration** → Calendar-related variables (`CALENDAR_*`, `VITE_CALENDAR_*`)
- **Invoice Configuration** → Invoice and company-related variables (`COMPANY_*`)
- **Database Configuration** → Database-related variables (`DATABASE_*`)
- Custom sections as needed for specific features

### Vite and Symfony Shared Environment Files

**CRITICAL**: Vite and Symfony share the **same `.env` files** to ensure consistency across frontend and backend configurations.

**Configuration:**

In `package.json`, Vite modes are configured to match Symfony environment names:
```json
{
  "scripts": {
    "dev": "vite --mode dev",
    "build": "vite build --mode prod"
  }
}
```

**Environment File Loading Order:**

Both Symfony and Vite follow this hierarchy (highest priority last):

1. `.env` - Base configuration (default values)
2. `.env.local` - Local overrides (not committed to git)
3. `.env.dev` - Development environment (Symfony: `APP_ENV=dev`, Vite: `--mode dev`)
4. `.env.dev.local` - Development local overrides (highest priority for dev)
5. `.env.prod` - Production environment (Symfony: `APP_ENV=prod`, Vite: `--mode prod`)
6. `.env.prod.local` - Production local overrides (highest priority for prod)
7. `.env.test` - Testing environment
8. `.env.test.local` - Testing local overrides

**Important Rules:**

- **Default values** should always be in `.env` (e.g., `VITE_CALENDAR_FIRST_DAY=0` for Sunday)
- **Environment-specific values** override defaults in `.env.dev`, `.env.prod`, etc. (e.g., `VITE_CALENDAR_FIRST_DAY=1` for Monday)
- **Backend variables** (`APP_ENV`, `DATABASE_URL`) are for Symfony only
- **Frontend variables** (`VITE_*`) are injected into JavaScript at **build time** by Vite
- Changes to `VITE_*` variables **require recompilation** (`npm run build`) to take effect
- Never use `.env.development` or `.env.production` - use `.env.dev` and `.env.prod` instead

**Example:**

```bash
# .env (base - default to Sunday)
VITE_CALENDAR_FIRST_DAY=0

# .env.dev.local (development - override to Monday)
VITE_CALENDAR_FIRST_DAY=1

# .env.prod (production - override to Monday)
VITE_CALENDAR_FIRST_DAY=1
```

When you run `npm run build`, Vite loads `.env` first, then `.env.prod`, resulting in `VITE_CALENDAR_FIRST_DAY=1` being compiled into the JavaScript bundle.

### Entity & Database Management

- **Named Constructors**: Whenever you add, modify, or remove a field in a table/entity, you **MUST** review and update:
    1. The named constructors (e.g., `create()`) in the Entity class.
    2. The `__construct()` method of the Entity.
    3. Ensure they accept **all necessary fields** (typically `NOT NULL` fields without default values) to create a valid entity state.
- **Named Arguments**: Use **PHP 8+ named arguments** when calling constructors or static factory methods (e.g., `create()`). This improves readability, reduces errors with optional parameters, and makes the code self-documenting.
    - *Example*: `Customer::create(firstName: $firstName, lastName: $lastName)` instead of `Customer::create($firstName, $lastName)`.
- **Doctrine Lifecycle Events**: **DO NOT** use Doctrine lifecycle events like `#[ORM\PreUpdate]`, `#[ORM\PrePersist]`, or `#[ORM\HasLifecycleCallbacks]`. All updates to derived fields (like `fullName`) or timestamps (like `updatedAt`) **MUST** be handled manually in the Application layer (e.g., in Processors, Services, or specific Entity methods called by the application).
- **API Resource Pattern**: **ALWAYS** use a separate Resource DTO class (located in `src/Infrastructure/Api/Resource/`) instead of exposing Doctrine Entities directly as API resources if the entity has a private constructor.
    - The API Platform `Provider` must map the Entity to the Resource DTO.
    - The API Platform `Processor` must map the Resource DTO back to the Entity using its named constructor (e.g., `create()`).
    - This ensures Domain encapsulation while keeping API Platform functional.
- **Default Values**: When a string value is unknown or missing, use an **empty string** `''` instead of placeholders like `'Unknown'`, `'N/A'`, or `'Pending'`, unless `null` is explicitly required and supported by the schema.

### Frontend Development

#### TypeScript Requirement
- **MANDATORY**: Always use **TypeScript** (`.ts`, `.tsx`) for all new frontend components and logic.
- Define proper interfaces in `assets/types/index.ts` for all entities and API responses.

#### API & Routing Management
- **Route Exposure**: For all new Symfony routes (including API Platform resources) that need to be accessed from React, you **MUST**:
    1. Explicitly name the operations in the entity (e.g., `new GetCollection(name: 'api_entity_collection')`).
    2. Add the route name to `config/packages/fos_js_routing.yaml` under `routes_to_expose`.
    3. Execute `make dump-routes` to regenerate `assets/routing/routes.json`.
- **Usage**: Always use the `Routing` helper in React (e.g., `Routing.generate('route_name', { id: 1 })`) instead of hardcoding URLs.

#### Race Condition Prevention in Forms

**CRITICAL**: All form components that load data asynchronously **MUST** prevent race conditions by disabling form inputs during data loading.

**Implementation Requirements:**

When creating or modifying form components that fetch data (e.g., edit forms):

1. **Disable all form inputs during loading**:
   - Add `disabled={loading}` (or combined loading states like `disabled={loading || loadingPatient}`) to all `<input>`, `<textarea>`, and `<select>` elements
   - This prevents users from modifying fields while data is being fetched or submitted

2. **Add visual feedback for disabled state**:
   - Append loading CSS classes to input className: `${loading ? 'opacity-50 cursor-not-allowed' : ''}`
   - This provides clear visual indication that the form is processing
   - Use consistent styling: `opacity-50` for transparency and `cursor-not-allowed` for cursor feedback

3. **Combine multiple loading states when necessary**:
   - If your form has multiple async operations (e.g., `loading`, `loadingPatient`, `loadingCustomer`), create a combined state:
     ```typescript
     const isLoading = loading || loadingPatient || loadingCustomer;
     ```
   - Use this combined state for disabling inputs and buttons

4. **Disable action buttons**:
   - Submit buttons should use `disabled={loading}` or the combined loading state
   - Cancel/delete buttons should also be disabled during operations
   - Show loading spinners or text changes (e.g., "Saving..." instead of "Save")

**Example Implementation:**

```typescript
// Component with loading state
const [loading, setLoading] = useState<boolean>(false);

// Input field with disabled state and visual feedback
<input
    type="text"
    name="firstName"
    value={formData.firstName}
    onChange={handleChange}
    disabled={loading}
    className={`base-classes ${
        formErrors.firstName ? 'error-classes' : 'normal-classes'
    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
/>

// Submit button
<button
    type="submit"
    disabled={loading}
    className="base-button-classes"
>
    {loading ? t('saving') : t('save')}
</button>
```

**Why This Matters:**

- **Prevents data corruption**: Users can't overwrite data that's being loaded from the server
- **Prevents duplicate submissions**: Users can't click submit multiple times
- **Better UX**: Clear visual feedback about form state
- **Reliable E2E tests**: Playwright tests automatically wait for disabled inputs to become enabled before interacting with them

**Affected Components:**

All form components have been updated to follow this pattern:
- `CustomerForm.tsx`
- `PatientForm.tsx`
- `RecordForm.tsx`
- `InvoiceForm.tsx`

**When creating new forms**: Always implement this pattern from the start to prevent race conditions.

### Code Quality Standards

- **Efficiency**: Optimize database queries (avoid N+1) and minimize API payload sizes. Use serialization groups (`#[Groups]`) to control exposed data.
- **Security**:
    - Ensure all new endpoints are protected by appropriate access control in `security.yaml`.
    - Always validate input data on the backend using Symfony Constraints.
    - Handle 401/403/422 errors gracefully in the UI.
- **Style**: Mimic the existing Tailwind CSS patterns. Use localized messages for all user-facing strings including server-side validation messages.
- **Clean Code**:
    - **Guard Clauses**: Use early returns/guard clauses whenever possible to reduce nesting and improve readability. Avoid large `if` blocks wrapping entire function bodies.
    - **DRY**: Re-use components and logic where appropriate.
    - **Naming**: Use descriptive, intention-revealing names for variables, functions, and classes.

### Task Completion Checklist

**CRITICAL**: Before marking any task as complete, you **MUST** verify:

#### 1. Translations
- Check if the new feature adds any UI text (buttons, labels, messages, errors, tooltips, etc.)
- Add translations for both English (`en`) and Spanish (`es`) in the translation system
- Ensure all user-facing text is internationalized
- Test that translations appear correctly in both languages

#### 2. Functionality Verification
- Test that the implementation works as expected
- Verify that no steps were skipped during implementation
- Check that all edge cases are handled
- Ensure error messages are user-friendly and translated
- Confirm that the feature integrates correctly with existing functionality

#### 3. Code Quality
- Remove debug code (console.log, error_log, etc.) unless intentionally needed
- Clean up commented-out code
- Ensure proper error handling
- Verify that all imports are used
- Check for any TODO comments that should be addressed

#### 4. Documentation
- Update README.md if new environment variables were added
- Document any new API endpoints or significant changes
- Update AGENTS.md if new patterns or guidelines should be followed

### General Guidelines

- Always maintain consistency between `.env` and documentation
- Use clear, descriptive variable names
- Include sensible default values
- Group related variables together
- Add comments in `.env` to explain complex variables
- Keep the README documentation user-friendly and comprehensive

**Remember**:
- Undocumented variables create confusion and maintenance issues. Always keep the documentation up to date!
- Untranslated text creates a poor user experience. Always add translations for all user-facing text!
- Incomplete testing leads to bugs. Always verify functionality before completing a task!

## Next Steps
1. Install Symfony 7.4 in the project
2. Configure DDD structure (Application, Domain, Infrastructure)
3. Define specific bounded contexts
4. Identify main aggregates
5. Design key domain events
6. Establish API contracts (endpoints)
7. Configure Event Store

## Notes
- All DB and code nomenclature in **English**
- Prioritize simplicity over premature complexity
- Event Sourcing applied where it provides real value
- Testing from the start (TDD when possible)
- Complete documentation in [README.md](../README.md)
- **REMEMBER**: Everything in this project (code, comments, documentation, commit messages, etc.) MUST be in English
