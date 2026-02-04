# System Architecture
## Physiotherapy Clinic Management System

**Document Version:** 1.0
**Last Updated:** December 30, 2025
**Classification:** Internal - Technical
**Owner:** Principal Software Architect

---

## 1. Introduction

### 1.1 Purpose

This document provides a comprehensive view of the system architecture, including logical layers, component responsibilities, data flows, integration points, and key architectural decisions. It serves as the definitive reference for engineering teams, security auditors, and infrastructure planners.

### 1.2 Architectural Principles

1. **Domain-Driven Design (DDD)**: Business logic encapsulated in domain entities; ubiquitous language enforced.
2. **Separation of Concerns**: Clear boundaries between Domain, Application, and Infrastructure layers.
3. **API-First**: Frontend and backend decoupled via RESTful JSON API.
4. **Statelessness**: Horizontal scaling enabled through stateless API design.
5. **Defense in Depth**: Multi-layer security (authentication, authorization, validation, encryption).
6. **Testability**: Architecture supports unit, integration, and E2E testing.
7. **Explicit over Implicit**: No "magic"; all dependencies injected, all decisions documented.

---

## 2. High-Level Architecture

### 2.1 Conceptual View

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT TIER                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  React 18 SPA (Vite-bundled)                               │ │
│  │  - Patient List, Calendar, Invoice Forms, Login            │ │
│  │  - Tailwind CSS (responsive mobile-first design)           │ │
│  │  - TanStack Router (client-side routing)                   │ │
│  │  - Axios (HTTP client to API)                              │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓  HTTPS (JSON)  ↑
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION TIER                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Nginx (Reverse Proxy + Static Assets)                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Symfony 7.4 Application (PHP-FPM 8.4)                     │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  Infrastructure Layer                                │  │ │
│  │  │  - API Controllers (HTTP endpoints)                  │  │ │
│  │  │  - API Platform Resources (DTOs)                     │  │ │
│  │  │  - State Processors/Providers (CRUD handlers)        │  │ │
│  │  │  - Doctrine Repositories (persistence)               │  │ │
│  │  │  - Serializers, Validators, Event Listeners          │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  Application Layer                                   │  │ │
│  │  │  - Query Handlers (read operations)                  │  │ │
│  │  │  - Command Handlers (write operations) [future]      │  │ │
│  │  │  - DTOs (InvoiceExportView, DashboardStatsView)      │  │ │
│  │  │  - Services (InvoiceNumberValidator, etc.)           │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  Domain Layer                                        │  │ │
│  │  │  - Entities (Patient, Appointment, Invoice, etc.)    │  │ │
│  │  │  - Value Objects (Enums: PatientStatus, etc.)        │  │ │
│  │  │  - Repository Interfaces (contracts)                 │  │ │
│  │  │  - Domain Services (EmptySlotGenerator, etc.)        │  │ │
│  │  │  - Factories (AppointmentFactory)                    │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓  SQL  ↑
┌─────────────────────────────────────────────────────────────────┐
│                        DATA TIER                                │
│  ┌────────────────────────────────────┬──────────────────────┐  │
│  │  MariaDB 11 (Relational DB)        │  Redis 7 (Cache)     │  │
│  │  - patients, appointments,         │  - Sessions          │  │
│  │    invoices, customers, records    │  - Cache (future)    │  │
│  │  - Users, counters                 │                      │  │
│  └────────────────────────────────────┴──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Deployment View

