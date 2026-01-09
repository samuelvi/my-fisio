# Constraints & Limitations
## Physiotherapy Clinic Management System

**Document Version:** 1.0
**Last Updated:** December 30, 2025
**Classification:** Internal - Technical
**Owner:** Principal Software Architect & Product Owner

---

## 1. Executive Summary

This document provides a comprehensive analysis of technical constraints, known limitations, design trade-offs, and boundary conditions for the Physiotherapy Clinic Management System. Understanding these limitations is critical for setting realistic expectations, planning future enhancements, and avoiding misuse of the system.

### 1.1 Document Purpose

This document serves to:
1. **Communicate Boundaries:** Clearly define what the system does NOT do
2. **Prevent Scope Creep:** Document intentional exclusions from MVP
3. **Inform Decisions:** Provide context for architectural trade-offs
4. **Guide Future Development:** Identify areas for enhancement

### 1.2 Limitation Categories

| Category | Count | Impact Level |
|----------|-------|--------------|
| **Technical Constraints** | 12 | High |
| **Functional Limitations** | 15 | Medium-High |
| **Performance Boundaries** | 8 | Medium |
| **Security Limitations** | 10 | High |
| **Compliance Gaps** | 6 | Medium |
| **Operational Constraints** | 7 | Medium |

---

## 2. Technical Constraints

### 2.1 Technology Stack Constraints

#### TC-001: PHP 8.4 Hosting Limitation

**Constraint:** System requires PHP 8.4, which is not widely supported by shared hosting providers.

**Impact:**
- Hosting provider options limited (VPS or cloud required)
- Increased deployment complexity
- Higher hosting costs

**Rationale:** PHP 8.4 provides critical features (property hooks, asymmetric visibility) used extensively in codebase.

**Mitigation:**
- Use Docker-compatible hosting (DigitalOcean, AWS, Hetzner)
- Document hosting requirements clearly
- Consider PHP 8.3 compatibility layer (future)

**Status:** ✅ Accepted trade-off (modern features outweigh hosting constraints)

---

#### TC-002: MariaDB 11 Support

**Constraint:** System requires MariaDB 11, which is newer than many managed database services support.

**Impact:**
- Cannot use some managed database services (e.g., AWS RDS may not support latest MariaDB)
- May require self-hosted database

**Rationale:** MariaDB 11 provides performance improvements and modern SQL features.

**Mitigation:**
- Use DigitalOcean Managed Database (supports MariaDB 11)
- Self-host MariaDB in Docker container
- Consider MySQL 8 compatibility (schema is compatible)

**Status:** ⚠️ Potential blocker for AWS/GCP deployment

---

#### TC-003: No Offline Mode

**Constraint:** System requires active internet connection to function (no offline capabilities).

**Impact:**
- Cannot use system during internet outages
- Mobile/remote practitioners cannot access patient data offline

**Rationale:** SPA architecture requires API connectivity; offline mode requires:
- Local database (IndexedDB, SQLite)
- Synchronization logic (conflict resolution)
- Significant architectural changes

**Mitigation:**
- Ensure reliable internet connectivity (backup 4G/5G connection)
- Mobile hotspot as fallback

**Status:** ✅ Acceptable for clinic environment (reliable Wi-Fi)

**Future Enhancement (v2.0):** Progressive Web App (PWA) with offline-first architecture

---

#### TC-004: Browser Compatibility

**Constraint:** System requires modern browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+).

**Impact:**
- Users on older browsers cannot access system
- No support for Internet Explorer

**Rationale:** Modern JavaScript/CSS features (ES modules, CSS Grid, async/await) used extensively.

**Supported Browsers:**
- ✅ Chrome 90+ (recommended)
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ❌ Internet Explorer (any version)
- ❌ Chrome <90
- ❌ Safari <14

**Mitigation:**
- Browser compatibility check on login page
- Display warning if unsupported browser detected

**Status:** ✅ Acceptable (clinic staff use modern browsers)

---

#### TC-005: Single Database Instance

**Constraint:** System uses single database instance (no read replicas or sharding).

**Impact:**
- Database is single point of failure
- Limited read scaling (all queries hit primary database)
- Cannot handle extremely high traffic (>1000 concurrent users)

**Rationale:** MVP focus; read replicas add complexity without clear ROI for single-clinic deployment.

**Scaling Limits:**
- Maximum concurrent users: ~100-200 (estimated)
- Maximum database size: ~10GB (before performance degradation)

**Mitigation:**
- High-availability database hosting (managed service with automatic failover)
- Regular backups (30-day retention)

**Future Enhancement (v2.0):**
- Read replicas for reporting queries
- Database sharding for multi-clinic deployments

