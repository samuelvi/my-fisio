# Installation Guide

This guide provides step-by-step instructions for setting up the Physiotherapy Clinic Management System.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Make (optional, but highly recommended)

## Quick Installation

### Option 1: Full Installation (Recommended for first-time setup)

This will build containers, initialize Symfony, install all packages, and set up the database.

```bash
make dev-install
```

This command executes the following steps:
1. Builds all Docker containers
2. Starts all services
3. Waits for MariaDB and Redis to be ready
4. Initializes Symfony 7.4 skeleton
5. Installs all Composer dependencies
6. Installs recommended packages (Redis Bundle, Broadway Event Store)
7. Creates and migrates the database
8. Displays success message with service URLs

### Option 2: Quick Start (When Symfony is already initialized)

If you already have Symfony initialized and just need to start the project:

```bash
make dev-quick-start
```

## Step-by-Step Installation

If you prefer to install components individually:

### 1. Build Docker Containers

```bash
make dev-build
```

### 2. Start All Services

```bash
make dev-up
```

### 3. Wait for Services

```bash
make wait-for-services
```

### 4. Install Composer Dependencies

```bash
make composer-install
```

### 5. Install Additional Packages

```bash
# Install all recommended packages
make install-all-packages

# Or install packages individually
make install-redis-bundle
make install-event-store
make install-api        # API Platform (optional)
```

### 6. Set Up Database

```bash
make db-setup
```

This will create the database, ensure the `case_insensitive` collation exists, and run all migrations.

## Installing Development Tools

### Code Quality Tools

Install all quality tools at once:

```bash
make quality-tools
```

Or install individually:

```bash
make phpstan-install      # Static analysis
make cs-fixer-install     # Code style fixer
make rector-install       # Automated refactoring
```

## Package Management

### Installing Packages

```bash
# Install a production package
make composer-require pkg="vendor/package-name"

# Install a development package
make composer-require-dev pkg="vendor/package-name"

# Examples:
make composer-require pkg="symfony/http-client"
make composer-require-dev pkg="symfony/debug-bundle"
```

### Removing Packages

```bash
make composer-remove pkg="vendor/package-name"
```

### Updating Packages

```bash
# Update all packages
make composer-update

# Update composer autoloader
make composer-dump-autoload
```

### Validating composer.json

```bash
make composer-validate
```

## Database Management

### Create Database

```bash
make db-create
```

This command also ensures the `case_insensitive` collation is available for patient search fields.

### Run Migrations

```bash
make db-migrate
```

### Create New Migration

```bash
make db-migration-create
```

### Load Fixtures (Test Data)

```bash
make db-fixtures
```

### Reset Database

This will drop, recreate, migrate, and load fixtures:

```bash
make db-reset
```

### Validate Schema

```bash
make db-validate
```

## Running the Application

Once installed, access the application at:

- **Application**: http://localhost
- **MailPit UI**: http://localhost:8025 (Email testing)
- **MariaDB**: localhost:3306
- **Redis**: localhost:6379

View all URLs:

```bash
make urls
```

## Container Access

### Access PHP Container

```bash
make dev-shell-php
```

### Access MariaDB Database

```bash
make dev-shell-db
```

### Access Redis CLI

```bash
make dev-shell-redis
```

## Symfony Commands

### Run Any Symfony Console Command

```bash
make symfony cmd="your:command"

# Examples:
make symfony cmd="debug:router"
make symfony cmd="make:controller HomeController"
make symfony cmd="make:entity Patient"
```

### Clear Cache

```bash
make cache-clear
```

### Warmup Cache

```bash
make cache-warmup
```

## Testing

### Run Tests

```bash
make test
```

### Run Tests with Coverage

```bash
make test-coverage
```

The coverage report will be available at `var/coverage/index.html`.

## Code Quality

### Run PHPStan (Static Analysis)

```bash
make phpstan
```

### Check Code Style

```bash
make cs-check
```

### Fix Code Style

```bash
make cs-fix
```

### Run Rector (Dry Run)

```bash
make rector
```

### Apply Rector Changes

```bash
make rector-fix
```

### Run All Quality Checks

```bash
make quality-check
```

## Troubleshooting

### Services Not Starting

```bash
# Check logs
make dev-logs

# Or check specific service
make dev-logs service=php
make dev-logs service=mariadb
```

### Permission Issues

```bash
# Access PHP container and fix permissions
make dev-shell-php
chown -R www-data:www-data var/
```

### Database Connection Issues

```bash
# Check MariaDB status
make dev-ps

# Restart MariaDB
docker-compose -f docker/dev/docker-compose.yaml restart mariadb
```

### Reset Everything

If you need to start fresh:

```bash
# Stop and remove all containers and volumes
make dev-clean

# Rebuild and reinstall
make dev-install
```

## Environment Configuration

### Environment Variables

Edit `.env` file to configure environment variables:

```bash
# Database
DATABASE_URL="mysql://user:pass@mariadb:3306/db?serverVersion=mariadb-11.0.0&charset=utf8mb4"

# Redis
REDIS_URL=redis://redis:6379

# Mailer (MailPit for development)
MAILER_DSN=smtp://mailpit:1025

# Application
APP_ENV=dev
APP_DEBUG=1
APP_SECRET=your_secret_here
```

### Local Overrides

Create `.env.local` for local overrides (this file is gitignored):

```bash
cp .env .env.local
# Edit .env.local with your local settings
```

## Next Steps

After installation:

1. **Create Your First Controller**:
   ```bash
   make symfony cmd="make:controller HomeController"
   ```

2. **Create Entities**:
   ```bash
   make symfony cmd="make:entity Patient"
   ```

3. **Generate Migrations**:
   ```bash
   make db-migration-create
   ```

4. **Run Migrations**:
   ```bash
   make db-migrate
   ```

5. **Install Code Quality Tools**:
   ```bash
   make quality-tools
   ```

## Getting Help

View all available commands:

```bash
make help
```

For more information, see:
- [README.md](../README.md) - General project information
- [AGENTS.md](./AGENTS.md) - Architecture and conventions
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Database schema documentation