```
┌─────────────────────────────────────────────────────────────────┐
│  Docker Compose Environment (dev / test / prod)                 │
│  ┌────────────┬──────────────┬─────────────┬──────────────────┐│
│  │ nginx      │ php_fpm      │ mariadb     │ redis            ││
│  │ (Alpine)   │ (PHP 8.4)    │ (11.x)      │ (7.x Alpine)     ││
│  │ Port 80    │ Port 9000    │ Port 3306   │ Port 6379        ││
│  └────────────┴──────────────┴─────────────┴──────────────────┘│
│  ┌────────────┬──────────────┐                                  │
│  │ node_watch │ mailpit      │  (dev/test only)                 │
│  │ (Vite HMR) │ (SMTP mock)  │                                  │
│  └────────────┴──────────────┘                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Layer Breakdown (DDD Structure)

### 3.1 Domain Layer (`src/Domain/`)

**Responsibility:** Core business logic, independent of frameworks and infrastructure.

**Components:**

| Component | Purpose | Examples |
|-----------|---------|----------|
| **Entities** | Domain objects with identity | `Patient`, `Appointment`, `Invoice`, `Customer`, `Record`, `User` |
| **Value Objects** | Immutable objects defined by attributes | `PatientStatus` enum, `AppointmentType` enum |
| **Repository Interfaces** | Contracts for data access | `PatientRepositoryInterface`, `InvoiceRepositoryInterface` |
| **Domain Services** | Business logic that doesn't belong to entities | `EmptySlotGenerator`, `WeekGridBuilder` |
| **Factories** | Object creation logic | `AppointmentFactory` |

**Key Principles:**
- ✅ **No framework dependencies**: No Symfony/Doctrine annotations (except ORM mapping on entities)
- ✅ **Encapsulation**: Private constructors, named factory methods (`create()`)
- ✅ **Immutability where applicable**: Use `DateTimeImmutable`, readonly properties
- ⚠️ **Deviation from pure DDD**: Doctrine ORM attributes on entities (pragmatic choice for PHP)

**Example Entity Structure:**
```php
// src/Domain/Entity/Patient.php
namespace App\Domain\Entity;

#[ORM\Entity]
#[ORM\Table(name: 'patients')]
class Patient
{
    #[ORM\Id, ORM\GeneratedValue(strategy: 'IDENTITY'), ORM\Column(type: Types::INTEGER)]
    public ?int $id = null;

    #[ORM\Column(type: Types::STRING, length: 50, nullable: false)]
    public string $firstName;

    #[ORM\Column(type: Types::STRING, length: 100, nullable: false)]
    public string $lastName;

    // ... other properties

    #[ORM\Column(type: Types::DATE_IMMUTABLE, nullable: false)]
    public DateTimeInterface $createdAt;
}
```

**Rationale for Public Properties:**
- ✅ PHP 8.4 Property Hooks enable encapsulation without traditional getters/setters
- ✅ Reduces boilerplate code
- ⚠️ Deviates from classical DDD (entities typically have private properties + methods)

---

### 3.2 Application Layer (`src/Application/`)

**Responsibility:** Orchestrates domain objects to fulfill use cases; thin layer between API and Domain.

**Components:**

| Component | Purpose | Examples |
|-----------|---------|----------|
| **Query Handlers** | Read operations (CQRS read side) | `GetDashboardStatsHandler`, `GetInvoiceExportHandler` |
| **Command Handlers** | Write operations (CQRS write side) | **Not yet implemented** (write logic in State Processors currently) |
| **DTOs (Data Transfer Objects)** | Data structures for API responses | `InvoiceExportView`, `DashboardStatsView`, `InvoiceNumberGapsView` |
| **Application Services** | Cross-cutting logic | `InvoiceNumberValidator`, `EmptySlotCreator` |

**CQRS Implementation Status:**
- ✅ **Query Side**: Implemented via Symfony Messenger (`query.bus`)
- ⚠️ **Command Side**: Partially implemented (write operations in State Processors, not dedicated Command Handlers)

**Example Query Handler:**
```php
// src/Application/Query/Dashboard/GetDashboardStats/GetDashboardStatsHandler.php
namespace App\Application\Query\Dashboard\GetDashboardStats;

class GetDashboardStatsHandler implements MessageHandlerInterface
{
    public function __construct(
        private PatientRepositoryInterface $patientRepository,
        private AppointmentRepositoryInterface $appointmentRepository,
        private InvoiceRepositoryInterface $invoiceRepository
    ) {}

