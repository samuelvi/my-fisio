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

### Frontend
- **Framework**: React 18+
- **Design**: Responsive-first (Mobile, Tablet, Desktop)
- **HTTP Client**: Axios

### Architecture
- **DDD** (Domain-Driven Design)
- **Event Sourcing**
- **CQRS** (Command Query Responsibility Segregation)
- **API**: RESTful / GraphQL

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
make install
```

This command will:
1. Build all Docker images
2. Start all containers
3. Install Composer dependencies
4. Create and migrate the database

### Basic Commands

```bash
# Start all services
make up

# Stop all services
make down

# Restart all services
make restart

# View logs from all services
make logs

# View logs from a specific service
make logs service=php
```

## Available Services

Once the containers are started, you will have access to:

| Service | URL/Port | Description |
|---------|----------|-------------|
| Application | http://localhost | Main web application |
| MailPit UI | http://localhost:8025 | Web interface for development emails |
| PostgreSQL | localhost:5432 | Main database |
| Redis | localhost:6379 | Cache and session storage |

View all available URLs:
```bash
make urls
```

## Container Management

### Container Access

```bash
# Access PHP container
make shell-php

# Access PostgreSQL
make shell-db

# Access Redis CLI
make shell-redis
```

### View Container Status

```bash
# View running containers
make ps

# View logs in real-time
make logs
```

## Symfony Development

### Composer

```bash
# Install dependencies
make composer cmd="install"

# Add a package
make composer cmd="require symfony/mailer"

# Update dependencies
make composer cmd="update"
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

```bash
# Run tests
make test

# Run tests with coverage
make test-coverage
```

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
make clean

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
make logs

# Rebuild containers
make clean
make build
make up
```

### File permission errors

```bash
# Access PHP container and adjust permissions
make shell-php
chown -R www-data:www-data var/
```

### Database not responding

```bash
# Check container status
make ps

# Restart PostgreSQL
docker-compose -f docker/dev/docker-compose.yaml restart postgres
```

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