**Status:** ✅ Acceptable for single-clinic deployment

---

#### TC-006: No Multi-Tenancy

**Constraint:** System designed for single clinic (no multi-tenant architecture).

**Impact:**
- Cannot support franchises or multi-clinic networks
- Each clinic requires separate deployment
- Shared infrastructure not possible

**Rationale:** Multi-tenancy requires:
- Tenant isolation (data segregation per clinic)
- Tenant-aware authentication
- Tenant-specific configuration
- Significant architectural changes

**Workaround:**
- Deploy separate instance per clinic
- Shared hosting with isolated databases

**Future Enhancement (v2.0):** Multi-tenant architecture with tenant_id column in all tables

**Status:** ✅ Intentional limitation (single-clinic focus for MVP)

---

### 2.2 Infrastructure Constraints

#### TC-007: Docker Dependency

**Constraint:** Development and production deployment require Docker.

**Impact:**
- Traditional LAMP stack deployment not supported
- Hosting providers must support Docker (or manual setup required)

**Rationale:** Docker ensures environment consistency (dev/test/prod parity).

**Mitigation:**
- Document non-Docker deployment (manual PHP-FPM, Nginx, MariaDB setup)
- Provide docker-compose.yml for simplified deployment

**Status:** ✅ Acceptable (Docker is industry standard)

---

#### TC-008: JWT Authentication (Stateless)

**Architecture:** System uses JWT for authentication (no session storage needed).

**Benefits:**
- No session synchronization between instances (truly stateless)
- Hosting providers do not need Redis for sessions (optional for caching)
- Simplified horizontal scaling

**Rationale:** JWT enables horizontal scaling without session sharing.

**Redis Status:**
- Available for future caching needs
- Not used for session storage
- Can be deployed optionally for performance optimization

**Status:** ✅ Acceptable (Redis widely available)

---

#### TC-009: No CDN Integration

**Constraint:** Static assets served from application server (no CDN).

**Impact:**
- Slower asset loading for geographically distant users
- Higher bandwidth costs

**Rationale:** MVP does not justify CDN complexity/cost.

**Mitigation:**
- Vite bundles are minified and compressed
- HTTP/2 server push (Nginx)

**Future Enhancement (v1.2):**
- CloudFront or Cloudflare CDN for static assets
- Separate asset domain (assets.clinic.example.com)

**Status:** ⚠️ Acceptable for local clinic (users on same network)

---

### 2.3 Development Constraints

#### TC-010: No Automated Database Backups

**Constraint:** Database backups are manual (not automated).

**Impact:**
- Risk of data loss if backups not performed regularly
- Human error (forgetting to backup)

**Rationale:** Backup automation is environment-specific (requires infrastructure setup).

**Mitigation:**
- Document backup procedures
- Use managed database service with automatic backups

**Status:** ⚠️ Critical for production (must implement before go-live)

---

#### TC-011: JWT Token Storage (LocalStorage)

**Constraint:** JWT tokens stored in browser LocalStorage (not HttpOnly cookies).

**Impact:**
- Vulnerable to XSS attacks (if XSS vulnerability exists)
- Token accessible to JavaScript

**Rationale:**
- Simplifies CORS configuration (no need for SameSite cookies)
- React auto-escaping mitigates XSS risk

**Alternative Considered:** HttpOnly cookies (rejected due to CORS complexity)

**Mitigation:**
- Strict XSS prevention (React auto-escaping)
- Short token lifetime (28 days)
- Content Security Policy (CSP) headers

**Status:** ⚠️ Acceptable with strong XSS prevention

---

#### TC-012: No File Upload Support

**Constraint:** System does not support file uploads (patient documents, images).

**Impact:**
- Cannot attach medical reports, X-rays, insurance documents
- Users must store documents separately (physical files or external system)

**Rationale:** File storage requires:
- Shared file system (S3, NFS)
- Security (access control, virus scanning)
- Backup strategy (files must be backed up with database)

**Future Enhancement (v1.2):**
- Add file attachment feature (S3 storage)
- Support PDF, JPEG, PNG, DOCX

**Status:** ✅ Intentional limitation (not required for MVP)

---

## 3. Functional Limitations

### 3.1 Patient Management

#### FL-001: No Patient Portal

**Limitation:** Patients cannot access system (no self-service portal).

**Impact:**
- Patients cannot view their records
- Patients cannot book appointments online
- Patients cannot update personal information

**Rationale:** Patient portal requires:
- Public-facing authentication (patient credentials)
- Authorization (patients can only see their own data)
- Privacy controls (consent management)

**Workaround:**
- Clinic staff access records on behalf of patients
- Phone/email appointment booking

