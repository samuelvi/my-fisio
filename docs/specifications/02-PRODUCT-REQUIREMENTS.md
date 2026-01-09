# Product Requirements Document (PRD)
## Physiotherapy Clinic Management System

**Document Version:** 1.0
**Last Updated:** December 30, 2025
**Classification:** Internal - Product
**Owner:** Head of Product

---

## 1. Introduction

### 1.1 Purpose

This document defines the comprehensive functional and non-functional requirements for the Physiotherapy Clinic Management System. It serves as the contractual specification between business stakeholders and the engineering team.

### 1.2 Scope

The system encompasses end-to-end clinic operations:
- Patient registration and management
- Appointment scheduling and calendar management
- Clinical recordkeeping and history tracking
- Billing and invoice generation
- User authentication and role management
- Multi-language support (English/Spanish)

### 1.3 Document Conventions

- **MUST**: Mandatory requirement (non-negotiable)
- **SHOULD**: Highly recommended (may be deprioritized under constraints)
- **MAY**: Optional (nice-to-have)
- **FR-XXX**: Functional Requirement identifier
- **NFR-XXX**: Non-Functional Requirement identifier

---

## 2. Product Vision & Objectives

### 2.1 Vision Statement

*"To be the definitive operational platform for physiotherapy clinics, enabling practitioners to deliver exceptional patient care while minimizing administrative burden through intelligent automation and data-driven insights."*

### 2.2 Business Objectives (SMART Goals)

| Objective | Metric | Target | Timeline |
|-----------|--------|--------|----------|
| **Operational Efficiency** | Admin time reduction | 40% decrease | 6 months post-deployment |
| **Patient Throughput** | Appointments per day | 25% increase | 3 months post-deployment |
| **Billing Accuracy** | Invoice error rate | < 1% | Immediate |
| **System Adoption** | Active user rate | > 90% | 3 months post-deployment |
| **Regulatory Compliance** | GDPR audit score | 100% compliance | Pre-production |

### 2.3 Non-Goals (Explicit Out-of-Scope)

The following are **explicitly excluded** from the current scope:

1. **Electronic Health Records (EHR) Integration**: No integration with national EHR systems (e.g., HL7, FHIR).
2. **Telemedicine**: No video consultation capabilities.
3. **Prescription Management**: No e-prescribing or pharmacy integration.
4. **Multi-Clinic Network Management**: Single-clinic focus; multi-clinic franchise management not supported.
5. **Patient Portal**: No patient-facing self-service portal (appointment booking, record access).
6. **Payment Processing**: No integrated payment gateway (Stripe, PayPal); invoices are generated, not paid online.
7. **Marketing Automation**: No email campaigns, SMS reminders, or CRM features.
8. **Inventory Management**: No tracking of medical supplies, equipment, or consumables.

---

## 3. User Personas

### 3.1 Persona 1: "Dr. Sofia Martinez" - Physiotherapist

**Role:** Clinical Practitioner
**Age:** 35-50
**Tech Proficiency:** Moderate
**Goals:**
- Access patient history quickly during consultations
- Document treatment notes efficiently
- Review upcoming appointments at a glance

**Pain Points:**
- Switching between multiple systems disrupts workflow
- Poor mobile access when working across multiple rooms
- Difficulty finding past treatment records

**Critical Features:**
- Fast patient search (by name, phone, ID)
- Mobile-responsive clinical record forms
- Historical treatment timeline view

---

### 3.2 Persona 2: "Maria Lopez" - Clinic Administrator

**Role:** Front Desk / Billing Coordinator
**Age:** 25-45
**Tech Proficiency:** High
**Goals:**
- Schedule appointments without double-bookings
- Generate invoices rapidly at checkout
- Handle patient intake efficiently during peak hours

**Pain Points:**
- Calendar conflicts cause patient dissatisfaction
- Manual invoice generation is error-prone
- No visibility into practitioner availability

**Critical Features:**
- Real-time calendar with conflict detection
- One-click invoice generation from patient record
- Search and filter capabilities for patients/invoices

---

### 3.3 Persona 3: "Carlos Fernandez" - Clinic Owner

**Role:** Business Owner / Manager
**Age:** 40-60
**Tech Proficiency:** Low-Moderate
**Goals:**
- Ensure compliance with regulations
- Monitor clinic performance (revenue, appointments)
- Minimize operational costs

**Pain Points:**
- Compliance anxiety regarding data protection
- Lack of visibility into business metrics
- High administrative overhead

