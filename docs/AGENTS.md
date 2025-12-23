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

## Overview
Responsive web application to manage a physiotherapy clinic with modern decoupled architecture.

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

## DDD + Event Sourcing Architecture

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
│   ├── EventStore/    # Event Store implementation
│   └── Api/           # Controllers, serializers
└── Shared/            # Shared code between contexts
```

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
- **Encapsulation & Named Constructors**: 
    - All `__construct` methods MUST be `private` for Entities, DTOs, and Value Objects.
    - Use `named constructors` (static factory methods like `public static function create(...)`) for instantiation. 
    - *Note*: Framework-managed Services (Controllers, Commands, Processors, Providers) are exempt to maintain Autowiring compatibility.
- Dependency Injection with Symfony
- **Pagination Strategy**: Implement the **N+1 Fetch Pattern** for all collection endpoints.
    - **Operation**: Fetch `N+1` records from the database when `N` items are requested per page.
    - **Indicator**: Use the `N+1` record as a signal to enable the "Next" button in the UI.
    - **Performance**: Eliminates costly `COUNT(*)` queries and reduces database load by ~50% (one query instead of two).
    - **Scalability**: Ensures constant time performance regardless of dataset size.

### Frontend
- Functional Components with Hooks
- Presentational/Container separation
- Centralized API services
- Responsive design (mobile-first)

## Git Workflow
- **Commit Messages**: Must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.
    - Format: `type(scope): subject`
    - **Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`, `revert`.
    - **Length**: Maximum 200 characters per line.
    - **Example**: `feat(patient): add patient registration form`

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
The project uses Docker Compose for the development environment:

**Configured services:**
- **PHP-FPM 8.4**: Container with necessary extensions (pgsql, redis, intl, opcache, etc.)
- **PostgreSQL 16**: Main database
- **Redis 7**: Cache and session management
- **Nginx**: Web server configured for Symfony
- **MailPit**: Email capture for testing (UI at http://localhost:8025)
- **Adminer**: Visual database management (UI at http://localhost:8080)

**File location:**
```
docker/dev/
├── docker-compose.yaml       # Services configuration
├── php/
│   ├── Dockerfile            # Custom PHP image
│   └── php.ini              # PHP configuration
└── nginx/
    ├── nginx.conf           # Nginx general configuration
    └── default.conf         # Symfony site configuration
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
- `make db-migration-create`: Generate new migration.
- `make db-fixtures`: Load test data.
- `make db-reset`: Full reset (Drop -> Create -> Migrate -> Fixtures).
- `make db-validate`: Validate Doctrine schema.

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
