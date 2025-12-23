# Physiotherapy Clinic Management System

Comprehensive management system for physiotherapy clinics with modern architecture based on Domain-Driven Design (DDD) and Event Sourcing.

## Technology Stack

### Backend
- **Framework**: Symfony 7.4
- **PHP**: 8.4 (PHP-FPM)
- **Database**: PostgreSQL 16
- **Cache/Sessions**: Redis 7
- **Email Testing**: MailPit
- **Web Server**: Nginx
- **API**: RESTful (Symfony Controllers / API Platform)
- **Authentication**: JWT (JSON Web Tokens)

### Frontend
- **Framework**: React 18+
- **Styling**: Tailwind CSS
- **Build Tool**: Vite (with HMR)
- **HTTP Client**: Axios / TanStack Query
- **Architecture**: SPA (Single Page Application) embedded in Symfony

### Architecture
- **DDD** (Domain-Driven Design)
- **Event Sourcing**
- **CQRS** (Command Query Responsibility Segregation)
- **API-First Approach**

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Make (optional, but recommended)

## Quick Start

### Complete Installation

```bash
# Clone the repository
git clone <repository-url>
cd New3

# Automatic installation (build, start and configure)
make dev-install
```

This command will:
1. Build all Docker images
2. Start all containers
3. Install Composer dependencies
4. Create and migrate the database

### Basic Commands

```bash
# Start all services
make dev-up

# Stop all services
make dev-down

# Restart all services
make dev-restart

# View logs from all services
make dev-logs

# View logs from a specific service
make dev-logs service=php
```

## Available Services

Once the containers are started, you will have access to:

| Service | URL/Port | Description |
|---------|----------|-------------|
| Application | http://localhost | Main web application |
| MailPit UI | http://localhost:8025 | Web interface for development emails |
| Adminer | http://localhost:8080 | Visual database management |
| PostgreSQL | localhost:5432 | Main database |
| Redis | localhost:6379 | Cache and session storage |

### Adminer Login Credentials

To manage the database through Adminer, use:
- **System**: `PostgreSQL`
- **Server**: `postgres`
- **Username**: `physiotherapy_user`
- **Password**: `physiotherapy_pass`
- **Database**: `physiotherapy_db`

View all available URLs:
```bash
make urls
```

## Production Considerations

When deploying to a production environment, ensure the following steps are taken:

### Environment Variables
The `.env` file must be properly configured for production. Never use development secrets or database credentials in production. Key variables to review include:
- `APP_ENV=prod`
- `APP_SECRET`
- `DATABASE_URL`
- `JWT_SECRET_KEY`, `JWT_PUBLIC_KEY`, and `JWT_PASSPHRASE`
- `REDIS_URL`

### Assets
- **Favicon**: Ensure `public/favicon.ico` is the desired icon for your production site.
- **Build**: Assets must be built for production using `npm run build`.

## Container Management

### Container Access

```bash
# Access PHP container
make dev-shell-php

# Access PostgreSQL
make dev-shell-db

# Access Redis CLI
make dev-shell-redis
```

### View Container Status

```bash
# View running containers
make dev-ps

# View logs in real-time
make dev-logs
```

## Symfony Development

### Composer

```bash
# Install dependencies
make composer-install

# Add a package
make composer-require pkg="symfony/mailer"

# Update dependencies
make composer-update
```

### Symfony Console

```bash
# Clear cache
make cache-clear

# Run any Symfony command
make symfony cmd="debug:router"
make symfony cmd="make:controller"
make symfony cmd="list"
```

## Database Management

### Migrations

```bash
# Create the database
make db-create

# Run migrations
make db-migrate

# Create new migration
make db-migration-create

# Validate schema
make db-validate
```

### Fixtures

```bash
# Load test data
make db-fixtures
```

### Complete Reset

```bash
# Reset database (drop, create, migrate, fixtures)
make db-reset
```

## Testing

### Unit & Functional Tests (PHPUnit)

```bash
# Run tests
make test

# Run tests with coverage
make test-coverage
```

### End-to-End Tests (Playwright)

We use a separate Docker environment for E2E tests to avoid polluting the development database.

**Infrastructure:**
- **Web**: http://localhost:8081
- **DB**: Port 5433

**Commands:**

```bash
# Start Test Environment
make test-up

# Run E2E Tests (Headless)
make test-e2e

# Run E2E Tests (UI Mode)
make test-e2e-ui

# Stop Test Environment
make test-down
```

**Data Strategy:**
- Each E2E test resets the database automatically via `/api/test/reset-db` endpoint.
- Base fixtures (Admin user) are loaded on reset.
- Specific scenarios use Factories within the test logic.

The coverage report will be generated in `var/coverage/index.html`.

## Project Architecture