    public function __invoke(GetDashboardStatsQuery $query): DashboardStatsView
    {
        $totalPatients = $this->patientRepository->countAll();
        $totalAppointments = $this->appointmentRepository->countAll();
        $totalInvoices = $this->invoiceRepository->countAll();

        return DashboardStatsView::create(
            totalPatients: $totalPatients,
            totalAppointments: $totalAppointments,
            totalInvoices: $totalInvoices
        );
    }
}
```

---

### 3.3 Infrastructure Layer (`src/Infrastructure/`)

**Responsibility:** Framework-specific implementations, external integrations, persistence, HTTP.

**Components:**

| Subdirectory | Purpose | Examples |
|--------------|---------|----------|
| **Api/Controller** | HTTP endpoints | `DashboardController`, `DefaultController` (SPA entry) |
| **Api/Resource** | API Platform DTOs (request/response) | `PatientResource`, `AppointmentResource`, `InvoiceResource` |
| **Api/State/Processor** | Write operations (Create/Update/Delete) | `PatientProcessor`, `AppointmentProcessor` |
| **Api/State/Provider** | Read operations (Get/GetCollection) | `PatientProvider`, `AppointmentProvider` |
| **Persistence/Doctrine/Repository** | Concrete repository implementations | `DoctrinePatientRepository`, `DoctrineInvoiceRepository` |
| **Persistence/Doctrine/Migrations** | Database schema versioning | `Version20251230103734.php` |
| **Persistence/Doctrine/Function** | Custom SQL functions | `UnaccentFunction` (accent-insensitive search) |
| **Serializer** | Custom normalizers | `DateTimeNormalizer` |
| **Http** | HTTP middleware | `LocaleSubscriber` (language detection) |
| **Search** | Search strategies | `MariaDBPatientSearchStrategy` (fuzzy, accent-insensitive) |
| **Twig** | Template extensions | (SPApp renders React app, minimal Twig usage) |

**Key Architectural Decisions:**

#### AD-001: API Platform for REST API
**Decision:** Use API Platform for automatic CRUD endpoint generation.
**Rationale:**
- ✅ Reduces boilerplate (no manual controller CRUD code)
- ✅ Automatic OpenAPI documentation
- ✅ Built-in pagination, filtering, validation
**Trade-offs:**
- ⚠️ Coupling to API Platform (migration effort if switching frameworks)
- ⚠️ Learning curve for custom operations (State Processors/Providers)

#### AD-002: Doctrine ORM (not DBAL)
**Decision:** Use Doctrine ORM with QueryBuilder (no magic methods).
**Rationale:**
- ✅ Type-safe entity mapping
- ✅ Migration generation
- ✅ Relationship management
**Trade-offs:**
- ⚠️ UnitOfWork complexity (mitigated by using `getArrayResult()` + manual mapping)
- ⚠️ Performance overhead (mitigated by disabling lazy loading, explicit queries)

**Doctrine Performance Policy:**
```php
// ✅ CORRECT: Bypass UnitOfWork, always fresh data
$qb = $this->createQueryBuilder('p')
    ->where('p.status = :status')
    ->setParameter('status', PatientStatus::ACTIVE);
$result = $qb->getQuery()->getArrayResult(); // Returns arrays, not entities
return array_map(fn($row) => Patient::fromArray($row), $result);

