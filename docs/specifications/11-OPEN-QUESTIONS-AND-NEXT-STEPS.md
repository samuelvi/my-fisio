# Open Questions & Next Steps
## Physiotherapy Clinic Management System

**Document Version:** 1.0
**Last Updated:** December 30, 2025
**Classification:** Internal - Strategic
**Owner:** Product Owner & Steering Committee

---

## 1. Executive Summary

This document catalogs open questions, pending decisions, and recommended next steps for the Physiotherapy Clinic Management System. It serves as a living document to track unresolved issues that require stakeholder input, technical investigation, or policy clarification before production deployment or future development phases.

### 1.1 Document Purpose

This document provides:
1. **Decision Log:** Tracks pending decisions and their owners
2. **Prioritization:** Identifies which questions are blockers vs. nice-to-have
3. **Action Items:** Clear next steps with owners and deadlines
4. **Accountability:** Ensures no question falls through the cracks

### 1.2 Status Summary

| Category | Open Questions | Critical | High | Medium | Low |
|----------|---------------|----------|------|--------|-----|
| **Business & Policy** | 8 | 2 | 3 | 2 | 1 |
| **Technical** | 7 | 1 | 2 | 3 | 1 |
| **Security & Compliance** | 6 | 3 | 2 | 1 | 0 |
| **Operational** | 5 | 1 | 2 | 2 | 0 |
| **Future Enhancements** | 12 | 0 | 4 | 6 | 2 |
| **Total** | 38 | 7 | 13 | 14 | 4 |

**Pre-Production Blockers:** 7 critical questions must be resolved before go-live

---

## 2. Business & Policy Questions

### 2.1 Critical Business Questions

#### BQ-001: Invoice Editing Policy

**Question:** Should invoices be editable after creation? If yes, under what conditions?

**Context:**
- Current: Feature flag `VITE_INVOICE_EDIT_ENABLED` allows editing (default: enabled)
- Concern: Editing invoices may violate audit trail requirements
- Tax law: Invoices should be immutable once issued to customer

**Options:**
| Option | Pros | Cons |
|--------|------|------|
| **A: Never Editable** | Compliant, simple | Cannot fix typos, must void and reissue |
| **B: Editable for 24 hours** | Fix mistakes, grace period | Requires versioning, audit trail |
| **C: Editable with audit trail** | Full flexibility, traceable | Complex implementation |
| **D: Admin-only editing** | Controlled, traceable | Doesn't help regular users |

**Recommendation:** Option A (Never Editable) for production
- Void invoice feature (mark as cancelled, create new invoice)
- Simple, compliant, no audit trail complexity

**Decision Needed By:** January 15, 2026
**Decision Maker:** Clinic Director + Legal Advisor
**Impact if Not Decided:** Deployment delayed (compliance risk)
**Status:** ⚠️ BLOCKER

---

#### BQ-002: Clinical Record Immutability

**Question:** Should clinical records be editable? If yes, with what safeguards?

**Context:**
- Current: Records are immutable (no edit functionality)
- Rationale: Medical records should not be altered (audit compliance)
- User Feedback: Practitioners want to correct typos or add forgotten information

**Options:**
| Option | Pros | Cons |
|--------|------|------|
| **A: Immutable (current)** | Compliant, simple | Cannot fix errors, create new record for corrections |
| **B: Versioned editing** | Traceability, flexibility | Complex, requires versioning system |
| **C: Amendment notes** | Clear corrections, audit trail | UI complexity (show original + amendment) |
| **D: Editable within 1 hour** | Grace period for typos | Arbitrary time limit, still requires audit trail |

**Recommendation:** Option A (Immutable) OR Option C (Amendment Notes)
- Option A: Keep current behavior (simplest)
- Option C: Add "Addendum" feature (append correction note to record)

**Decision Needed By:** January 15, 2026 (not blocking production)
**Decision Maker:** Clinic Director + Medical Officer
**Impact if Not Decided:** User inconvenience (workaround: create new record)
**Status:** High Priority

---

### 2.2 High Priority Business Questions

#### BQ-003: Patient Portal Requirement

**Question:** Is a patient-facing portal (self-booking, record access) required for MVP or v1.1?

**Context:**
- Current: Internal-only system (clinic staff access only)
- Patient requests: Can patients book appointments online? View their records?
- Competitive landscape: Many clinics offer online booking

**Implications:**
- **If Yes:** Significant development effort (6-8 weeks), requires public authentication
- **If No:** Defer to v1.2 or later, manual appointment booking continues

**Recommendation:** Defer to v1.2 (Q3 2026)
- MVP: Internal system only (reduce complexity)
- v1.1: Appointment reminders (higher ROI than self-booking)
- v1.2: Patient portal with self-booking and record access

**Decision Needed By:** February 1, 2026 (roadmap planning)
**Decision Maker:** Clinic Director + Product Owner
**Impact if Not Decided:** Roadmap uncertainty
**Status:** High Priority