**Future Enhancement (v1.2):** Patient portal with self-booking and record access

**Status:** ✅ Intentional exclusion (internal-only system for MVP)

---

#### FL-002: No Patient Merging

**Limitation:** Cannot merge duplicate patient records.

**Impact:**
- If patient created twice (e.g., typo in name), duplicate records exist
- No automated duplicate detection

**Workaround:**
- Manual data transfer (appointments, records) to correct patient
- Delete duplicate patient

**Future Enhancement (v1.2):** Patient merge functionality with audit trail

**Status:** ⚠️ Manual workaround available (infrequent use case)

---

#### FL-003: No Patient Photo

**Limitation:** No patient photo storage (no face recognition).

**Impact:**
- Cannot visually identify patient
- Clinic staff must verify patient by name/DOB

**Workaround:**
- Use external photo storage (Google Drive, Dropbox)

**Future Enhancement (v1.3):** Patient photo upload (with face blurring for privacy)

**Status:** ✅ Acceptable (not critical for clinic operations)

---

### 3.2 Appointment Management

#### FL-004: No Recurring Appointments

**Limitation:** Cannot create recurring appointments (e.g., every Monday at 10am for 4 weeks).

**Impact:**
- Must manually create each appointment for recurring patients

**Workaround:**
- Create appointments one by one
- Use "duplicate appointment" feature (not implemented)

**Future Enhancement (v1.2):** Recurring appointment creation with customizable patterns

**Status:** ⚠️ Moderate inconvenience (manual workaround available)

---

#### FL-005: No Appointment Reminders

**Limitation:** No automated SMS/email appointment reminders.

**Impact:**
- Higher no-show rate (patients forget appointments)
- Manual reminder calls required

**Rationale:** Reminders require:
- SMS provider integration (Twilio, Vonage)
- Email provider integration (SendGrid, Mailgun)
- Consent tracking (GDPR compliance)

**Future Enhancement (v1.1):** Automated reminders 24 hours before appointment

**Status:** ⚠️ High-value feature (should be prioritized)

---

#### FL-006: No Waitlist Management

**Limitation:** Cannot manage waitlist for cancellations.

**Impact:**
- Cancelled appointment slots remain empty (lost revenue)
- Cannot notify patients waiting for earlier appointments

**Workaround:**
- Manual phone calls to waitlist patients

**Future Enhancement (v1.2):** Waitlist with automatic notification on cancellation

**Status:** ✅ Acceptable for MVP (manual process works)

---

### 3.3 Clinical Records

#### FL-007: No Record Templates

**Limitation:** Clinical records are free-text only (no templates or structured data entry).

**Impact:**
- Inconsistent documentation across practitioners
- Difficult to analyze trends (e.g., common diagnoses)

**Rationale:** Free-text provides flexibility; templates require:
- Domain expertise (physiotherapy treatment taxonomy)
- Customization (different clinics use different templates)

**Workaround:**
- Practitioners use personal templates (copy/paste)

**Future Enhancement (v2.0):** Customizable record templates with structured fields

**Status:** ✅ Acceptable (flexibility more important than structure for MVP)

---

#### FL-008: No Record Editing

**Limitation:** Clinical records are immutable (cannot be edited after creation).

**Impact:**
- Cannot correct typos or add forgotten information
- Must create new record with correction note

**Rationale:** Immutability ensures audit compliance (medical records should not be altered).

**Workaround:**
- Create new record: "Correction to record #123: [correction details]"

**Alternative Considered:** Record versioning (rejected due to complexity)

**Status:** ✅ Intentional design decision (compliance > convenience)

---

#### FL-009: No Digital Signatures

**Limitation:** Clinical records not digitally signed (no legal signature).

**Impact:**
- Cannot prove record was created by specific practitioner
- Not compliant with some jurisdictions' electronic signature laws

**Workaround:**
- Record includes user ID (implicit signature)
- Physical signature on printed records

**Future Enhancement (v2.0):** Digital signature with PKI infrastructure

**Status:** ⚠️ Legal compliance gap (consult legal team)

---

### 3.4 Billing & Invoicing

#### FL-010: No Payment Processing

**Limitation:** System generates invoices but does not process payments (no online payment).

**Impact:**
- Patients must pay via cash, bank transfer, or card terminal
- Cannot track payment status in system

**Rationale:** Payment processing requires:
- Payment gateway integration (Stripe, Redsys)
- PCI-DSS compliance (credit card security)
- Refund handling

**Workaround:**
- Manual payment recording (external system or paper receipt)

**Future Enhancement (v2.0):** Payment gateway integration with payment tracking

**Status:** ✅ Intentional exclusion (offline payments sufficient for MVP)