// ❌ WRONG: Uses UnitOfWork cache, stale data risk
$patient = $this->find($id); // Magic method, forbidden
```

---

## 4. Component Responsibilities

### 4.1 Frontend Components (React)

| Component | Path | Responsibility |
|-----------|------|----------------|
| **App** | `assets/app.tsx` | Main SPA entry, routing, authentication check |
| **Login** | `assets/components/Login.tsx` | JWT authentication form |
| **Dashboard** | `assets/components/Dashboard.tsx` | Overview metrics (patients, appointments, invoices) |
| **PatientList** | `assets/components/PatientList.tsx` | Patient search, pagination, actions (view, edit, invoice) |
| **PatientForm** | `assets/components/PatientForm.tsx` | Create/Edit patient form |
| **PatientDetail** | `assets/components/PatientDetail.tsx` | Patient info + clinical records timeline |
| **Calendar** | `assets/components/Calendar.tsx` | FullCalendar integration (appointments) |
| **InvoiceList** | `assets/components/invoices/InvoiceList.tsx` | Invoice search, filter, export |
| **InvoiceForm** | `assets/components/invoices/InvoiceForm.tsx` | Create/Edit invoice with line items |
| **CustomerList** | `assets/components/customers/CustomerList.tsx` | Customer management |
| **LanguageContext** | `assets/components/LanguageContext.tsx` | Translation provider (`t()` helper) |
| **Layout** | `assets/components/Layout.tsx` | Common layout (nav, sidebar, logout) |

**State Management:**
- **No global state library** (Redux, Zustand) - uses React Context + TanStack Query
- **TanStack Query** handles server state (caching, invalidation)
- **LocalStorage** for language preference, JWT token

---

### 4.2 Backend Controllers

#### 4.2.1 API Platform Resources (Automatic CRUD)

| Resource | Endpoint | Operations |
|----------|----------|------------|
| `PatientResource` | `/api/patients` | GET (single), GET (collection), POST, PUT |
| `AppointmentResource` | `/api/appointments` | GET (single), GET (collection), POST, PUT, DELETE |
| `InvoiceResource` | `/api/invoices` | GET (single), GET (collection), POST, PUT |
| `CustomerResource` | `/api/customers` | GET (single), GET (collection), POST, PUT |
| `RecordResource` | `/api/records` | GET (collection), POST |

**Example Endpoint:**
```
GET /api/patients?page=1&itemsPerPage=15&search=garcia&fuzzy=true
Response: {
  "member": [...],
  "totalItems": 42,
  "view": {
    "@id": "/api/patients?page=1",
    "@type": "hydra:PartialCollectionView",
    "hydra:first": "/api/patients?page=1",
    "hydra:next": "/api/patients?page=2"
  }
}
```

#### 4.2.2 Custom Controllers

| Controller | Path | Endpoint | Purpose |
|------------|------|----------|---------|
| `DefaultController` | `src/Controller/DefaultController.php` | `GET /` | Renders SPA (React app entry), injects translations |
| `DashboardController` | `src/Infrastructure/Api/Controller/DashboardController.php` | `GET /api/dashboard/stats` | Dashboard metrics |
| `InvoiceExportController` | `src/Infrastructure/Api/Controller/InvoiceExportController.php` | `GET /api/invoices/{id}/export/{format}` | PDF export |
| `InvoiceNumberGapsController` | `src/Infrastructure/Api/Controller/InvoiceNumberGapsController.php` | `GET /api/invoices/number-gaps` | Detect missing invoice numbers |
| `TestController` | `src/Infrastructure/Api/Controller/TestController.php` | `POST /api/test/reset-db` | Test-only: reset database |

---

### 4.3 Data Flow Examples

#### 4.3.1 Patient Creation Flow

```
User (React) → Fills PatientForm → Clicks "Save"
    ↓
PatientForm → POST /api/patients (JSON payload)
    ↓
Nginx → php-fpm (Symfony)
    ↓
API Platform → PatientProcessor::process()
    ↓
PatientProcessor → Creates Patient entity
                → Calls patientRepository->save()
    ↓
DoctrinePatientRepository → EntityManager::persist() + flush()
    ↓
MariaDB → INSERT INTO patients (...)
    ↓
API Platform → Returns 201 Created (JSON response)
    ↓
React → Displays success toast, redirects to PatientList
```

#### 4.3.2 Invoice PDF Export Flow

```
User (React) → Clicks "Export PDF" on invoice
    ↓
React → GET /api/invoices/{id}/export/pdf
    ↓
Nginx → php-fpm (Symfony)
    ↓
InvoiceExportController → Queries GetInvoiceExportHandler
    ↓
GetInvoiceExportHandler → Fetches invoice + lines from repository
                        → Returns InvoiceExportView DTO
    ↓
InvoiceExportController → Renders Twig template (invoice_pdf.html.twig)
                        → DomPDF generates PDF
    ↓
Response → PDF binary stream (Content-Type: application/pdf)
    ↓