**Critical Features:**
- Dashboard with key metrics (appointments, revenue)
- Automated audit trails
- Secure, compliant data storage

---

## 4. User Journeys

### 4.1 Journey 1: New Patient Registration

**Actor:** Clinic Administrator (Maria)

**Preconditions:** Patient arrives for first appointment

**Steps:**
1. Maria navigates to "Patients" → "New Patient"
2. System displays patient registration form
3. Maria enters:
   - Personal info (first name, last name, date of birth, phone)
   - Contact details (email, address)
   - Medical history (allergies, medications, systemic diseases, past surgeries, injuries)
   - Administrative info (profession, sports activity, notes)
4. System validates required fields (first name, last name)
5. Maria clicks "Save"
6. System generates unique patient ID
7. System displays success confirmation
8. Maria proceeds to schedule first appointment

**Success Criteria:**
- Patient record created in < 2 minutes
- All mandatory fields validated before save
- Patient immediately searchable by name

---

### 4.2 Journey 2: Appointment Scheduling

**Actor:** Clinic Administrator (Maria) or Physiotherapist (Dr. Sofia)

**Preconditions:** Patient exists in system

**Steps:**
1. User navigates to Calendar view (Weekly/Monthly/Daily)
2. User identifies available time slot (yellow = available gap, no conflict)
3. User clicks on time slot
4. System displays appointment creation modal
5. User selects patient (autocomplete search)
6. User enters appointment title (e.g., "Back pain treatment")
7. User selects appointment type (appointment/other)
8. User adjusts start/end time if needed
9. User clicks "Save"
10. System validates:
    - No time conflicts with existing appointments
    - Duration < 10 hours (maximum)
11. System creates appointment
12. Calendar updates in real-time

**Success Criteria:**
- Appointment created in < 30 seconds
- No double-bookings allowed
- Immediate visual confirmation on calendar

---

### 4.3 Journey 3: Clinical Consultation & Documentation

**Actor:** Physiotherapist (Dr. Sofia)

**Preconditions:** Patient arrives for scheduled appointment

**Steps:**
1. Dr. Sofia searches for patient by name
2. System displays patient detail page with:
   - Personal info
   - Medical history
   - Past treatment records (timeline view)
3. Dr. Sofia reviews past treatments
4. Dr. Sofia clicks "New Record"
5. System displays clinical record form
6. Dr. Sofia documents:
   - Consultation reason
   - Onset of symptoms
   - Radiology tests (if any)
   - Evolution
   - Current situation
   - Sick leave status
   - Physiotherapy treatment applied
   - Medical treatment
   - Home treatment plan
   - Internal notes
7. Dr. Sofia clicks "Save"
8. System timestamps and saves record
9. Record appears in patient timeline

**Success Criteria:**
- Record creation in < 5 minutes
- All fields support free-text entry (no rigid templates)
- Historical records always accessible

---

### 4.4 Journey 4: Invoice Generation

**Actor:** Clinic Administrator (Maria)

**Preconditions:** Patient has received treatment(s)

**Steps:**
1. Maria navigates to "Invoices" → "New Invoice"
2. System displays invoice creation form
3. Maria selects customer (autocomplete search)
   - If customer doesn't exist, creates new customer inline
4. System pre-fills customer details (name, tax ID, address, phone, email)
5. Maria adds invoice lines:
   - Concept (e.g., "Physiotherapy session")
   - Description (detailed)
   - Quantity
   - Unit price
   - System auto-calculates line total
6. System auto-calculates invoice total
7. Maria clicks "Generate Invoice"
8. System:
   - Validates invoice number sequence
   - Generates sequential invoice number (format: YYYY000001)
   - Saves invoice to database
   - Generates PDF with company logo and details
9. Maria downloads/prints PDF for patient

**Success Criteria:**
- Invoice created in < 2 minutes
- Sequential numbering guaranteed (no gaps or duplicates)
- PDF generation < 5 seconds
- Editable invoices (if feature enabled)

---

## 5. Functional Requirements (FR)

### 5.1 Patient Management

#### FR-001: Patient Creation
**Priority:** MUST
**Description:** System MUST allow creation of new patient records with mandatory and optional fields.
**Acceptance Criteria:**
- ✅ First name and last name are mandatory (validated on submit)
- ✅ Date of birth, phone, email, address are optional
- ✅ Medical history fields (allergies, medications, diseases, surgeries, injuries) are optional
- ✅ System generates unique patient ID automatically
- ✅ Created timestamp recorded

