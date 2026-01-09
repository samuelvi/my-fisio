# Scope & Roadmap
## Physiotherapy Clinic Management System

**Document Version:** 1.0
**Last Updated:** December 30, 2025
**Classification:** Internal - Strategic Planning
**Owner:** Senior Program Manager (PMO)

---

## 1. Introduction

### 1.1 Purpose

This document defines the project scope boundaries, deliverables, phases, and strategic roadmap for the Physiotherapy Clinic Management System. It serves as the master plan for stakeholder alignment and resource allocation.

### 1.2 Scope Management Approach

- **Scope Baseline**: Defined by approved requirements in PRD (02-PRODUCT-REQUIREMENTS.md)
- **Change Control**: All scope changes require formal Change Request (CR) and stakeholder approval
- **Scope Creep Prevention**: Non-goals explicitly documented; feature requests subject to impact analysis

---

## 2. Current Scope (MVP - Implemented)

### 2.1 In-Scope Features (✅ Delivered)

The following capabilities are **implemented, tested, and operational**:

| Module | Feature | Status |
|--------|---------|--------|
| **Patient Management** | Create, Read, Update, Search (fuzzy, accent-insensitive) | ✅ Complete |
| **Patient Management** | Status management (Active/Inactive) | ✅ Complete |
| **Patient Management** | Medical history tracking | ✅ Complete |
| **Appointment Scheduling** | Calendar views (Weekly, Monthly, Daily) | ✅ Complete |
| **Appointment Scheduling** | Create, Update, Delete appointments | ✅ Complete |
| **Appointment Scheduling** | Conflict detection (no double-bookings) | ✅ Complete |
| **Appointment Scheduling** | Gap management (generate/delete available slots) | ✅ Complete |
| **Appointment Scheduling** | Visual color coding (gaps, appointments, other events) | ✅ Complete |
| **Clinical Records** | Create clinical consultation records | ✅ Complete |
| **Clinical Records** | Timeline view (historical records) | ✅ Complete |
| **Clinical Records** | Medical questionnaire (allergies, medications, diseases, etc.) | ✅ Complete |
| **Billing** | Customer management (separate from patients) | ✅ Complete |
| **Billing** | Invoice creation with line items | ✅ Complete |
| **Billing** | Sequential invoice numbering (YYYY000001) | ✅ Complete |
| **Billing** | PDF export with company logo | ✅ Complete |
| **Billing** | Invoice number gap detection | ✅ Complete |
| **Billing** | Search/filter invoices (number, customer name, tax ID) | ✅ Complete |
| **Authentication** | JWT-based login | ✅ Complete |
| **Authentication** | JWT authentication (stateless) | ✅ Complete |
| **Authentication** | Role-based access (ROLE_ADMIN, ROLE_USER) | ✅ Complete |
| **Multi-Language** | English/Spanish support | ✅ Complete |
| **Multi-Language** | Synchronous translation injection (no API calls) | ✅ Complete |
| **Infrastructure** | Docker multi-environment (dev, test, prod) | ✅ Complete |
| **Infrastructure** | CI/CD pipeline (GitHub Actions) | ✅ Complete |
| **Testing** | PHPUnit (backend unit/integration tests) | ✅ Complete |
| **Testing** | Playwright (E2E tests for critical workflows) | ✅ Complete |
| **Code Quality** | PHPStan Level 8, PHP-CS-Fixer, Rector | ✅ Complete |

### 2.2 Out-of-Scope (Explicitly Excluded)

The following features are **NOT included** in the current scope:

| Feature | Rationale |
|---------|-----------|
| **Patient Portal (Self-Service)** | Resource constraints; low priority for v1 |
| **Online Payment Processing** | Business model: offline payments only |
| **Telemedicine (Video Consultations)** | Outside core value proposition |
| **EHR Integration (HL7/FHIR)** | National system integration deferred to v2 |
| **Appointment Reminders (SMS/Email)** | External service dependency; deferred to v1.1 |
| **Multi-Clinic Network Management** | Single-clinic focus for MVP |
| **Prescription Management** | Regulatory complexity; deferred indefinitely |
| **Inventory Management** | Not core to clinic operations |
| **Business Intelligence Dashboard** | Data volume insufficient for meaningful analytics |
| **Mobile Native Apps (iOS/Android)** | Responsive web sufficient for v1 |