---

#### FL-011: No Multi-Currency Support

**Limitation:** Invoices assume single currency (EUR).

**Impact:**
- Cannot invoice international clients
- Cannot handle multi-currency accounting

**Workaround:**
- Manual currency conversion

**Future Enhancement (v2.0):** Multi-currency support with exchange rate tracking

**Status:** ✅ Acceptable (clinic operates in Spain only)

---

#### FL-012: No Tax Calculation

**Limitation:** System does not automatically calculate taxes (VAT, IVA).

**Impact:**
- Users must manually calculate tax amounts
- Risk of tax calculation errors

**Rationale:** Tax rules vary by country, product/service type, customer type (B2B vs B2C).

**Workaround:**
- Users enter tax-inclusive prices
- Use external calculator or fixed tax rate

**Future Enhancement (v1.3):** Configurable tax rates per service

**Status:** ⚠️ Moderate inconvenience (manual calculation required)

---

#### FL-013: Invoice Editing Ambiguity

**Limitation:** Invoice editing controlled by feature flag; policy not finalized.

**Impact:**
- Unclear if invoices should be editable post-creation
- Potential audit trail violations if edited

**Rationale:** Regulatory requirements unclear (consult legal/tax advisor).

**Current Behavior:**
- Feature flag `VITE_INVOICE_EDIT_ENABLED=true` allows editing
- Recommended: Disable editing in production

**Future Enhancement (v1.1):** Invoice versioning with audit trail (if editing required)

**Status:** ⚠️ Policy decision required before production

---

### 3.5 Reporting & Analytics

#### FL-014: No Built-in Reports

**Limitation:** System does not include pre-built reports (revenue, patient demographics, appointment trends).

**Impact:**
- Cannot generate business intelligence reports
- Must export data to Excel for analysis

**Workaround:**
- Manual data export (CSV or database query)
- External BI tools (Metabase, Tableau)

**Future Enhancement (v1.2):** Dashboard with key metrics (revenue, appointments, top diagnoses)

**Status:** ⚠️ Important for business decision-making (should be prioritized)

---

#### FL-015: No Data Export

**Limitation:** No built-in data export feature (CSV, JSON, PDF).

**Impact:**
- Difficult to migrate data to another system
- Cannot provide data portability (GDPR requirement)

**Workaround:**
- Database dump (mysqldump)
- Manual copy/paste from UI

**Future Enhancement (v1.1):** Export patient data as JSON or CSV (GDPR compliance)

**Status:** ⚠️ GDPR compliance gap (must implement before production)

---

## 4. Performance Boundaries

### 4.1 Scalability Limits

#### PB-001: Maximum Concurrent Users

**Limit:** System tested with up to 10 concurrent users; estimated limit: 100-200 users.

**Rationale:**
- Single application server
- Single database instance
- No load balancing

**Symptoms of Overload:**
- Slow response times (>5 seconds)
- Database connection pool exhaustion
- Memory errors (PHP-FPM)

**Mitigation:**
- Horizontal scaling (multiple application servers + load balancer)
- Database connection pooling (PgBouncer equivalent for MariaDB)

**Status:** ✅ Acceptable for single clinic (typically <10 concurrent users)

---

#### PB-002: Maximum Patients

**Limit:** System tested with up to 100 patients; estimated limit: 10,000 patients.

**Rationale:**
- Search performance degrades with large datasets (no full-text indexing)
- Patient list pagination (15 per page) sufficient for small clinics

**Symptoms of Overload:**
- Slow patient search (>2 seconds)
- Slow patient list loading

**Mitigation:**
- Add FULLTEXT index on patient names
- Implement Elasticsearch for advanced search

**Status:** ✅ Acceptable for typical clinic (500-2000 patients)

---

#### PB-003: Maximum Appointments Per Day

**Limit:** Calendar view tested with up to 50 appointments/day; estimated limit: 200 appointments/day.

**Rationale:**
- FullCalendar performance degrades with large event count

**Symptoms of Overload:**
- Slow calendar rendering (>3 seconds)
- Browser memory usage high

**Mitigation:**
- Paginate calendar by week (load only current week)
- Virtual scrolling

**Status:** ✅ Acceptable (typical clinic has 20-40 appointments/day)

---

#### PB-004: Maximum Invoice Lines

**Limit:** Invoice form tested with up to 20 line items; no technical limit.

**Rationale:**
- UI becomes unwieldy with many line items
- Performance not an issue (database handles 100+ lines easily)

**Symptoms of Overload:**
- Slow invoice form rendering
- Difficult to scroll/edit

**Mitigation:**
- Pagination or accordion view for line items