#### FR-002: Patient Search
**Priority:** MUST
**Description:** System MUST provide fast, intuitive patient search.
**Acceptance Criteria:**
- ✅ Search by full name (case-insensitive, accent-insensitive)
- ✅ Partial match support (searching "jose" finds "José García")
- ✅ Fuzzy search option (handles typos)
- ✅ Search results paginated (N+1 fetch pattern)
- ✅ Search response time < 300ms for typical query

#### FR-003: Patient Update
**Priority:** MUST
**Description:** System MUST allow updating existing patient information.
**Acceptance Criteria:**
- ✅ All fields editable except ID and creation date
- ✅ Validation applied (same as creation)
- ✅ Update timestamp recorded

#### FR-004: Patient Status Management
**Priority:** MUST
**Description:** System MUST support patient status (active/inactive).
**Acceptance Criteria:**
- ✅ Default status: ACTIVE
- ✅ Status changeable via UI
- ✅ Inactive patients filterable in patient list

#### FR-005: Patient Detail View
**Priority:** MUST
**Description:** System MUST display comprehensive patient details.
**Acceptance Criteria:**
- ✅ Personal information section
- ✅ Medical history section
- ✅ Clinical records timeline (most recent first)
- ✅ Action buttons (Edit, New Record)

---

### 5.2 Appointment Scheduling

#### FR-010: Calendar Views
**Priority:** MUST
**Description:** System MUST provide multiple calendar views.
**Acceptance Criteria:**
- ✅ Weekly view (default)
- ✅ Monthly view
- ✅ Daily view
- ✅ Configurable first day of week (Sunday/Monday)
- ✅ Configurable weekend column width

#### FR-011: Appointment Creation
**Priority:** MUST
**Description:** System MUST allow creating appointments with conflict detection.
**Acceptance Criteria:**
- ✅ User selects time slot via calendar click
- ✅ Modal displays with appointment form
- ✅ Title field (optional - empty = available gap)
- ✅ Patient association (optional)
- ✅ Type selection (appointment/other)
- ✅ Start/End time editable
- ✅ Conflict detection (overlapping time slots rejected)
- ✅ Maximum duration: 10 hours

#### FR-012: Gap Management
**Priority:** MUST
**Description:** System MUST support automatic generation of available time slots (gaps).
**Acceptance Criteria:**
- ✅ "Generate Gaps" button enabled when date range is empty
- ✅ Gaps generated based on working hours configuration (per weekday)
- ✅ "Delete Gaps" button enabled when gaps exist
- ✅ Gaps visually distinguished (yellow background)
- ✅ Gaps have empty title field

#### FR-013: Appointment Update/Delete
**Priority:** MUST
**Description:** System MUST allow editing/deleting appointments.
**Acceptance Criteria:**
- ✅ Click on existing appointment opens edit modal
- ✅ All fields editable
- ✅ Conflict detection applies on update
- ✅ Delete confirmation required

#### FR-014: Appointment Color Coding
**Priority:** SHOULD
**Description:** System SHOULD visually differentiate appointment types.
**Acceptance Criteria:**
- ✅ Brown: Regular appointments (non-empty title)
- ✅ Yellow: Available gaps (empty title)
- ✅ Olive green: "Other" type events (non-empty title)

---

### 5.3 Clinical Records

#### FR-020: Record Creation
**Priority:** MUST
**Description:** System MUST allow creating clinical records for patients.
**Acceptance Criteria:**
- ✅ Accessible from patient detail page
- ✅ Fields: consultation reason, onset, radiology tests, evolution, current situation, sick leave, physiotherapy treatment, medical treatment, home treatment, notes
- ✅ All fields support free-text entry (TEXT type)
- ✅ Sick leave field is boolean
- ✅ Creation timestamp recorded

#### FR-021: Record Timeline View
**Priority:** MUST
**Description:** System MUST display patient records chronologically.
**Acceptance Criteria:**
- ✅ Most recent record displayed first
- ✅ Each record shows creation date prominently
- ✅ Expandable/collapsible view for long records

#### FR-022: Record Update
**Priority:** SHOULD
**Description:** System SHOULD allow editing existing records.
**Acceptance Criteria:**
- ⚠️ **NOT IMPLEMENTED** (design decision: clinical records immutable for audit purposes)
- Alternative: Create new record with "Correction to record #XXX" note