Browser → Downloads invoice-2025000001.pdf
```

---

## 5. Data Storage

### 5.1 MariaDB (Primary Database)

**Version:** 11.x
**Role:** Persistent storage for all domain entities

**Tables:**
- `patients` (Patient records)
- `appointments` (Calendar events)
- `invoices` (Billing)
- `invoice_lines` (Invoice line items)
- `customers` (Billing entities)
- `records` (Clinical history)
- `users` (Authentication)
- `counters` (Sequential numbering state)
- `doctrine_migration_versions` (Schema versioning)

**Collation:**
- Default: `utf8mb4_unicode_ci` (case-insensitive, accent-sensitive)
- Custom: `case_insensitive` collation for patient name searches (accent-insensitive via UNACCENT function)

**Indexing Strategy:**
| Table | Indexed Columns | Purpose |
|-------|----------------|---------|
| `patients` | `full_name` (FULLTEXT) | Fast name search |
| `patients` | `status` | Filter active/inactive |
| `appointments` | `user_id` | Filter by practitioner |
| `appointments` | `starts_at`, `ends_at` | Date range queries |
| `invoices` | `number` | Unique constraint + fast lookup |
| `invoices` | `customer_id` | Join optimization |
| `invoices` | `date` | Date range queries |

**Backup Strategy:**
⚠️ **NOT CONFIGURED** (manual mysqldump required; needs automation)

---

### 5.2 Redis (Cache Store)

**Version:** 7.x (Alpine)
**Role:** Future caching layer

**Current Usage:**
- **Cache**: Available but not actively used yet (configured for future use)
- **Authentication**: JWT (stateless - no session storage needed)

**Future Usage:**
- Query result caching (patient searches, appointment lookups)
- Rate limiting (login attempts, API throttling)
- Background job queuing

**Configuration:**
```yaml
# config/packages/snc_redis.yaml
snc_redis:
    clients:
        default:
            type: predis
            alias: default
            dsn: '%env(REDIS_URL)%'
```

---

## 6. External Integrations

### 6.1 Current Integrations

**None.** System is fully self-contained.

### 6.2 Planned Integrations (Roadmap)

| Integration | Version | Purpose | Complexity |
|-------------|---------|---------|------------|
| **Email Service (Sendgrid/Mailgun)** | v1.1 | Appointment reminders, invoice delivery | Low |
| **SMS Provider (Twilio)** | v1.1 | Appointment reminders | Low |
| **Accounting Software** | v2.0 | Export invoices to QuickBooks/Xero | Medium |
| **National EHR (HL7/FHIR)** | v2.0+ | Patient data interoperability | High |
| **Payment Gateway (Stripe/Redsys)** | Future | Online invoice payment | Medium |

---

## 7. Architectural Decision Records (ADRs)

The architectural decisions for this project are recorded in individual documents to ensure traceability and clarity.

👉 **[View all Architectural Decision Records (ADRs) here](../adr/README.md)**

### Key Decisions Summary

*   **ADR-001**: Symfony + React (Decoupled SPA)
*   **ADR-002**: DDD with Pragmatic PHP Approach
*   **ADR-003**: API Platform for REST API
*   **ADR-004**: No UnitOfWork Cache (Fresh Data Strategy)
*   **ADR-009**: Pragmatic Event Sourcing (Audit & State)

---

## 8. Security Architecture

### 8.1 Authentication Flow (JWT)

```
User → POST /api/login (email + password)
    ↓
SecurityController → Authenticates via User entity
                  → Generates JWT token (RS256)
    ↓
Response → { "token": "eyJ..." }
    ↓
React → Stores token in localStorage
    ↓
Subsequent API calls → Authorization: Bearer eyJ...
    ↓
Symfony Security → Validates JWT signature
                 → Extracts user roles
                 → Grants/denies access
```

**Token Expiration:** 28 days (configurable via `lexik_jwt_authentication.yaml`)
**Encryption:** RS256 (asymmetric; private key signs, public key verifies)

### 8.2 Authorization (RBAC)

**Roles:**
- `ROLE_USER`: Standard clinic staff (can access all features currently)
- `ROLE_ADMIN`: Administrative access (no functional difference in v1)

⚠️ **Limitation:** Granular permissions not implemented (all authenticated users have full access).

**Future Enhancement (v1.2):**
- `ROLE_RECEPTIONIST`: Patients, appointments, invoices (no clinical records)
- `ROLE_PRACTITIONER`: Patients, appointments, clinical records (no invoices)
- `ROLE_ADMIN`: Full access

### 8.3 Input Validation

**Frontend (React):**
- Basic validation (required fields, email format)
- Visual feedback (red borders, error messages)

**Backend (Symfony):**
- Symfony Validator constraints (`#[Assert\NotBlank]`, etc.)
- API Platform automatic validation
- Parameterized SQL queries (Doctrine QueryBuilder) - SQL injection prevention
- Output escaping (React auto-escapes) - XSS prevention

### 8.4 HTTPS/TLS

⚠️ **NOT CONFIGURED** (development only; production requires SSL certificate)