**Status:** ✅ Acceptable (typical invoice has 1-5 line items)

---

#### PB-005: Database Size Limit

**Limit:** System not tested with database >1GB; estimated limit: 10GB.

**Rationale:**
- Default MariaDB configuration not optimized for large databases
- Backup/restore time increases linearly with size

**Symptoms of Overload:**
- Slow queries (especially full table scans)
- Long backup/restore times (>1 hour)

**Mitigation:**
- Database tuning (increase innodb_buffer_pool_size)
- Partition large tables (appointments by year)

**Status:** ✅ Acceptable (estimated 100MB/year growth)

---

#### PB-006: PDF Generation Timeout

**Limit:** Invoice PDF generation times out after 30 seconds (Nginx default).

**Rationale:**
- DomPDF is slow for complex PDFs (>10 pages)

**Symptoms of Overload:**
- 504 Gateway Timeout error

**Mitigation:**
- Increase Nginx timeout (proxy_read_timeout 60s)
- Optimize PDF template (remove unnecessary images/styles)

**Status:** ✅ Acceptable (invoices are typically 1-2 pages)

---

#### PB-007: JWT Token Expiration

**Design:** JWT tokens have configurable expiration (default: ~18 days).

**Rationale:**
- Stateless authentication (no server-side storage)
- Tokens stored client-side (localStorage)
- No token revocation mechanism (tokens valid until expiry)

**Considerations:**
- Long-lived tokens may pose security risk if stolen
- Logout only clears client-side token (server cannot revoke)
- Consider implementing refresh token mechanism for shorter expiry

**Mitigation:**
- Implement refresh token rotation for shorter-lived access tokens
- Add token blacklist for critical logout scenarios
- Monitor for unusual token usage patterns

**Status:** ✅ Acceptable (JWT architecture is industry standard for APIs)

---

#### PB-008: API Rate Limiting

**Limit:** No rate limiting implemented (unlimited requests per user).

**Rationale:**
- MVP does not include rate limiting
- Risk of abuse (malicious user flooding API)

**Symptoms of Overload:**
- Server CPU/memory exhaustion
- Slow response times for all users

**Mitigation:**
- Implement rate limiting (10 requests/second per IP)
- Use Nginx rate limiting or Symfony RateLimiter

**Status:** ⚠️ Security risk (must implement before production)

---

## 5. Security Limitations

### 5.1 Authentication & Authorization

#### SL-001: No Two-Factor Authentication (2FA)

**Limitation:** Users authenticate with email + password only (no 2FA).

**Impact:**
- Higher risk of account takeover (if password compromised)

**Mitigation:**
- Strong password policy (12+ characters, complexity)
- Monitor for suspicious login activity

**Future Enhancement (v1.1):** TOTP-based 2FA (Google Authenticator)

**Status:** ⚠️ Security gap (should be prioritized)

---

#### SL-002: No Granular Permissions

**Limitation:** All authenticated users have same permissions (no role-based restrictions).

**Impact:**
- Receptionists can access clinical records (should be restricted to practitioners)
- Practitioners can access invoices (should be restricted to billing staff)

**Current Roles:**
- ROLE_USER: Full access
- ROLE_ADMIN: Full access (no difference from ROLE_USER)

**Future Enhancement (v1.2):** Granular RBAC (ROLE_RECEPTIONIST, ROLE_PRACTITIONER, ROLE_BILLING, ROLE_ADMIN)

**Status:** ⚠️ Privacy risk (least privilege principle not enforced)

---

#### SL-003: No IP Whitelisting

**Limitation:** API accessible from any IP address (no network-level access control).

**Impact:**
- Attackers can attempt login from anywhere
- No protection against distributed attacks

**Mitigation:**
- VPN access (require clinic staff to connect via VPN)
- Firewall rules (allow only clinic IP addresses)

**Future Enhancement (v1.2):** Configurable IP whitelist

**Status:** ⚠️ Acceptable for cloud deployment (HTTPS + strong passwords sufficient)

---

#### SL-004: No Session Concurrency Limit

**Limitation:** Users can have unlimited concurrent sessions (multiple devices).

**Impact:**
- Stolen credentials can be used from multiple locations simultaneously
- Difficult to detect account compromise

**Mitigation:**
- Monitor for suspicious login locations (IP geolocation)
- Session revocation feature

**Future Enhancement (v1.2):** Limit to 3 concurrent sessions per user

**Status:** ⚠️ Security gap (low priority)

---

### 5.2 Data Protection

#### SL-005: No Database Encryption at Rest

**Limitation:** Database stored in plaintext (no encryption at rest).

**Impact:**
- If database files stolen (e.g., backup tape), data readable