---

### 5.4 Billing & Invoicing

#### FR-030: Customer Management
**Priority:** MUST
**Description:** System MUST manage billing entities (customers) separately from patients.
**Acceptance Criteria:**
- ✅ Customer entity with: first name, last name, full name, tax ID, email, phone, address
- ✅ Customer creation/update/search
- ✅ One customer can have multiple invoices

#### FR-031: Invoice Creation
**Priority:** MUST
**Description:** System MUST generate invoices with sequential numbering.
**Acceptance Criteria:**
- ✅ Invoice fields: number, date, customer, amount, line items
- ✅ Sequential numbering format: YYYY000001 (year + 6-digit counter)
- ✅ Auto-increment within year
- ✅ Reset counter on new year
- ✅ No duplicate numbers allowed
- ✅ No gaps in sequence (gap detection feature)

#### FR-032: Invoice Line Items
**Priority:** MUST
**Description:** System MUST support multiple line items per invoice.
**Acceptance Criteria:**
- ✅ Each line: concept, description, quantity, unit price
- ✅ Line total auto-calculated (quantity × price)
- ✅ Invoice total auto-calculated (sum of line totals)

#### FR-033: PDF Invoice Export
**Priority:** MUST
**Description:** System MUST generate professional PDF invoices.
**Acceptance Criteria:**
- ✅ PDF includes: company logo, company details, invoice number, date, customer details, line items table, total
- ✅ Company details configurable via environment variables
- ✅ PDF generation < 5 seconds

#### FR-034: Invoice Search
**Priority:** MUST
**Description:** System MUST provide invoice search capabilities.
**Acceptance Criteria:**
- ✅ Search by invoice number (partial match)
- ✅ Search by customer name (case-insensitive)
- ✅ Search by customer tax ID
- ✅ Filter by date range
- ✅ Pagination support

#### FR-035: Invoice Editing
**Priority:** SHOULD
**Description:** System SHOULD allow editing invoices (feature flag controlled).
**Acceptance Criteria:**
- ✅ Feature enabled via `VITE_INVOICE_EDIT_ENABLED` environment variable
- ✅ When enabled: all invoice fields editable except number
- ✅ When disabled: invoices read-only after creation
- ⚠️ **Design Decision Pending**: Should invoice number be editable? (audit trail implications)

#### FR-036: Invoice Number Gap Detection
**Priority:** SHOULD
**Description:** System SHOULD detect gaps in invoice numbering sequence.
**Acceptance Criteria:**
- ✅ Endpoint: `GET /api/invoices/number-gaps`
- ✅ Returns list of missing invoice numbers
- ✅ Useful for audit compliance

---

### 5.5 Authentication & Security

#### FR-040: User Authentication
**Priority:** MUST
**Description:** System MUST authenticate users via JWT tokens.
**Acceptance Criteria:**
- ✅ Login endpoint: `POST /api/login`
- ✅ Credentials: email + password
- ✅ Returns JWT token on success
- ✅ Token expiration: 28 days (configurable)
- ✅ Token includes user roles

#### FR-041: Role-Based Access Control (RBAC)
**Priority:** MUST
**Description:** System MUST restrict access based on user roles.
**Acceptance Criteria:**
- ✅ Roles defined: ROLE_ADMIN, ROLE_USER
- ✅ Admin role: full access to all features
- ✅ User role: access to clinical features (patients, appointments, records)
- ⚠️ **Granular Permissions**: Not implemented (all authenticated users have same access currently)

#### FR-042: Authentication Token Management
**Priority:** MUST
**Description:** System MUST manage user authentication securely using JWT tokens.
**Acceptance Criteria:**
- ✅ JWT tokens with configurable expiration (default ~18 days)
- ✅ Stateless authentication (no server-side session storage)
- ✅ Logout clears client-side token from localStorage

---

### 5.6 Multi-Language Support

#### FR-050: Language Selection
**Priority:** MUST
**Description:** System MUST support English and Spanish.
**Acceptance Criteria:**
- ✅ Language switcher in UI (top navigation)
- ✅ Default language: configurable (`VITE_DEFAULT_LOCALE`)
- ✅ User preference persisted in localStorage
- ✅ All UI strings translated (via `messages.en.yaml`, `messages.es.yaml`)