---

#### BQ-004: Multi-Clinic Expansion Plans

**Question:** Will the clinic expand to multiple locations? If yes, when?

**Context:**
- Current: Single-clinic architecture (no multi-tenancy)
- Future: If multi-location, requires significant refactoring (tenant isolation)

**Implications:**
- **If Yes (near-term):** Consider multi-tenant architecture now (avoid costly refactoring later)
- **If No (3+ years):** Current architecture sufficient, defer multi-tenancy to v2.0

**Recommendation:** Clarify expansion timeline
- If expansion within 1 year: Start multi-tenant planning now
- If expansion 3+ years: Current architecture acceptable

**Decision Needed By:** February 15, 2026 (architecture planning)
**Decision Maker:** Clinic Director (business strategy)
**Impact if Not Decided:** Potential costly refactoring if expansion happens sooner than expected
**Status:** High Priority

---

#### BQ-005: Payment Processing Integration

**Question:** Will online payment processing (credit card, PayPal) be required? If yes, when?

**Context:**
- Current: Invoices generated, payment manual (cash, bank transfer)
- Patient requests: Can I pay online?
- Compliance: PCI-DSS required for credit card processing

**Implications:**
- **If Yes:** Payment gateway integration (Stripe, Redsys), PCI-DSS compliance, refund handling
- **If No:** Continue manual payment processing (simpler, no compliance burden)

**Recommendation:** Defer to v2.0 (Q1 2027)
- MVP: Manual payments sufficient
- v1.x: Focus on operational features (reminders, reporting)
- v2.0: Payment processing with PCI-DSS compliance

**Decision Needed By:** March 1, 2026 (roadmap planning)
**Decision Maker:** Clinic Director + Finance
**Impact if Not Decided:** Roadmap uncertainty
**Status:** Medium Priority

---

### 2.3 Medium Priority Business Questions

#### BQ-006: Appointment Reminder Strategy

**Question:** Should appointment reminders be SMS, email, or both? What timing (24h, 48h, 1 week)?

**Context:**
- User feedback: Appointment reminders reduce no-shows by 30-40%
- Options: SMS (higher open rate, costs per message), Email (free, lower open rate)

**Recommendation:** Email + SMS (configurable per patient preference)
- Default: Email 24 hours before appointment
- Option: SMS for patients who request it
- Timing: 24 hours before (industry standard)

**Decision Needed By:** February 15, 2026 (v1.1 planning)
**Decision Maker:** Clinic Director + Operations Manager
**Impact if Not Decided:** Suboptimal reminder strategy
**Status:** Medium Priority

---

#### BQ-007: Appointment Cancellation Policy

**Question:** Should patients be able to cancel appointments online (if patient portal implemented)?

**Context:**
- Clinic policy: 24-hour cancellation notice required
- Risk: Last-minute cancellations reduce revenue

**Options:**
- Allow cancellation up to 24 hours before appointment
- Allow cancellation anytime (clinic discretion for late cancellations)
- Require phone call for cancellations (no online cancellation)

**Recommendation:** Defer to v1.2 (when patient portal implemented)
- Policy: Allow online cancellation up to 24 hours before appointment
- Late cancellations: System warns patient of policy, logs cancellation for clinic review

**Decision Needed By:** March 1, 2026 (patient portal planning)
**Decision Maker:** Clinic Director
**Impact if Not Decided:** Not blocking (patient portal not in MVP)
**Status:** Medium Priority

---

### 2.4 Low Priority Business Questions

#### BQ-008: Referral Tracking

**Question:** Should system track patient referrals (who referred the patient)? If yes, for analytics or rewards?

**Context:**
- Referrals are common source of new patients
- Tracking: Patient referred by another patient, or by doctor

**Recommendation:** Add in v1.3 (low priority)
- Field in patient form: "Referred by" (free text or patient selector)
- Analytics: Report on top referrers (v2.0 reporting module)

**Decision Needed By:** March 15, 2026 (v1.3 planning)
**Decision Maker:** Marketing Manager (if applicable)
**Impact if Not Decided:** Manual tracking continues
**Status:** Low Priority

---

## 3. Technical Questions

### 3.1 Critical Technical Questions

#### TQ-001: Database Encryption Strategy

**Question:** Should database encryption at rest be enabled before production? Which encryption method?

**Context:**
- Current: Database stored in plaintext
- GDPR: Recommends encryption for sensitive data
- MariaDB: Supports InnoDB table encryption (transparent data encryption)