**Mitigation:**
- Encrypt backups (GPG encryption)
- Use full disk encryption (LUKS, BitLocker)

**Future Enhancement (v1.2):** Enable MariaDB InnoDB encryption

**Status:** ⚠️ Compliance gap (recommended for GDPR)

---

#### SL-006: No Field-Level Encryption

**Limitation:** Sensitive fields (tax ID, date of birth) stored in plaintext.

**Impact:**
- Database administrator can read sensitive data
- Compliance risk (GDPR "pseudonymization")

**Mitigation:**
- Strict database access control (only authorized DBAs)
- Audit database access

**Future Enhancement (v2.0):** Encrypt sensitive fields with application-level encryption

**Status:** ⚠️ Compliance gap (consult legal team)

---

#### SL-007: No Audit Trail for Data Access

**Limitation:** No logging of who viewed patient records.

**Impact:**
- Cannot detect unauthorized access (insider threat)
- GDPR Article 15 (right to know who accessed data)

**Mitigation:**
- Application-level logging (log all patient record views)

**Future Enhancement (v1.2):** Audit trail UI (show who accessed patient record when)

**Status:** ⚠️ Compliance gap (GDPR requirement)

---

#### SL-008: No Data Loss Prevention (DLP)

**Limitation:** No controls to prevent bulk data export.

**Impact:**
- Malicious user can export all patient records
- Data breach risk

**Mitigation:**
- Monitor for suspicious API activity (100+ patient lookups in 1 minute)
- Limit API response size (max 100 records per page)

**Future Enhancement (v1.3):** DLP alerts for bulk export

**Status:** ⚠️ Insider threat risk (low probability, high impact)

---

### 5.3 Infrastructure Security

#### SL-009: No Web Application Firewall (WAF)

**Limitation:** No WAF to block common attacks (SQL injection, XSS, CSRF).

**Impact:**
- Vulnerable to automated attacks
- No protection against zero-day vulnerabilities

**Mitigation:**
- Input validation (Symfony Validator)
- Output escaping (React, Twig)
- Parameterized queries (Doctrine)

**Future Enhancement (Production):** CloudFlare WAF or AWS WAF

**Status:** ⚠️ Defense in depth gap (application-level security sufficient for now)

---

#### SL-010: No Intrusion Detection System (IDS)

**Limitation:** No IDS to detect malicious activity (port scanning, brute force).

**Impact:**
- Cannot detect ongoing attacks in real-time
- Delayed incident response

**Mitigation:**
- Manual log review (periodic)
- Monitor for failed login attempts

**Future Enhancement (v2.0):** OSSEC or Wazuh IDS

**Status:** ⚠️ Monitoring gap (acceptable for MVP)

---

## 6. Compliance Limitations

### 6.1 GDPR Compliance

#### CL-001: No Consent Tracking

**Limitation:** System does not track patient consent for data processing.

**Impact:**
- Cannot prove patient consented to data processing (GDPR Article 7)
- Risk of regulatory violation

**Mitigation:**
- Paper consent forms (signed by patient)

**Future Enhancement (v1.2):** Digital consent tracking with timestamp and signature

**Status:** ⚠️ Compliance gap (consult legal team)

---

#### CL-002: No Data Portability

**Limitation:** No automated data export for patients (GDPR Article 20).

**Impact:**
- Cannot easily provide patient with their data in machine-readable format
- Manual export required (time-consuming)

**Mitigation:**
- Manual database query or copy/paste from UI

**Future Enhancement (v1.1):** Export patient data as JSON or PDF

**Status:** ⚠️ GDPR requirement (must implement before production)

---

#### CL-003: No Right to Erasure ("Right to be Forgotten")

**Limitation:** No automated patient data deletion or pseudonymization.

**Impact:**
- Cannot easily fulfill patient's request to delete data (GDPR Article 17)
- Legal requirement to retain medical records (15 years) conflicts with right to erasure

**Mitigation:**
- Pseudonymization (replace patient name with "DELETED PATIENT #123")
- Retain medical records as required by law

**Future Enhancement (v1.2):** Automated pseudonymization workflow

**Status:** ⚠️ Compliance gap (legal advice required)

---

#### CL-004: No Breach Notification Mechanism

**Limitation:** No automated system to notify patients of data breach.

**Impact:**
- Manual notification required (time-consuming)
- Risk of missing 72-hour notification deadline (GDPR Article 33)

**Mitigation:**
- Documented breach response plan (manual process)

**Future Enhancement (v1.3):** Automated breach notification (email/SMS)

**Status:** ⚠️ Compliance gap (manual process acceptable for now)

---

### 6.2 Medical Compliance