**Production Requirement:**
- TLS 1.2 or higher
- Certificate from Let's Encrypt or AWS ACM
- HSTS header enforced

---

## 9. Performance Considerations

### 9.1 Database Query Optimization

| Optimization | Status | Impact |
|--------------|--------|--------|
| **QueryBuilder (no magic methods)** | ✅ Implemented | Explicit queries, no hidden SELECT * |
| **getArrayResult() (bypass UnitOfWork)** | ✅ Implemented | Fresh data, no cache staleness |
| **Eager loading associations** | ⚠️ Partial | Some N+1 risks remain (invoice lines) |
| **Indexes on search columns** | ✅ Implemented | Fast patient/invoice search |
| **N+1 fetch pagination** | ✅ Implemented | 50% reduction in DB load |

### 9.2 Frontend Performance

| Optimization | Status | Impact |
|--------------|--------|--------|
| **Vite bundling (tree-shaking)** | ✅ Implemented | Smaller JS bundle |
| **Code splitting (lazy loading)** | ⚠️ Not implemented | Single bundle currently |
| **Image optimization** | ⚠️ Not implemented | Company logo not optimized |
| **CDN for static assets** | ⚠️ Not configured | Serves from local Nginx |

### 9.3 Caching Strategy

**Current:**
- No active caching (JWT stateless authentication - no sessions)
- Redis available but not actively used

**Future (v1.2):**
- Cache patient search results (5-minute TTL)
- Cache appointment lookups (1-minute TTL)
- Cache invoice lists (invalidate on write)

---

## 10. Scalability & High Availability

### 10.1 Horizontal Scaling Readiness

**Current Status:** ✅ **Stateless API** (ready for horizontal scaling)

**Requirements for Multi-Instance Deployment:**
1. ✅ **JWT Authentication**: Stateless (no session storage needed)
2. ✅ **Stateless Containers**: No local file uploads (none currently)
3. ⚠️ **Database Connection Pooling**: Not configured (single connection per request)
4. ⚠️ **Load Balancer**: Not configured (Nginx reverse proxy needed)
5. ⚠️ **Shared Redis**: Not configured (would be needed if caching is enabled)

**Future Architecture (v2.0 - Multi-Instance):**
```
                    [Load Balancer (Nginx/ALB)]
                              ↓
          ┌───────────────────┼───────────────────┐
          ↓                   ↓                   ↓
    [App Instance 1]   [App Instance 2]   [App Instance 3]
          ↓                   ↓                   ↓
          └───────────────────┴───────────────────┘
                              ↓
                    [Shared Redis Cluster]
                              ↓
                    [MariaDB Primary/Replica]
```

### 10.2 Database Scaling

**Current:** Single MariaDB instance

**Future (v2.0):**
- **Read Replicas**: Offload read-heavy queries (patient search, invoice lists)
- **Connection Pooling**: PgBouncer equivalent for MariaDB
- **Partitioning**: Partition `appointments` table by year (if >1M rows)

---

## 11. Disaster Recovery

### 11.1 Backup Strategy

⚠️ **NOT IMPLEMENTED**

**Required for Production:**
- **Daily automated backups** (full database dump)
- **30-day retention** (rolling deletion)
- **Offsite storage** (S3, Cloud Storage)
- **Backup testing** (quarterly restore drills)

### 11.2 Recovery Point Objective (RPO)

**Target:** 24 hours (acceptable data loss: 1 day of work)
**Current:** ⚠️ Undefined (no backups)

### 11.3 Recovery Time Objective (RTO)

**Target:** 4 hours (time to restore service)
**Current:** ⚠️ Undefined (no documented restore procedure)

---

## 12. Observability & Monitoring

### 12.1 Logging

**Current:**
- Application logs via Monolog
- Log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
- Storage: Local files (`var/log/dev.log`, `var/log/prod.log`)

⚠️ **Not Configured:**
- Centralized logging (ELK, CloudWatch)
- Log retention policy
- Log rotation

### 12.2 Error Tracking

⚠️ **NOT CONFIGURED** (Sentry, Rollbar)

**Recommendation:** Integrate Sentry for production error tracking.

### 12.3 Performance Monitoring

⚠️ **NOT CONFIGURED** (New Relic, Datadog)

**Recommendation:** Integrate APM for production performance insights.

---

**Document End**