**Options:**
| Option | Pros | Cons |
|--------|------|------|
| **A: No encryption** | Simple, no performance impact | GDPR compliance risk |
| **B: Full disk encryption** | Protects all data, OS-level | Doesn't protect against database dump theft |
| **C: InnoDB encryption** | Database-level, granular | Slight performance impact (~5%), key management |
| **D: Application-level encryption** | Field-level control | Complex, breaks queries (can't search encrypted fields) |

**Recommendation:** Option C (InnoDB Encryption)
- Enable encryption for all tables
- Use file-based key management (or AWS KMS in cloud)
- Performance impact acceptable (<5%)

**Decision Needed By:** January 15, 2026
**Decision Maker:** Security Officer + DBA
**Impact if Not Decided:** Compliance risk (GDPR audit may require encryption)
**Status:** ⚠️ BLOCKER

---

### 3.2 High Priority Technical Questions

#### TQ-002: Hosting Provider Selection

**Question:** Which hosting provider should be used for production? AWS, DigitalOcean, Hetzner, or self-hosted?

**Context:**
- Requirements: PHP 8.4, MariaDB 11, Redis, Docker support, EU data residency
- Options:
  - **AWS:** Most features, expensive, complex
  - **DigitalOcean:** Simple, affordable, managed databases
  - **Hetzner:** Cheapest, EU-based, VPS-only (no managed services)
  - **Self-hosted:** Full control, requires sysadmin expertise

**Recommendation:** DigitalOcean
- Managed MariaDB database (automated backups)
- Managed Redis (high availability)
- EU region (Frankfurt, Amsterdam) for GDPR compliance
- Cost: ~€50-100/month (vs AWS ~€200-300/month)

**Decision Needed By:** January 15, 2026 (infrastructure setup)
**Decision Maker:** DevOps Engineer + Finance
**Impact if Not Decided:** Cannot provision infrastructure
**Status:** High Priority

---

#### TQ-003: SSL Certificate Source

**Question:** Should SSL certificate be from Let's Encrypt (free) or commercial CA (DigiCert, Sectigo)?

**Context:**
- Let's Encrypt: Free, auto-renewal, widely trusted
- Commercial CA: Paid (~€100/year), extended validation (EV), higher trust

**Recommendation:** Let's Encrypt
- Free, automated renewal (Certbot)
- Trusted by all modern browsers
- EV certificate not required (clinic website, not e-commerce)

**Decision Needed By:** January 20, 2026 (infrastructure setup)
**Decision Maker:** DevOps Engineer
**Impact if Not Decided:** HTTPS not configured (blocking production)
**Status:** High Priority

---

### 3.3 Medium Priority Technical Questions

#### TQ-004: Monitoring & APM Tool Selection

**Question:** Which monitoring/APM tool should be used? New Relic, Datadog, Sentry, self-hosted (Prometheus)?

**Context:**
- Requirements: Error tracking, performance monitoring, uptime alerts
- Options:
  - **New Relic:** Full APM, expensive (~€100/month)
  - **Datadog:** Full observability, expensive (~€150/month)
  - **Sentry:** Error tracking only, affordable (~€26/month)
  - **Prometheus + Grafana:** Self-hosted, free, requires setup

**Recommendation:** Start with Sentry (error tracking) + UptimeRobot (uptime monitoring)
- Cost: ~€26/month (Sentry) + free (UptimeRobot)
- Upgrade to full APM (New Relic) if performance issues arise

**Decision Needed By:** February 1, 2026 (production setup)
**Decision Maker:** DevOps Engineer
**Impact if Not Decided:** No error tracking (harder to debug production issues)
**Status:** Medium Priority

---

#### TQ-005: Backup Retention Policy

**Question:** How long should database backups be retained? Daily, weekly, monthly, yearly?

**Context:**
- Regulatory: Medical records must be retained 15 years
- Practical: Long retention increases storage costs

**Recommendation:** 3-2-1 Backup Strategy
- **3 copies:** Original + 2 backups
- **2 media:** Disk + cloud (S3)
- **1 offsite:** S3 or external storage

**Retention:**
- Daily backups: 30 days
- Monthly backups: 12 months
- Yearly backups: 7 years (legal requirement: 15 years, but active database sufficient beyond 7 years)

**Decision Needed By:** January 20, 2026 (backup automation)
**Decision Maker:** DBA + Legal Advisor
**Impact if Not Decided:** Suboptimal backup strategy
**Status:** Medium Priority

---

#### TQ-006: CDN Requirement

**Question:** Should a CDN (CloudFront, Cloudflare) be used for static assets?

**Context:**
- Current: Static assets served from application server
- CDN benefits: Faster load times, reduced bandwidth costs, DDoS protection
- Cost: CloudFront ~€10-20/month, Cloudflare Free plan available

**Recommendation:** Defer to v1.2 (not critical for MVP)
- MVP: Users on local network (clinic Wi-Fi), latency not an issue
- v1.2: Add Cloudflare Free plan (easy, free DDoS protection)

**Decision Needed By:** March 1, 2026 (v1.2 planning)
**Decision Maker:** DevOps Engineer
**Impact if Not Decided:** Acceptable performance for local users
**Status:** Medium Priority

---

#### TQ-007: Code Splitting Strategy

**Question:** Should frontend bundle be split (lazy loading) to reduce initial load time?

**Context:**
- Current: Single JavaScript bundle (~500KB minified)
- Code splitting: Load only code needed for current page
- Benefit: Faster initial page load (especially on mobile)

**Recommendation:** Defer to v1.3 (optimization phase)
- MVP: Single bundle acceptable (clinic users on fast Wi-Fi)
- v1.3: Implement code splitting if performance becomes issue

**Decision Needed By:** March 15, 2026 (v1.3 planning)
**Decision Maker:** Frontend Lead
**Impact if Not Decided:** Acceptable load times for now
**Status:** Medium Priority

---

### 3.4 Low Priority Technical Questions

#### TQ-008: Docker Registry Choice

**Question:** Should Docker images be stored in DockerHub, GitHub Container Registry (ghcr.io), or private registry?

**Context:**
- DockerHub: Free for public images, rate limits on free tier
- GitHub Container Registry: Free, integrated with GitHub Actions
- Private Registry (Harbor): Full control, requires hosting

**Recommendation:** GitHub Container Registry (ghcr.io)
- Free, no rate limits
- Integrated with GitHub Actions CI/CD
- Private images supported

**Decision Needed By:** February 1, 2026 (CI/CD setup)
**Decision Maker:** DevOps Engineer
**Impact if Not Decided:** Use DockerHub (acceptable, may hit rate limits)
**Status:** Low Priority

---

## 4. Security & Compliance Questions

### 4.1 Critical Security Questions

#### SQ-001: GDPR Legal Basis for Processing

**Question:** What is the legal basis for processing patient medical data under GDPR?

**Context:**
- GDPR Article 6: Lawful basis for personal data processing
- GDPR Article 9: Special category data (health data) requires explicit consent or legal basis

**Options:**
| Legal Basis | GDPR Article | Pros | Cons |
|-------------|--------------|------|------|
| **Consent** | Art. 6(1)(a), 9(2)(a) | Clear, patient-controlled | Must obtain explicit consent, can be withdrawn |
| **Contract** | Art. 6(1)(b) | Necessary for patient care | Only covers data necessary for contract |
| **Legal Obligation** | Art. 6(1)(c), 9(2)(h) | Medical records legally required | Limited to legal retention |
| **Vital Interests** | Art. 6(1)(d), 9(2)(c) | Emergency care | Not applicable for routine care |

**Recommendation:** Combination of Contract + Legal Obligation
- Contract: Patient care delivery (appointments, treatments)
- Legal Obligation: Medical records retention (15 years Spain law)
- **Action Required:** Document legal basis in privacy policy, obtain patient acknowledgment

**Decision Needed By:** January 10, 2026
**Decision Maker:** Legal Advisor
**Impact if Not Decided:** GDPR violation (fines up to €20M or 4% revenue)
**Status:** ⚠️ BLOCKER

---

#### SQ-002: Data Processor Agreements (DPA)

**Question:** Are Data Processor Agreements (DPA) required with hosting provider and third-party services?

**Context:**
- GDPR Article 28: Controller-Processor relationship requires written agreement
- Services used: Hosting provider (DigitalOcean), email provider (SendGrid), SMS provider (Twilio)

**Requirement:**
- DPA with each processor
- Terms: Data confidentiality, security measures, breach notification, data deletion

**Recommendation:** Execute DPAs before production
- DigitalOcean: Offers standard DPA (sign online)
- SendGrid/Twilio: Offers GDPR-compliant terms (accept during signup)

**Decision Needed By:** January 15, 2026
**Decision Maker:** Legal Advisor + Procurement
**Impact if Not Decided:** GDPR violation (non-compliant data processing)
**Status:** ⚠️ BLOCKER

---

#### SQ-003: Penetration Test Scope

**Question:** What should be the scope of the external penetration test?

**Context:**
- Requirement: External security audit before production
- Scope options:
  - **Option A:** Web application only (API + frontend)
  - **Option B:** Web application + infrastructure (server, database)
  - **Option C:** Full stack + social engineering (phishing tests)

**Recommendation:** Option B (Web Application + Infrastructure)
- Test: OWASP Top 10, authentication, authorization, data leakage
- Infrastructure: Server hardening, firewall, database access controls
- Exclude: Social engineering (out of scope for technical audit)

**Decision Needed By:** January 10, 2026 (schedule auditor)
**Decision Maker:** Security Officer
**Impact if Not Decided:** Incomplete security validation
**Status:** ⚠️ BLOCKER

---

### 4.2 High Priority Security Questions

#### SQ-004: Password Policy Enforcement

**Question:** What password policy should be enforced? Complexity requirements, expiration, history?

**Context:**
- Current: No password policy (any password accepted)
- Best Practice: NIST guidelines (length > complexity, no periodic expiration)

**Recommendation:** NIST-Aligned Policy
- Minimum length: 12 characters
- Complexity: Optional (length is more important)
- Expiration: No periodic expiration (only on compromise)
- History: Prevent reuse of last 3 passwords

**Decision Needed By:** January 20, 2026 (implement before production)
**Decision Maker:** Security Officer
**Impact if Not Decided:** Weak passwords, account takeover risk
**Status:** High Priority

---

#### SQ-005: Two-Factor Authentication (2FA) Requirement

**Question:** Should 2FA be mandatory for all users, optional, or admin-only?

**Context:**
- Current: No 2FA (password-only authentication)
- Security: 2FA reduces account takeover risk by 99%
- User Experience: Adds friction (extra step at login)

**Recommendation:** Mandatory for Admin, Optional for Users
- Admin accounts: 2FA required (TOTP via Google Authenticator)
- Regular users: 2FA optional (encourage but not enforce)
- Implementation: v1.1 (Q2 2026)

**Decision Needed By:** February 1, 2026 (v1.1 planning)
**Decision Maker:** Security Officer + Clinic Director
**Impact if Not Decided:** Higher account takeover risk
**Status:** High Priority

---

### 4.3 Medium Priority Security Questions

#### SQ-006: Audit Log Retention

**Question:** How long should audit logs (login attempts, data access) be retained?

**Context:**
- GDPR: Audit logs may contain personal data (user emails, IP addresses)
- Security: Long retention helps forensic investigation
- Storage: Long retention increases costs

**Recommendation:** 90 Days (Standard Industry Practice)
- Login logs: 90 days
- Data access logs: 90 days
- Exception: Security incidents (retain indefinitely)

**Decision Needed By:** February 15, 2026 (audit logging implementation)
**Decision Maker:** Security Officer + Legal Advisor
**Impact if Not Decided:** Suboptimal retention (too short or too long)
**Status:** Medium Priority

---

## 5. Operational Questions

### 5.1 Critical Operational Questions

#### OQ-001: Support Hours & SLA

**Question:** What are support hours? What is the response time SLA for production issues?

**Context:**
- Clinic hours: Monday-Friday 8am-8pm, Saturday 9am-2pm
- Current: No defined support SLA (best-effort)

**Recommendation:** Business Hours Support
- **Support Hours:** Monday-Friday 9am-6pm (Spain time)
- **SLA:**
  - P0 (Critical - system down): 1 hour response, 4 hour resolution
  - P1 (High - major feature broken): 4 hour response, 1 day resolution
  - P2 (Medium - minor bug): 1 day response, 3 day resolution
  - P3 (Low - enhancement request): Best effort

**Decision Needed By:** January 20, 2026 (document support policy)
**Decision Maker:** Clinic Director + IT Manager
**Impact if Not Decided:** Unclear expectations, user frustration
**Status:** ⚠️ BLOCKER

---

### 5.2 High Priority Operational Questions

#### OQ-002: Deployment Frequency

**Question:** How often will production deployments occur? Weekly, bi-weekly, monthly?

**Context:**
- Current: Ad-hoc deployments (when features ready)
- Best Practice: Regular release cadence (predictable, less risky)

**Recommendation:** Bi-Weekly Deployments
- Cadence: Every other Friday (low-traffic day)
- Maintenance Window: Friday 6pm-8pm (after clinic closes)
- Exception: Hotfixes for critical bugs (deploy ASAP)

**Decision Needed By:** February 1, 2026 (establish release process)
**Decision Maker:** DevOps Engineer + Clinic Director
**Impact if Not Decided:** Ad-hoc deployments (higher risk)
**Status:** High Priority

---

#### OQ-003: Downtime Communication

**Question:** How should planned/unplanned downtime be communicated to users?

**Context:**
- Planned: Deployments, maintenance
- Unplanned: Server outage, critical bug

**Recommendation:** Multi-Channel Notification
- **Planned Downtime:**
  - Email: 3 days before deployment (notify all users)
  - In-app banner: 24 hours before (visible when logged in)
  - Status page: clinic.example.com/status (public)
- **Unplanned Downtime:**
  - Status page update: Immediate
  - Email: Within 15 minutes
  - SMS: For critical outages (optional)

**Decision Needed By:** February 1, 2026 (set up status page)
**Decision Maker:** Operations Manager
**Impact if Not Decided:** Poor communication, user frustration
**Status:** High Priority

---

### 5.3 Medium Priority Operational Questions

#### OQ-004: User Onboarding Process

**Question:** What is the onboarding process for new clinic staff?

**Context:**
- Current: Ad-hoc (no formal process)
- New hires need: Account creation, training, access to test environment

**Recommendation:** Structured Onboarding Checklist
1. **Pre-Day 1:** IT creates user account, assigns role
2. **Day 1:** User receives welcome email with login credentials
3. **Day 2:** Hands-on training session (2 hours)
4. **Week 1:** Shadow existing user, practice in test environment
5. **Week 2:** Full access, supervisor monitors for errors

**Decision Needed By:** February 15, 2026 (document process)
**Decision Maker:** HR + IT Manager
**Impact if Not Decided:** Inconsistent training, user errors
**Status:** Medium Priority

---

#### OQ-005: System Retirement Plan

**Question:** If system is replaced in future, what is the data export/migration strategy?

**Context:**
- Legal requirement: Medical records retained 15 years
- Data portability: Patients have right to their data

**Recommendation:** Data Export Script
- Export all data as JSON or SQL dump
- Include migration guide for future system
- Test export/import annually (ensure viability)

**Decision Needed By:** March 1, 2026 (document procedure)
**Decision Maker:** DBA + Legal Advisor
**Impact if Not Decided:** Difficult migration if system replaced
**Status:** Medium Priority

---

## 6. Future Enhancement Questions

### 6.1 High Priority Enhancements

#### FE-001: Appointment Reminder Implementation

**Question:** Which SMS/Email provider should be used for appointment reminders?

**Context:**
- Requirement: Automated reminders 24 hours before appointment
- Options:
  - **Twilio:** SMS provider, reliable, ~€0.08/SMS
  - **SendGrid:** Email provider, reliable, free tier (100 emails/day)
  - **Mailgun:** Email provider, free tier (5,000 emails/month)

**Recommendation:** SendGrid (Email) + Twilio (SMS)
- Email: SendGrid (free tier sufficient for small clinic)
- SMS: Twilio (pay-as-you-go, only for patients who opt-in)

**Decision Needed By:** March 1, 2026 (v1.1 planning)
**Decision Maker:** Product Owner
**Impact if Not Decided:** No reminders (higher no-show rate)
**Status:** High Priority (v1.1)

---

#### FE-002: Reporting Dashboard Requirements

**Question:** What metrics should be included in the v1.2 reporting dashboard?

**Context:**
- User request: Business intelligence reports
- Options: Revenue trends, patient demographics, appointment volume, practitioner productivity

**Recommendation:** Phase 1 Dashboard (v1.2)
- **Revenue:** Total revenue (monthly, yearly), revenue by service
- **Appointments:** Total appointments, cancellation rate, no-show rate
- **Patients:** New patients (monthly), active patients, patient retention
- **Practitioners:** Appointments per practitioner, utilization rate

**Decision Needed By:** March 15, 2026 (v1.2 planning)
**Decision Maker:** Clinic Director + Product Owner
**Impact if Not Decided:** Manual reporting continues
**Status:** High Priority (v1.2)

---

#### FE-003: File Upload Feature Scope

**Question:** What file types should be supported for patient attachments? What is the storage limit per patient?

**Context:**
- Requirement: Attach medical reports, X-rays, insurance documents
- Storage: S3 or local filesystem

**Recommendation:** Limited File Upload (v1.2)
- **File Types:** PDF, JPEG, PNG (no DICOM medical images)
- **Size Limit:** 10MB per file, 100MB per patient
- **Storage:** AWS S3 (or DigitalOcean Spaces)
- **Virus Scanning:** ClamAV or AWS S3 virus scanning

**Decision Needed By:** March 15, 2026 (v1.2 planning)
**Decision Maker:** Product Owner + IT Manager
**Impact if Not Decided:** No file attachments (external storage continues)
**Status:** High Priority (v1.2)

---

#### FE-004: Mobile App Requirement

**Question:** Is a native mobile app (iOS/Android) required, or is responsive web sufficient?

**Context:**
- Current: Responsive web (works on mobile browsers)
- Native app benefits: Offline mode, push notifications, better UX
- Cost: Native app ~16-20 weeks development (React Native or Flutter)

**Recommendation:** Defer to v2.0 (responsive web sufficient for now)
- MVP: Responsive web (accessible on mobile)
- v1.x: Optimize mobile UX (larger touch targets, simplified navigation)
- v2.0: Native app if user demand justifies cost

**Decision Needed By:** April 1, 2026 (v2.0 planning)
**Decision Maker:** Clinic Director + Product Owner
**Impact if Not Decided:** No mobile app (web-only)
**Status:** High Priority (v2.0)

---

### 6.2 Medium Priority Enhancements

#### FE-005: Multi-Language Expansion

**Question:** Should additional languages be supported beyond English/Spanish?

**Context:**
- Current: English + Spanish
- Potential: Catalan (common in Catalonia region)

**Recommendation:** Add Catalan in v1.3 (if clinic in Catalonia)
- Translation effort: ~2 days (duplicate Spanish translation structure)
- Maintenance: Ongoing translation updates for new features

**Decision Needed By:** April 15, 2026 (v1.3 planning)
**Decision Maker:** Clinic Director (geographic location)
**Impact if Not Decided:** English/Spanish only (acceptable for most of Spain)
**Status:** Medium Priority (v1.3)

---

#### FE-006: Calendar Integration (Google Calendar, Outlook)

**Question:** Should appointments sync to external calendars (Google Calendar, Outlook)?

**Context:**
- User request: Practitioners want appointments in their personal calendar
- Technical: Export as iCal file or CalDAV sync

**Recommendation:** iCal Export in v1.3
- Export: Download appointments as iCal file (.ics)
- Import: Users import to Google Calendar or Outlook
- Limitation: One-way sync (changes in external calendar don't sync back)

**Decision Needed By:** April 15, 2026 (v1.3 planning)
**Decision Maker:** Product Owner
**Impact if Not Decided:** Manual calendar management
**Status:** Medium Priority (v1.3)

---

#### FE-007: Prescription Management

**Question:** Should system support e-prescriptions (digital prescriptions)?

**Context:**
- Current: Practitioners write prescriptions on paper
- Requirement: Digital prescription database, integration with pharmacy

**Recommendation:** Defer indefinitely (complex regulatory requirement)
- Regulatory: E-prescriptions require certification, national system integration
- Cost: High (legal, technical)
- Workaround: Continue paper prescriptions

**Decision Needed By:** N/A (not prioritized)
**Decision Maker:** Clinic Director + Medical Officer
**Impact if Not Decided:** Paper prescriptions continue (acceptable)
**Status:** Medium Priority (future consideration)

---

#### FE-008: Treatment Plans (Care Plans)

**Question:** Should system support structured treatment plans (goals, exercises, timelines)?

**Context:**
- Current: Treatment plans documented in clinical record notes (free text)
- Structured: Predefined templates, progress tracking

**Recommendation:** Add in v2.0 (if user demand exists)
- Template: Goals, exercises, frequency, duration, progress milestones
- Tracking: Mark exercises as completed, track progress over time

**Decision Needed By:** May 1, 2026 (v2.0 planning)
**Decision Maker:** Medical Officer + Product Owner
**Impact if Not Decided:** Free-text treatment plans continue
**Status:** Medium Priority (v2.0)

---

#### FE-009: Inventory Management

**Question:** Should system track medical supplies (bandages, creams, equipment)?

**Context:**
- Current: No inventory tracking (manual spreadsheet or paper)
- Use Case: Low stock alerts, usage tracking

**Recommendation:** Defer to v2.0 (or external system)
- Not core to clinic management (separate concern)
- Alternative: Use dedicated inventory system (Zoho Inventory, etc.)

**Decision Needed By:** May 1, 2026 (v2.0 planning)
**Decision Maker:** Clinic Director + Operations Manager
**Impact if Not Decided:** Manual inventory tracking continues
**Status:** Medium Priority (v2.0)

---

#### FE-010: Insurance Billing (Claims Submission)

**Question:** Should system submit claims to insurance companies (automatic billing)?

**Context:**
- Current: Clinic bills patients directly (no insurance billing)
- Requirement: ICD-10/CPT coding, insurance claim format, integration with insurer APIs

**Recommendation:** Defer to v2.0+ (complex, low ROI for single clinic)
- Most clinics bill patients, not insurance
- If required: External billing service or dedicated billing system

**Decision Needed By:** May 1, 2026 (v2.0 planning)
**Decision Maker:** Clinic Director + Finance
**Impact if Not Decided:** Continue billing patients directly (acceptable)
**Status:** Medium Priority (future consideration)

---

### 6.3 Low Priority Enhancements

#### FE-011: Gamification (Patient Progress Badges)

**Question:** Should system include gamification features (badges for exercise completion)?

**Context:**
- User engagement: Gamification can improve patient adherence to home exercises
- Example: "10-day streak" badge for completing daily exercises

**Recommendation:** Defer to v2.0+ (nice-to-have, not critical)
- Requires patient portal (not in MVP)
- Requires exercise tracking (not in MVP)

**Decision Needed By:** N/A (not prioritized)
**Decision Maker:** Product Owner
**Impact if Not Decided:** No gamification (acceptable)
**Status:** Low Priority

---

#### FE-012: Voice Dictation (Clinical Notes)

**Question:** Should system support voice-to-text for clinical record entry?

**Context:**
- Practitioner feedback: Typing long notes is time-consuming
- Technology: Web Speech API (browser-based) or cloud service (Google Speech-to-Text)

**Recommendation:** Defer to v2.0+ (experimental, accuracy concerns)
- Browser API: Free, privacy-friendly, but limited accuracy
- Cloud API: High accuracy, but privacy concerns (medical data sent to Google)

**Decision Needed By:** N/A (not prioritized)
**Decision Maker:** Product Owner + Medical Officer
**Impact if Not Decided:** Manual typing continues (acceptable)
**Status:** Low Priority

---

## 7. Decision Log

### 7.1 Decisions Made (for reference)

| ID | Question | Decision | Date | Decided By |
|----|----------|----------|------|------------|
| **D-001** | Technology Stack (PHP/Symfony vs Node.js) | PHP 8.4 + Symfony 7.4 | Nov 2025 | Technical Lead |
| **D-002** | Frontend Framework (React vs Vue) | React 18 + TypeScript | Nov 2025 | Technical Lead |
| **D-003** | Database Engine Selection | MariaDB 11 | Nov 2025 | Technical Lead |
| **D-004** | DDD Architecture (yes/no) | Yes (with pragmatic PHP approach) | Nov 2025 | Principal Architect |
| **D-005** | API Platform (yes/no) | Yes (rapid CRUD development) | Nov 2025 | Technical Lead |
| **D-006** | JWT vs Session Cookies | JWT (LocalStorage) | Dec 2025 | Security Officer |
| **D-007** | Clinical Record Immutability | Immutable (no editing) | Dec 2025 | Medical Officer |

---

## 8. Action Items (Next Steps)

### 8.1 Pre-Production (Critical - Must Complete Before Go-Live)

| Action Item | Owner | Deadline | Dependencies |
|-------------|-------|----------|--------------|
| **AI-001:** Decide invoice editing policy (BQ-001) | Legal Advisor | Jan 15, 2026 | None |
| **AI-002:** Document GDPR legal basis (SQ-001) | Legal Advisor | Jan 10, 2026 | None |
| **AI-003:** Execute Data Processor Agreements (SQ-002) | Legal + Procurement | Jan 15, 2026 | Hosting provider selected |
| **AI-004:** Schedule penetration test (SQ-003) | Security Officer | Jan 10, 2026 | Budget approval |
| **AI-005:** Select hosting provider (TQ-002) | DevOps + Finance | Jan 15, 2026 | None |
| **AI-006:** Enable database encryption (TQ-001) | DBA + Security | Jan 15, 2026 | Hosting provider selected |
| **AI-007:** Define support SLA (OQ-001) | Clinic Director + IT | Jan 20, 2026 | None |
| **AI-008:** Implement automated backups | DevOps | Jan 20, 2026 | Hosting provider selected |
| **AI-009:** Configure SSL certificate | DevOps | Jan 20, 2026 | Hosting provider + domain |
| **AI-010:** Complete User Acceptance Testing (UAT) | QA + Clinic Staff | Feb 15, 2026 | Training completed |

### 8.2 Short-Term (v1.1 - Q2 2026)

| Action Item | Owner | Target | Dependencies |
|-------------|-------|--------|--------------|
| **AI-011:** Implement appointment reminders (FE-001) | Engineering | Q2 2026 | Email/SMS provider selected |
| **AI-012:** Add 2FA (SQ-005) | Engineering | Q2 2026 | None |
| **AI-013:** Add data export feature (GDPR compliance) | Engineering | Q2 2026 | None |
| **AI-014:** Implement audit trail UI | Engineering | Q2 2026 | None |

### 8.3 Mid-Term (v1.2 - Q3 2026)

| Action Item | Owner | Target | Dependencies |
|-------------|-------|--------|--------------|
| **AI-015:** Implement reporting dashboard (FE-002) | Engineering | Q3 2026 | Analytics requirements finalized |
| **AI-016:** Add file upload feature (FE-003) | Engineering | Q3 2026 | Storage provider selected (S3) |
| **AI-017:** Implement patient portal (if approved BQ-003) | Engineering | Q3 2026 | Authentication strategy defined |
| **AI-018:** Add consent tracking (GDPR) | Engineering | Q3 2026 | Legal review completed |

### 8.4 Long-Term (v2.0 - Q1 2027)

| Action Item | Owner | Target | Dependencies |
|-------------|-------|--------|--------------|
| **AI-019:** Multi-tenancy architecture (if approved BQ-004) | Architecture | Q1 2027 | Business expansion confirmed |
| **AI-020:** Payment processing integration (if approved BQ-005) | Engineering | Q1 2027 | Payment provider selected |
| **AI-021:** Native mobile app (if approved FE-004) | Engineering | Q1 2027 | Mobile strategy defined |

---

## 9. Communication Plan

### 9.1 Decision Communication

**When Decision Made:**
1. Update this document (decision log)
2. Email stakeholders (summary of decision + rationale)
3. Update roadmap (if timeline impacted)
4. Brief engineering team (if technical decision)

### 9.2 Open Question Review Cadence

| Review Type | Frequency | Participants | Purpose |
|-------------|-----------|--------------|---------|
| **Weekly Standup** | Weekly | Engineering | Review technical questions |
| **Bi-Weekly Product Sync** | Bi-weekly | Product + Engineering | Review business/feature questions |
| **Monthly Steering Committee** | Monthly | All Stakeholders | Resolve critical blockers, approve decisions |
| **Quarterly Roadmap Review** | Quarterly | All Teams | Reassess priorities, update roadmap |

---

## 10. Document Maintenance

### 10.1 Update Process

**This document is a living document and should be updated:**
- When new questions arise (add to appropriate section)
- When decisions are made (move from "Open Questions" to "Decision Log")
- When action items are completed (mark as ✅ Done)
- When priorities change (update status/priority)

**Document Owner:** Product Owner (responsible for keeping document current)

**Last Review:** December 30, 2025
**Next Review:** January 15, 2026 (Pre-Production Review)

---

**Document End**