```
src/
├── Application/        # Use cases, DTOs, Application services
├── Domain/            # Entities, Value Objects, Events, Repositories
│   ├── Entity/        # Domain Entities
│   ├── Event/         # Domain Events
│   └── Repository/    # Repository interfaces
├── Infrastructure/    # Concrete implementations, persistence
│   ├── Persistence/   # Doctrine, migrations
│   ├── EventStore/    # Event Store implementation
│   └── Api/           # Controllers, serializers
└── Shared/            # Shared code between contexts
```

### Bounded Contexts

- **Patient Management**: Patient management
- **Appointment Scheduling**: Appointment system
- **Treatment Management**: Treatment management
- **Billing**: Invoicing and billing
- **User Management**: User and staff management

For more details about the architecture, see [docs/AGENTS.md](docs/AGENTS.md).

## Code Conventions

### Database (English)
- Tables: `snake_case` plural (e.g., `patients`, `appointments`)
- Fields: `snake_case` (e.g., `first_name`, `created_at`)
- Foreign keys: `{singular_table}_id` (e.g., `patient_id`)

### Code
- **Backend PHP**: PascalCase for classes, camelCase for methods.
- **Doctrine Entities**: 
    - NO fluid interfaces (setters should not return `$this`).
    - NO traditional setters and getters. Use **PHP 8.4 Property Hooks** to manage property access and logic.
- **CQRS & DDD**: 
    - Separate read/write concerns using dedicated buses.
    - Repositories must use `QueryBuilder` and `getArrayResult()`.
    - Manual mapping from arrays to DTOs/Entities is required to prevent lazy loading and optimize performance.
- **Imports**: Always import classes/interfaces (`use App\Class;`) instead of using fully qualified names (`\App\Class`) inside the code.
- **Frontend React**: PascalCase for components, camelCase for functions.
- **Events**: `{Entity}{Action}Event` (e.g., `PatientRegisteredEvent`)
- **Commands**: `{Action}{Entity}Command` (e.g., `RegisterPatientCommand`)

## Environment Configuration

### Environment Variables

Environment variables are managed in `docker/dev/docker-compose.yaml`:

```yaml
DATABASE_URL=postgresql://physiotherapy_user:physiotherapy_pass@postgres:5432/physiotherapy_db
REDIS_URL=redis://redis:6379
APP_ENV=dev
APP_DEBUG=1
```

### PHP

Custom PHP configuration is located in `docker/dev/php/php.ini`:
- Memory limit: 512M
- Upload max filesize: 100M
- Session handler: Redis
- Timezone: Europe/Madrid

## Cleanup and Maintenance

```bash
# Stop and remove volumes
make dev-clean

# Clean Symfony cache and logs
make clean-cache
```

## Help and Available Commands

```bash
# View all available commands
make help
```

## Troubleshooting

### Containers don't start

```bash
# Check logs
make dev-logs

# Rebuild containers
make dev-clean
make dev-build
make dev-up
```

### File permission errors

```bash
# Access PHP container and adjust permissions
make dev-shell-php
chown -R www-data:www-data var/
```

### Database not responding

```bash
# Check container status
make dev-ps

# Restart PostgreSQL
docker-compose -f docker/dev/docker-compose.yaml restart postgres
```

## Technical Decisions

### Efficient Pagination (N+1 Fetch Pattern)
To ensure high performance even with large datasets, the system uses an optimized pagination strategy:
- **No `COUNT(*)` queries**: We avoid the overhead of counting the total records in the database.
- **N+1 Fetch**: We always request one extra record from the database. If that record exists, we know there is a next page.
- **Performance**: This reduces database load by approximately 50% per listing request and ensures scalability as the data grows.

## Customization

### Invoice Configuration

You can customize the invoice details and the company logo through the environment variables.

1.  **Company Details**: Edit `.env.dev.local` (or your environment-specific file) and update the keys under `###> invoice/company-details ###`.

    ```dotenv
    COMPANY_NAME="Your Company Name"
    COMPANY_TAX_ID="12345678A"
    COMPANY_ADDRESS_LINE1="Street 123"
    COMPANY_ADDRESS_LINE2="City, Country"
    COMPANY_PHONE="+34 000 000 000"
    COMPANY_EMAIL="info@example.com"
    COMPANY_WEB="www.example.com"
    ```

2.  **Company Logo**: 
    -   Place your logo file in the `private/` directory (e.g., `private/logo.png`).
    -   Update the `COMPANY_LOGO_PATH` variable in `.env.dev.local`:
        
        ```dotenv
        COMPANY_LOGO_PATH="private/logo.png"
        ```
    
    *Note: Files in `private/` are ignored by git (except `.gitkeep`), keeping your assets secure and local.*

## Contributing

1. All code must be in **English**
2. Follow established naming conventions
3. Apply SOLID and DDD principles
4. Write tests for new functionality
5. Document important changes

## License

[Specify license]

## Contact

[Contact information]