---

## 3. Feature Maturity Assessment

### 3.1 Production-Ready Features

| Feature | Test Coverage | Documentation | Known Issues |
|---------|---------------|---------------|--------------|
| Patient Management | High (E2E + Unit) | Complete | None |
| Appointment Scheduling | High (E2E + Unit) | Complete | None |
| Clinical Records | Medium (E2E) | Complete | None |
| Billing/Invoicing | High (E2E + Unit) | Complete | **Invoice editing** (feature flag controlled) |
| Authentication | High (E2E + Unit) | Complete | None |

### 3.2 Beta Features (Feature Flags)

| Feature | Flag | Default | Recommendation |
|---------|------|---------|----------------|
| **Invoice Editing** | `VITE_INVOICE_EDIT_ENABLED` | `true` | Disable in production until audit trail implemented |

### 3.3 Incomplete/Deferred Features

| Feature | Status | Blocker |
|---------|--------|---------|
| **Automated Backups** | Not Implemented | Requires infrastructure provisioning |
| **Monitoring/Alerting** | Not Implemented | Requires APM/error tracking service |
| **2FA (Two-Factor Auth)** | Not Implemented | Security enhancement for v1.1 |
| **Audit Logs** | Partially Implemented | Doctrine lifecycle events logged, but no UI |
| **Rate Limiting** | Not Implemented | Security enhancement for production |

---

## 4. Project Phases

### 4.1 Phase 0: Legacy Analysis & Planning (COMPLETED)

**Objective:** Understand legacy system and define modernization strategy

**Duration:** Estimated 2-3 weeks

**Deliverables:**
- ✅ Legacy database schema analysis (MariaDB → DDD entity mapping)
- ✅ Data migration scripts (SQL → Symfony fixtures)
- ✅ Technology stack selection (Symfony 7.4, React 18, MariaDB 11, Redis 7)
- ✅ DDD architectural blueprint (Domain, Application, Infrastructure layers)

---

### 4.2 Phase 1: Core Domain Implementation (COMPLETED)

**Objective:** Implement critical business capabilities

**Duration:** Estimated 8-10 weeks (iterative development)

**Deliverables:**
- ✅ Patient Management (CRUD, search, status)
- ✅ Appointment Scheduling (calendar, conflict detection, gap management)
- ✅ Clinical Records (creation, timeline view)
- ✅ Authentication (JWT stateless)
- ✅ Database migrations (Doctrine schema)
- ✅ Docker development environment

**Key Milestones:**
- ✅ First patient created in system
- ✅ First appointment scheduled without conflict
- ✅ First clinical record documented
- ✅ Authentication flow validated

---

### 4.3 Phase 2: Billing & Invoicing (COMPLETED)

**Objective:** Enable revenue operations

**Duration:** Estimated 3-4 weeks

**Deliverables:**
- ✅ Customer entity (separate from patients)
- ✅ Invoice creation with line items
- ✅ Sequential invoice numbering (no gaps/duplicates)
- ✅ PDF export with company branding
- ✅ Invoice search/filter
- ✅ Invoice number gap detection

**Key Milestones:**
- ✅ First invoice generated with sequential number
- ✅ PDF export validated (logo, formatting)
- ✅ Invoice search by customer name working
- ✅ Gap detection endpoint functional

---

### 4.4 Phase 3: Testing & Quality Assurance (COMPLETED)

**Objective:** Ensure production readiness

**Duration:** Estimated 2-3 weeks

**Deliverables:**
- ✅ PHPUnit test suite (backend logic)
- ✅ Playwright E2E test suite (user workflows)
- ✅ CI/CD pipeline (GitHub Actions)
- ✅ Docker test environment (isolated from dev)
- ✅ Code quality tools (PHPStan, PHP-CS-Fixer)