#### FR-051: Translation Delivery
**Priority:** MUST
**Description:** System MUST deliver translations synchronously (no API calls).
**Acceptance Criteria:**
- ✅ Translations injected via `window.APP_TRANSLATIONS` (server-side rendering)
- ✅ No "flash of untranslated content"
- ✅ Translations available before authentication

---

## 6. Non-Functional Requirements (NFR)

### 6.1 Performance

#### NFR-001: Response Time
**Priority:** MUST
**Description:** API endpoints MUST respond within acceptable time limits.
**Acceptance Criteria:**
- ✅ GET requests (single entity): < 200ms (p95)
- ✅ GET requests (collections): < 500ms (p95)
- ✅ POST/PUT/DELETE requests: < 1000ms (p95)
- ✅ PDF generation: < 5000ms

#### NFR-002: Database Query Optimization
**Priority:** MUST
**Description:** All database queries MUST be optimized.
**Acceptance Criteria:**
- ✅ Use QueryBuilder (no magic methods)
- ✅ Use `getArrayResult()` to bypass UnitOfWork cache
- ✅ Eager loading for associations (no N+1 queries)
- ✅ Indexes on frequently queried columns (patient full_name, invoice number)

#### NFR-003: Pagination Efficiency
**Priority:** MUST
**Description:** Collection endpoints MUST use N+1 fetch pattern (no COUNT queries).
**Acceptance Criteria:**
- ✅ Fetch N+1 records
- ✅ Display N records
- ✅ Show "Next" button if N+1 record exists
- ✅ Reduces database load by ~50%

---

### 6.2 Scalability

#### NFR-010: Horizontal Scaling
**Priority:** SHOULD
**Description:** System SHOULD support horizontal scaling.
**Acceptance Criteria:**
- ✅ Stateless API with JWT authentication (no session storage needed)
- ✅ Redis available for shared caching across instances (future use)
- ✅ No file-based locks or local caching
- ⚠️ **File Uploads**: Not implemented (would require shared storage like S3)

#### NFR-011: Database Scalability
**Priority:** SHOULD
**Description:** Database SHOULD handle growth to 100,000+ patients.
**Acceptance Criteria:**
- ✅ Indexed search columns
- ⚠️ **Partitioning**: Not configured (may be needed for >1M appointments)
- ⚠️ **Read Replicas**: Not configured (single master)

---

### 6.3 Security

#### NFR-020: Data Encryption
**Priority:** MUST
**Description:** Sensitive data MUST be encrypted.
**Acceptance Criteria:**
- ✅ HTTPS enforced in production (TLS 1.2+)
- ✅ JWT tokens signed with RS256 (asymmetric encryption)
- ⚠️ **Database Encryption**: Not configured (MariaDB supports at-rest encryption)

#### NFR-021: Input Validation
**Priority:** MUST
**Description:** All user inputs MUST be validated.
**Acceptance Criteria:**
- ✅ Backend validation (Symfony Validator)
- ✅ Frontend validation (basic)
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS prevention (output escaping in React)

#### NFR-022: Authentication Security
**Priority:** MUST
**Description:** Authentication MUST follow best practices.
**Acceptance Criteria:**
- ✅ Passwords hashed (bcrypt, cost 13)
- ✅ JWT token expiration enforced
- ⚠️ **Rate Limiting**: Not configured
- ⚠️ **2FA**: Not implemented

---

### 6.4 Availability

#### NFR-030: Uptime Target
**Priority:** MUST
**Description:** System MUST maintain 99.5% uptime (monthly).
**Acceptance Criteria:**
- ⚠️ **Monitoring**: Not configured (requires Pingdom, UptimeRobot)
- ⚠️ **Health Checks**: Configured in Docker but not monitored externally

#### NFR-031: Disaster Recovery
**Priority:** MUST
**Description:** System MUST have backup/restore capability.
**Acceptance Criteria:**
- ⚠️ **Automated Backups**: Not configured (manual database dumps required)
- ⚠️ **Backup Retention**: 30 days minimum (not configured)
- ⚠️ **Restore Testing**: Not performed

---

### 6.5 Observability

#### NFR-040: Logging
**Priority:** MUST
**Description:** System MUST log critical events.
**Acceptance Criteria:**
- ✅ Application logs (Monolog)
- ✅ Log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
- ⚠️ **Centralized Logging**: Not configured (ELK, CloudWatch)

#### NFR-041: Error Tracking
**Priority:** SHOULD
**Description:** System SHOULD track errors in production.
**Acceptance Criteria:**
- ⚠️ **Error Tracking**: Not configured (Sentry, Rollbar)