#### CL-005: No Digital Signature for Clinical Records

**Limitation:** Clinical records not digitally signed (see FL-009).

**Impact:**
- Cannot prove record authenticity
- Not compliant with some jurisdictions' electronic signature laws

**Status:** ⚠️ Legal compliance gap (consult legal team)

---

#### CL-006: No Medical Coding (ICD-10, CPT)

**Limitation:** System does not support medical coding standards (ICD-10 diagnoses, CPT procedure codes).

**Impact:**
- Cannot submit claims to insurance companies automatically
- Manual coding required

**Rationale:** Medical coding requires:
- Extensive code database (10,000+ ICD-10 codes)
- Practitioner training
- Integration with billing system

**Future Enhancement (v2.0):** ICD-10/CPT code support with autocomplete

**Status:** ✅ Acceptable (clinic bills patients directly, not insurance)

---

## 7. Operational Constraints

### 7.1 Deployment & Hosting

#### OC-001: No Automated Deployment

**Limitation:** Deployment is manual (no CI/CD deployment pipeline).

**Impact:**
- Human error risk (incorrect deployment steps)
- Slow deployment (30+ minutes)

**Mitigation:**
- Document deployment procedure
- Use Docker Compose for simplified deployment

**Future Enhancement (v1.1):** Automated deployment via GitHub Actions

**Status:** ⚠️ Acceptable for MVP (infrequent deployments)

---

#### OC-002: No Automated Rollback

**Limitation:** If deployment fails, rollback is manual.

**Impact:**
- Extended downtime if deployment fails
- Risk of data loss if database migration rollback required

**Mitigation:**
- Backup database before deployment
- Test deployment in staging environment

**Future Enhancement (v1.1):** Blue-green deployment with automated rollback

**Status:** ⚠️ Risk mitigation required (backup before deployment)

---

#### OC-003: No High Availability (HA)

**Limitation:** Single application server (no redundancy).

**Impact:**
- System unavailable if server fails
- Downtime during deployment

**Mitigation:**
- Use reliable hosting provider (99.9% uptime SLA)
- Schedule deployments during low-traffic hours

**Future Enhancement (v2.0):** High availability with load balancer + multiple servers

**Status:** ✅ Acceptable for single-clinic deployment (scheduled maintenance acceptable)

---

#### OC-004: No Disaster Recovery Plan

**Limitation:** No documented disaster recovery plan or tested restore procedures.

**Impact:**
- Extended downtime in case of catastrophic failure (server loss)
- Risk of permanent data loss if backup corrupted

**Mitigation:**
- Document disaster recovery procedures
- Test backup/restore quarterly

**Future Enhancement (Pre-Production):** Documented DR plan with RTO/RPO targets

**Status:** ⚠️ Critical gap (must implement before production)

---

### 7.2 Monitoring & Support

#### OC-005: No Application Monitoring

**Limitation:** No application performance monitoring (APM) or error tracking.

**Impact:**
- Cannot detect performance degradation proactively
- Difficult to diagnose production issues

**Mitigation:**
- Manual log review
- User reports of issues

**Future Enhancement (Production):** Sentry (error tracking) + New Relic (APM)

**Status:** ⚠️ Monitoring gap (acceptable for MVP, critical for production)

---

#### OC-006: No Uptime Monitoring

**Limitation:** No external uptime monitoring (ping checks).

**Impact:**
- No notification if system goes down
- Downtime may go unnoticed (especially overnight)

**Mitigation:**
- Manual checks (clinic staff notice if system unavailable)

**Future Enhancement (Production):** UptimeRobot or Pingdom (5-minute ping intervals)

**Status:** ⚠️ Monitoring gap (should implement before production)

---

#### OC-007: No Support SLA

**Limitation:** No defined support hours or response time guarantee.

**Impact:**
- Unclear expectations (when will issues be fixed?)
- Potential user frustration

**Mitigation:**
- Document support channels (email, phone)
- Set informal expectations (best-effort support during business hours)

**Future Enhancement (Production):** SLA with defined response times (P0: 1 hour, P1: 4 hours, P2: 1 day)

**Status:** ✅ Acceptable for internal deployment (informal support)

---

## 8. Known Trade-Offs

### 8.1 Architectural Trade-Offs