**Key Milestones:**
- ✅ CI/CD pipeline passing
- ✅ E2E tests covering critical workflows (login, patient creation, appointment scheduling, invoice generation)
- ✅ PHPStan Level 8 compliance
- ✅ No critical security vulnerabilities (basic OWASP checks)

---

### 4.5 Phase 4: Production Preparation (CURRENT PHASE)

**Objective:** Deploy to production environment

**Duration:** Estimated 4-6 weeks

**Status:** 🚧 **IN PROGRESS** (Documentation, infrastructure setup pending)

**Deliverables:**
- ⚠️ Production infrastructure (cloud hosting, managed database, Redis)
- ⚠️ SSL/TLS certificate configuration
- ⚠️ Automated backup/restore procedures
- ⚠️ Monitoring & alerting (APM, error tracking)
- ⚠️ Security audit (penetration testing)
- ⚠️ GDPR compliance review
- ⚠️ User training materials
- ⚠️ Operations runbook
- 🔄 **This documentation set** (Enterprise documentation)

**Key Milestones:**
- [ ] Infrastructure provisioned (VPS/Cloud)
- [ ] Database backups automated (daily, 30-day retention)
- [ ] SSL certificate installed
- [ ] Monitoring dashboards operational
- [ ] Security audit passed
- [ ] User Acceptance Testing (UAT) completed
- [ ] Go-Live readiness sign-off

**Blockers/Risks:**
- Infrastructure provider selection (AWS, DigitalOcean, Hetzner?)
- SSL certificate procurement
- Data migration validation (if legacy system still in use)

---

## 5. Future Roadmap (Post-Production)

### 5.1 Version 1.1 (Q2 2026 - Target)

**Theme:** Operational Excellence

**Proposed Features:**
1. **Appointment Reminders (SMS/Email)**
   - **Why:** Reduce no-show rate by 30-40%
   - **Effort:** 2-3 weeks
   - **Dependencies:** Twilio/SendGrid integration

2. **Audit Trail UI**
   - **Why:** Visibility into who changed what, when
   - **Effort:** 1-2 weeks
   - **Dependencies:** None (backend events already logged)

3. **Two-Factor Authentication (2FA)**
   - **Why:** Enhanced security for admin accounts
   - **Effort:** 1 week
   - **Dependencies:** TOTP library (Google Authenticator compatible)

4. **Advanced Search Filters**
   - **Why:** Find patients by phone, email, date of birth
   - **Effort:** 1 week
   - **Dependencies:** None

5. **Dashboard Metrics**
   - **Why:** Quick insights (appointments today, revenue this month)
   - **Effort:** 1 week
   - **Dependencies:** Dashboard component already exists (basic)

**Estimated Timeline:** 6-8 weeks development + 2 weeks QA

---

### 5.2 Version 1.2 (Q3 2026 - Target)

**Theme:** Patient Experience

**Proposed Features:**
1. **Patient Portal (Self-Service)**
   - **Why:** Patients can book appointments, view records
   - **Effort:** 6-8 weeks
   - **Dependencies:** Public API security review, patient authentication

2. **Appointment Waitlist**
   - **Why:** Fill cancellations automatically
   - **Effort:** 2 weeks
   - **Dependencies:** Notification system (SMS/Email)

3. **Customizable Invoice Templates**
   - **Why:** Branding flexibility
   - **Effort:** 2 weeks
   - **Dependencies:** Template engine (Twig already available)

**Estimated Timeline:** 10-12 weeks development + 3 weeks QA

---

### 5.3 Version 2.0 (Q1 2027 - Target)

**Theme:** Enterprise Scalability

**Proposed Features:**
1. **Multi-Clinic Support**
   - **Why:** Support franchises, multi-location practices
   - **Effort:** 8-10 weeks
   - **Dependencies:** Multi-tenancy architecture redesign

