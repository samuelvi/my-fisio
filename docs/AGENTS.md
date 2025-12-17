# AGENTS.md - Physiotherapy Clinic Management System

> **IMPORTANT**: All code, documentation, comments, database schema, API endpoints, and any project-related content MUST be written in **English**. This is a strict requirement for consistency and collaboration.

## Overview
Responsive web application to manage a physiotherapy clinic with modern decoupled architecture.

## Technology Stack

### Frontend
- **Framework**: React 18+
- **Style**: Responsive-first (Mobile, Tablet, Desktop)
- **State**: Context API / Redux (to be defined)
- **HTTP Client**: Axios
- **UI**: Modular and reusable components

### Backend
- **Framework**: Symfony 7.4
- **PHP**: 8.4 (PHP-FPM)
- **Architecture**: DDD (Domain-Driven Design) with Event Sourcing
- **API**: RESTful / GraphQL (to be defined)
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
│   ├── Model/         # Aggregates and Entities
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
- CQRS: read/write separation
- Repositories only in domain layer (interfaces)
- Dependency Injection with Symfony

### Frontend
- Functional Components with Hooks
- Presentational/Container separation
- Centralized API services
- Responsive design (mobile-first)

## Naming Conventions

### Database (English)
- Tables: `snake_case` plural (e.g., `patients`, `appointments`)
- Fields: `snake_case` (e.g., `first_name`, `created_at`)
- Foreign keys: `{singular_table}_id` (e.g., `patient_id`)
- Timestamps: `created_at`, `updated_at`

### Code
- **Backend PHP**: PascalCase for classes, camelCase for methods
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
- `make install`: Complete project installation
- `make up`: Start containers
- `make down`: Stop containers
- `make shell-php`: Access PHP container
- `make symfony cmd="..."`: Run Symfony commands
- `make composer cmd="..."`: Run Composer commands
- `make db-reset`: Reset complete database

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