| Decision | Benefit | Cost | Rationale |
|----------|---------|------|-----------|
| **DDD + Pragmatic PHP** | Clean architecture, maintainability | Doctrine annotations in domain entities (impure DDD) | PHP ecosystem pragmatism outweighs pure DDD |
| **API Platform** | Rapid CRUD development, OpenAPI docs | Vendor lock-in, learning curve | Development speed prioritized for MVP |
| **LocalStorage for JWT** | Simplicity, no CORS issues | XSS vulnerability (mitigated) | Acceptable with strong XSS prevention |
| **No UnitOfWork Cache** | Fresh data guaranteed | More verbose repository code | Predictability > convenience |
| **N+1 Fetch Pagination** | 50% faster (no COUNT query) | No total page count | Performance > UI nicety |
| **Docker-only Deployment** | Environment consistency | Hosting provider constraints | Consistency outweighs traditional deployment |

### 8.2 Feature Trade-Offs

| Excluded Feature | Reason for Exclusion | Impact | Future Plan |
|------------------|---------------------|--------|-------------|
| **Patient Portal** | Complexity (public auth) | Patients cannot self-serve | v1.2 |
| **Appointment Reminders** | External dependencies (Twilio) | Higher no-show rate | v1.1 (high priority) |
| **Payment Processing** | PCI-DSS compliance | Manual payment tracking | v2.0 |
| **Multi-Tenancy** | Architectural complexity | One deployment per clinic | v2.0 |
| **File Uploads** | Shared storage (S3) | Cannot attach documents | v1.2 |
| **Reporting** | Business logic complexity | Manual data export | v1.2 |

---

## 9. Boundary Conditions

### 9.1 Data Validation Boundaries

| Field | Min | Max | Type | Notes |
|-------|-----|-----|------|-------|
| **Patient Name** | 1 char | 100 chars | String | First name: 50 chars, Last name: 100 chars |
| **Phone** | 0 chars | 50 chars | String | No format validation (international formats) |
| **Email** | 0 chars | 180 chars | String | Standard email format |
| **Appointment Duration** | 1 minute | 10 hours | Integer | Enforced at application layer |
| **Invoice Number** | 10 chars | 20 chars | String | Format: YYYY000001 (year + 6-digit counter) |
| **Invoice Amount** | 0.00 | 999999.99 | Float | No upper limit enforced (database DOUBLE) |

### 9.2 System Capacity Boundaries

| Resource | Tested Limit | Estimated Maximum | Failure Mode |
|----------|--------------|-------------------|--------------|
| **Concurrent Users** | 10 | 200 | Slow response times, timeouts |
| **Patients** | 100 | 10,000 | Slow search, pagination issues |
| **Appointments/Day** | 50 | 200 | Slow calendar rendering |
| **Invoice Lines** | 20 | 100 | Slow form rendering |
| **Database Size** | 1GB | 10GB | Slow queries, long backups |
| **Redis Memory** | 256MB | 1GB | Out-of-memory, cache loss (if caching enabled) |

---

## 10. Recommendations

### 10.1 Immediate Actions (Pre-Production)

| Action | Priority | Timeline | Owner |
|--------|----------|----------|-------|
| **Implement API rate limiting** | Critical | 1 week | Engineering |
| **Document disaster recovery plan** | Critical | 1 week | DevOps + DBA |
| **Add data export feature (GDPR)** | High | 2 weeks | Engineering |
| **Implement uptime monitoring** | High | 3 days | DevOps |
| **Finalize invoice editing policy** | High | 1 week | Product + Legal |
| **Add consent tracking** | Medium | 2 weeks | Engineering + Legal |

### 10.2 Short-Term Enhancements (v1.1)

| Enhancement | Priority | Effort |
|-------------|----------|--------|
| **Two-Factor Authentication** | High | 2 weeks |
| **Appointment Reminders** | High | 3 weeks |
| **Automated Backups** | High | 1 week |
| **Data Export (JSON/CSV)** | High | 1 week |
| **Audit Trail UI** | Medium | 2 weeks |

### 10.3 Long-Term Enhancements (v2.0)

| Enhancement | Priority | Effort |
|-------------|----------|--------|
| **Multi-Tenancy** | Medium | 8 weeks |
| **Patient Portal** | High | 6 weeks |
| **Payment Processing** | Medium | 4 weeks |
| **Advanced Reporting** | High | 6 weeks |
| **High Availability** | Medium | 4 weeks |

---

## 11. Acceptance Criteria

### 11.1 Constraint Acceptance

**This document has been reviewed and constraints accepted by:**

- [ ] Product Owner (acknowledges functional limitations)
- [ ] Technical Lead (acknowledges technical constraints)
- [ ] Security Officer (acknowledges security limitations)
- [ ] Clinic Director (acknowledges operational constraints)
- [ ] Legal Advisor (acknowledges compliance gaps)

### 11.2 Exception Handling

**Any deployment to production with known Critical or High severity limitations requires:**
1. Documented risk assessment
2. Mitigation plan
3. Approval from Steering Committee

---

**Document End**