2. **Business Intelligence Dashboard**
   - **Why:** Revenue trends, patient demographics, practitioner performance
   - **Effort:** 4-6 weeks
   - **Dependencies:** Sufficient data volume (1+ year operational)

3. **EHR Integration (HL7/FHIR)**
   - **Why:** Interoperability with national health systems
   - **Effort:** 12-16 weeks
   - **Dependencies:** Regulatory approval, HL7 certification

4. **Mobile Native Apps (iOS/Android)**
   - **Why:** Offline mode, native notifications
   - **Effort:** 16-20 weeks
   - **Dependencies:** React Native or Flutter expertise

**Estimated Timeline:** 40-50 weeks development + 8-10 weeks QA

---

## 6. Dependencies & Constraints

### 6.1 Internal Dependencies

| Dependency | Impact | Owner | Status |
|------------|--------|-------|--------|
| **Infrastructure Team** | Production deployment | DevOps | ⚠️ Not assigned |
| **Security Team** | Penetration testing | Security Officer | ⚠️ Not scheduled |
| **Legal/Compliance** | GDPR review | Legal Advisor | ⚠️ Not initiated |
| **Training Team** | User onboarding | HR/Operations | ⚠️ Not scheduled |

### 6.2 External Dependencies

| Dependency | Impact | Vendor | Status |
|------------|--------|--------|--------|
| **Cloud Provider** | Hosting infrastructure | TBD (AWS/DO/Hetzner) | ⚠️ Not selected |
| **SSL Certificate** | HTTPS security | Let's Encrypt / AWS ACM | ⚠️ Not configured |
| **Email Service** | Transactional emails | Sendgrid / Mailgun | ⚠️ Not configured |
| **SMS Provider** | Appointment reminders (v1.1) | Twilio / Vonage | ⚠️ Not evaluated |

### 6.3 Technical Constraints

| Constraint | Impact | Mitigation |
|------------|--------|------------|
| **PHP 8.4 Hosting** | Limited provider options | Use Docker-compatible hosts |
| **MariaDB 11 Support** | Not all managed services support | Self-host or use DigitalOcean |
| **Single Database** | No read scaling | Add read replicas if needed (v2.0) |
| **No CDN** | Slow asset delivery for distant users | Add CloudFront/Cloudflare (production) |

---

## 7. Milestones & Critical Path

### 7.1 Completed Milestones

| Milestone | Completion Date | Notes |
|-----------|----------------|-------|
| **M1: Database Schema Designed** | ✅ Completed | Doctrine entities + migrations |
| **M2: Authentication Working** | ✅ Completed | JWT login functional |
| **M3: Patient CRUD Functional** | ✅ Completed | Full lifecycle tested |
| **M4: Appointment Scheduling Live** | ✅ Completed | Calendar views + conflict detection |
| **M5: Invoicing Operational** | ✅ Completed | PDF export validated |
| **M6: CI/CD Pipeline Passing** | ✅ Completed | GitHub Actions green |

### 7.2 Upcoming Milestones (Production Path)

| Milestone | Target Date | Owner | Dependencies |
|-----------|-------------|-------|--------------|
| **M7: Enterprise Documentation Complete** | ✅ **Dec 30, 2025** | Product/Arch Team | This document set |
| **M8: Infrastructure Provisioned** | Jan 15, 2026 | DevOps | Cloud provider selection |
| **M9: Security Audit Passed** | Jan 30, 2026 | Security Officer | External auditor |
| **M10: User Training Completed** | Feb 15, 2026 | Operations | Training materials |
| **M11: UAT Sign-Off** | Feb 28, 2026 | Clinic Director | Test data, user scenarios |
| **M12: Production Go-Live** | Mar 15, 2026 | Program Manager | All blockers resolved |

**Critical Path:** M8 (Infrastructure) → M9 (Security) → M11 (UAT) → M12 (Go-Live)

---

## 8. Resource Requirements

### 8.1 Team Composition (Current)