#### NFR-042: Performance Monitoring
**Priority:** SHOULD
**Description:** System SHOULD monitor performance metrics.
**Acceptance Criteria:**
- ⚠️ **APM**: Not configured (New Relic, Datadog)

---

## 7. Assumptions & Dependencies

### 7.1 Assumptions

1. **Single-Clinic Deployment**: System assumes single-clinic operation (no multi-tenant architecture).
2. **Manual Payment Processing**: Invoices are paid offline (cash, bank transfer); no online payment processing.
3. **Internal Users Only**: No patient-facing portal; all access is internal clinic staff.
4. **Stable Internet**: Assumes reliable internet connectivity (no offline mode).
5. **Modern Browsers**: Assumes users have Chrome, Firefox, Safari, or Edge (last 2 versions).

### 7.2 Dependencies

| Dependency | Type | Risk Level | Mitigation |
|------------|------|------------|------------|
| **MariaDB Availability** | Infrastructure | High | Use managed database service (RDS, Cloud SQL) |
| **Redis Availability** | Infrastructure | High | Use managed cache service (ElastiCache) |
| **Docker Platform** | Deployment | Medium | Containerization ensures portability |
| **FOSJsRoutingBundle** | Library | Low | Well-maintained, but creates frontend coupling |
| **API Platform** | Framework | Medium | Large community, but version upgrades may break contracts |

---

## 8. Metrics & Success Criteria (KPIs)

### 8.1 Usage Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Daily Active Users (DAU)** | > 90% of staff | Application analytics |
| **Appointments Created/Day** | > 50 | Database query |
| **Invoices Generated/Month** | > 300 | Database query |
| **Patient Records Created/Month** | > 200 | Database query |

### 8.2 Performance Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **API Response Time (p95)** | < 500ms | APM (New Relic, Datadog) |
| **Page Load Time** | < 2s | Lighthouse, WebPageTest |
| **Database Query Time (p95)** | < 100ms | Slow query log analysis |

### 8.3 Quality Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Invoice Error Rate** | < 1% | Manual audits, user reports |
| **System Errors (5xx)** | < 0.1% of requests | Server logs |
| **Test Coverage (Backend)** | > 70% | PHPUnit coverage report |
| **E2E Test Pass Rate** | 100% | CI/CD pipeline |

### 8.4 Business Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Patient Satisfaction (NPS)** | > 8.0 | Post-visit surveys |
| **Administrative Time Saved** | 40% reduction | Time-motion studies |
| **Revenue per Practitioner** | 20% increase | Financial reports |

---

## 9. Risks & Constraints

### 9.1 Known Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Data Loss (no backups)** | Critical | Medium | Implement automated daily backups |
| **Scalability Bottleneck** | High | Low | Load testing, horizontal scaling prep |
| **Security Breach** | Critical | Low | Penetration testing, WAF, OWASP compliance |
| **User Adoption Failure** | High | Medium | Training, change management, UAT |

### 9.2 Constraints

**Technical:**
- PHP 8.4 requirement (bleeding edge, limited hosting options)
- Docker-only deployment (no traditional LAMP stack support)
- MariaDB 11 (not universally supported by managed services)

**Operational:**
- No dedicated DevOps team (relies on developer self-service)
- No 24/7 support (office hours only)

**Regulatory:**
- GDPR compliance required (EU/Spain)
- Medical data protection (LOPD)
- No international deployment (Spain-only initially)

---

## 10. Open Questions

1. **Invoice Editing**: Should invoice numbers be editable post-creation? (Audit trail implications)
2. **Record Immutability**: Should clinical records be editable? (Current: immutable; Alternative: versioning)
3. **Patient Portal**: Is a patient-facing portal (self-booking, record access) a future requirement?
4. **Multi-Clinic Support**: Is multi-location/franchise management a future requirement?
5. **Payment Integration**: Will online payment processing (Stripe, Redsys) be needed?
6. **Appointment Reminders**: Should the system send automated SMS/Email reminders?
7. **Reporting/Analytics**: Is a business intelligence dashboard required (revenue trends, patient demographics)?

---

## 11. Approval & Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Product Owner** | _______________ | _______________ | _______________ |
| **Technical Lead** | _______________ | _______________ | _______________ |
| **Security Officer** | _______________ | _______________ | _______________ |
| **Clinic Director** | _______________ | _______________ | _______________ |

---

**Document End**