| Role | Allocation | Responsibilities |
|------|-----------|------------------|
| **Full-Stack Engineer** | 100% | Feature development, bug fixes, deployments |
| **Product Owner** | 20% | Requirements clarification, UAT |
| **Architect** | 10% | Design review, technical decisions |

### 8.2 Additional Resources Needed (Production)

| Role | Allocation | Urgency | Justification |
|------|-----------|---------|---------------|
| **DevOps Engineer** | 40% (1-2 months) | High | Infrastructure setup, CI/CD optimization |
| **Security Auditor** | External (1 week) | High | Penetration testing, GDPR compliance |
| **Technical Writer** | 20% (2 weeks) | Medium | User manuals, operations runbook |
| **QA Tester** | 50% (2 weeks) | Medium | UAT coordination, regression testing |

---

## 9. Risk-Adjusted Timeline

### 9.1 Best Case (Optimistic)

- **Go-Live Date:** March 1, 2026
- **Assumptions:** No infrastructure delays, security audit passed on first attempt, no major bugs in UAT

### 9.2 Most Likely (Realistic)

- **Go-Live Date:** March 15, 2026
- **Assumptions:** Minor infrastructure delays, 1-2 security findings requiring fixes, minor UAT feedback

### 9.3 Worst Case (Pessimistic)

- **Go-Live Date:** April 15, 2026
- **Assumptions:** Infrastructure provisioning delays (2 weeks), security audit failures requiring architecture changes, UAT identifies critical bugs

**Recommendation:** Commit to **March 15, 2026** publicly; plan for **April 1, 2026** internally.

---

## 10. Change Management Process

### 10.1 Scope Change Request (CR) Workflow

1. **Requestor** submits CR with:
   - Feature description
   - Business justification
   - Acceptance criteria
   - Priority (Critical/High/Medium/Low)

2. **Product Owner** reviews:
   - Alignment with product vision
   - Impact on existing scope
   - Resource implications

3. **Technical Lead** assesses:
   - Effort estimate (story points or days)
   - Technical risk
   - Dependencies

4. **Steering Committee** decides:
   - Approve (add to backlog)
   - Defer (add to roadmap)
   - Reject (document rationale)

5. **Program Manager** updates:
   - Scope baseline
   - Timeline (if approved for current phase)
   - Stakeholder communication

### 10.2 Change Approval Authority

| Change Impact | Approver |
|---------------|----------|
| **Low** (< 1 day effort, no timeline impact) | Product Owner |
| **Medium** (1-5 days effort, may delay milestone by < 1 week) | Steering Committee |
| **High** (> 5 days effort, delays Go-Live > 1 week) | Executive Sponsor |

---

## 11. Communication Plan

### 11.1 Stakeholder Updates

| Audience | Frequency | Format | Owner |
|----------|-----------|--------|-------|
| **Clinic Director** | Weekly | Email status update | Program Manager |
| **Engineering Team** | Daily | Standup (15 min) | Technical Lead |
| **End Users** | Monthly | Newsletter (feature highlights) | Product Owner |
| **Executive Sponsor** | Bi-weekly | Dashboard + briefing | Program Manager |

### 11.2 Escalation Path

1. **Technical Issues** → Technical Lead → Architect → CTO
2. **Scope Conflicts** → Product Owner → Steering Committee → Executive Sponsor
3. **Resource Constraints** → Program Manager → HR/Finance → Executive Sponsor

---

## 12. Success Criteria (Phase 4: Production)

| Criterion | Target | Measurement |
|-----------|--------|-------------|
| **System Uptime (first 30 days)** | > 99.0% | Pingdom/UptimeRobot |
| **User Adoption (clinic staff)** | > 90% within 30 days | Login analytics |
| **Critical Bugs (P0/P1)** | < 5 in first 30 days | Issue tracker |
| **User Satisfaction** | NPS > 7.0 | Post-training surveys |
| **Data Migration Success** | 100% (zero data loss) | Validation queries |

---

**Document End**
