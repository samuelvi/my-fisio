# Risks & Mitigation
## Physiotherapy Clinic Management System

**Document Version:** 1.0
**Last Updated:** December 30, 2025
**Classification:** Internal - Confidential
**Owner:** Program Manager & Risk Management Team

---

## 1. Executive Summary

This document provides a comprehensive risk register, mitigation strategies, and contingency plans for the Physiotherapy Clinic Management System. The system handles sensitive medical data and is critical to clinic operations, requiring proactive risk management to ensure successful deployment and ongoing operations.

### 1.1 Risk Management Approach

**Methodology:** Qualitative risk assessment using probability-impact matrix

**Risk Scoring:**
- **Probability:** Very Low (1), Low (2), Medium (3), High (4), Very High (5)
- **Impact:** Negligible (1), Low (2), Medium (3), High (4), Critical (5)
- **Risk Score:** Probability × Impact (max: 25)

**Risk Categories:**
- **Strategic Risks:** Alignment with business goals, stakeholder support
- **Technical Risks:** Technology failures, architecture issues
- **Security Risks:** Data breaches, unauthorized access
- **Compliance Risks:** Regulatory violations, legal issues
- **Operational Risks:** Process failures, resource constraints
- **Project Risks:** Delays, budget overruns, scope creep

### 1.2 Risk Summary Dashboard

| Risk Level | Count | Percentage |
|------------|-------|------------|
| **Critical (20-25)** | 3 | 10% |
| **High (15-19)** | 8 | 27% |
| **Medium (8-14)** | 12 | 40% |
| **Low (4-7)** | 7 | 23% |
| **Total Risks** | 30 | 100% |

**Top 5 Risks (by score):**
1. Data Breach (Security) - Score: 20
2. Database Loss without Backup (Technical) - Score: 20
3. GDPR Non-Compliance (Compliance) - Score: 16
4. User Adoption Failure (Operational) - Score: 15
5. Security Audit Failure (Security) - Score: 15

---

## 2. Risk Register

### 2.1 Strategic Risks

#### SR-001: User Adoption Failure

**Description:** Clinic staff resist using new system, preferring manual processes or legacy system.

**Probability:** Medium (3)
**Impact:** High (5)
**Risk Score:** 15 (HIGH)

**Indicators:**
- <50% of staff logging in after 1 month
- Continued use of paper records despite system availability
- User complaints about complexity or usability

**Root Causes:**
- Inadequate training
- Poor change management
- System too complex or slow
- Missing critical features

**Mitigation Strategies:**
1. **Comprehensive Training:** 2-day hands-on training for all staff
2. **Change Champions:** Identify early adopters to promote system
3. **Feedback Loop:** Weekly check-ins during first month, address issues quickly
4. **Phased Rollout:** Start with one department, expand gradually
5. **Incentives:** Recognition for early adopters

**Contingency Plan:**
- If <50% adoption after 1 month: Pause rollout, conduct user interviews, address top 3 complaints
- If <75% adoption after 3 months: Consider rollback or major redesign

**Owner:** Product Owner + Clinic Director
**Status:** ⚠️ Mitigation in progress (training materials being developed)

---

#### SR-002: Business Requirements Misalignment

**Description:** System does not meet actual clinic needs; critical workflows not supported.

**Probability:** Low (2)
**Impact:** High (5)
**Risk Score:** 10 (MEDIUM)

**Indicators:**
- Users report missing features blocking daily work
- Workarounds required for common tasks
- Requests to return to legacy system

**Root Causes:**
- Insufficient requirements gathering
- Misunderstanding of clinic workflows
- Requirements changed since development

**Mitigation Strategies:**
1. **User Acceptance Testing (UAT):** Involve clinic staff in testing before go-live
2. **Workflow Observation:** Shadow staff for 1 week to understand actual processes
3. **Prototype Validation:** Show mockups to users before implementation
4. **Prioritized Backlog:** Ensure most critical features implemented first

**Contingency Plan:**
- If critical feature missing: Emergency development sprint (1-2 weeks)
- If fundamental mismatch: Conduct full requirements review, adjust roadmap

**Owner:** Product Owner
**Status:** ✅ Mitigated (UAT planned before production deployment)

---

#### SR-003: Stakeholder Support Withdrawal

**Description:** Clinic director or key stakeholders lose confidence in project, withdraw funding/support.

**Probability:** Low (2)
**Impact:** Critical (5)
**Risk Score:** 10 (MEDIUM)

**Indicators:**
- Delayed approvals or decision-making
- Budget cuts or resource reallocation
- Negative comments about project in meetings

**Root Causes:**
- Project delays or cost overruns
- Visible technical issues or bugs
- Poor communication of progress
- Competing priorities (e.g., new medical equipment)

**Mitigation Strategies:**
1. **Regular Status Updates:** Weekly email to stakeholders with progress highlights
2. **Demo Sessions:** Monthly demo of new features to build excitement
3. **Quick Wins:** Deliver high-visibility features early (patient search, calendar)
4. **Transparent Communication:** Proactively communicate issues and mitigation plans

**Contingency Plan:**
- If support wavers: Executive briefing with ROI analysis, success stories from similar clinics
- If funding cut: Reduce scope to core features only, defer enhancements

**Owner:** Program Manager
**Status:** ✅ Mitigated (regular stakeholder communication established)

---

### 2.2 Technical Risks

#### TR-001: Database Loss without Backup

**Description:** Database corrupted or deleted with no recent backup; permanent data loss.

**Probability:** Low (4)
**Impact:** Critical (5)
**Risk Score:** 20 (CRITICAL)

**Indicators:**
- Backup failures (disk full, network errors)
- No backup testing (restores never validated)
- Long time since last backup (>7 days)

**Root Causes:**
- Manual backup process (human error)
- No backup automation
- No backup monitoring/alerting
- Backup storage failure

**Mitigation Strategies:**
1. **Automated Daily Backups:** Cron job runs mysqldump every night at 2am
2. **Offsite Backup Storage:** Copy backups to S3 or Cloud Storage (3-2-1 rule)
3. **Backup Verification:** Weekly automated restore test (to separate database)
4. **Monitoring:** Alert if backup fails or size is 0 bytes
5. **30-Day Retention:** Keep daily backups for 30 days, monthly for 1 year

**Contingency Plan:**
- If database lost and no backup: Attempt data recovery from disk (fsck, photorec)
- If partial data recovered: Manual data entry to fill gaps
- If total loss: Restart from scratch (catastrophic failure)

**Owner:** DevOps Engineer
**Status:** ⚠️ CRITICAL (automated backups NOT implemented, must complete before production)

**Pre-Production Blocker:** ✅ YES

---

#### TR-002: Application Server Failure

**Description:** Application server crashes or becomes unresponsive; system unavailable.

**Probability:** Medium (3)
**Impact:** High (4)
**Risk Score:** 12 (MEDIUM)

**Indicators:**
- High CPU usage (>90% sustained)
- High memory usage (>90% sustained)
- 500 Internal Server Error responses
- Slow response times (>10 seconds)

**Root Causes:**
- Memory leak (PHP-FPM processes not recycling)
- Resource exhaustion (disk full, no swap)
- DDoS attack or traffic spike
- Configuration error (PHP max_execution_time too low)

**Mitigation Strategies:**
1. **Health Checks:** Nginx health check endpoint (`/health`)
2. **Auto-Restart:** Supervisor/systemd restarts PHP-FPM if crashed
3. **Resource Limits:** Limit PHP-FPM max children (prevent memory exhaustion)
4. **Monitoring:** Alert if server unreachable for >5 minutes
5. **Rate Limiting:** Prevent traffic spikes from overwhelming server

**Contingency Plan:**
- If server crashed: Restart Docker containers (`docker compose restart`)
- If unresponsive: SSH to server, check logs, kill hung processes
- If repeated crashes: Scale up server (more CPU/RAM) or investigate root cause

**Owner:** DevOps Engineer
**Status:** ⚠️ Partial mitigation (Docker auto-restart enabled, monitoring pending)

---

#### TR-003: Database Corruption

**Description:** MariaDB database files corrupted (e.g., InnoDB crash, disk failure).

**Probability:** Low (2)
**Impact:** High (4)
**Risk Score:** 8 (MEDIUM)

**Indicators:**
- "Table is marked as crashed" errors
- "Can't find file" errors
- SELECT queries return inconsistent results

**Root Causes:**
- Improper shutdown (power loss, kill -9)
- Disk errors (bad sectors)
- MariaDB bug
- Filesystem corruption

**Mitigation Strategies:**
1. **InnoDB Crash Recovery:** MariaDB automatically repairs on restart (usually)
2. **Regular Backups:** Daily backups minimize data loss window
3. **RAID Storage:** Use RAID 1 or 10 for redundancy (if self-hosting)
4. **Filesystem Journaling:** Use journaling filesystem (ext4, XFS)
5. **UPS:** Uninterruptible Power Supply for server (prevents power loss corruption)

**Contingency Plan:**
- If corruption detected: Stop MariaDB, run `mysqlcheck --repair`
- If repair fails: Restore from latest backup (potential data loss)
- If backup also corrupted: Restore from older backup (greater data loss)

**Owner:** DBA / DevOps Engineer
**Status:** ✅ Mitigated (MariaDB crash recovery enabled, backups planned)

---

#### TR-004: Third-Party Dependency Vulnerability

**Description:** Critical security vulnerability discovered in Symfony, Doctrine, or other dependency.

**Probability:** Medium (3)
**Impact:** High (4)
**Risk Score:** 12 (MEDIUM)

**Indicators:**
- CVE (Common Vulnerabilities and Exposures) published
- GitHub Dependabot alert
- `npm audit` or `composer audit` reports critical vulnerability

**Root Causes:**
- Zero-day vulnerability (unknown until disclosure)
- Delayed patching (not monitoring security advisories)

**Mitigation Strategies:**
1. **Dependency Scanning:** Run `npm audit` and `composer audit` in CI/CD
2. **Automated Alerts:** GitHub Dependabot or Snyk alerts for vulnerabilities
3. **Regular Updates:** Update dependencies monthly (or immediately for critical vulnerabilities)
4. **Lock Files:** Use `composer.lock` and `package-lock.json` for reproducible builds
5. **Security Monitoring:** Subscribe to Symfony security advisories

**Contingency Plan:**
- If critical vulnerability discovered: Emergency update and deployment within 24 hours
- If patch not available: Implement workaround (disable vulnerable feature, add WAF rule)
- If no workaround: Take system offline until patch available (extreme case)

**Owner:** Engineering Team
**Status:** ✅ Mitigated (`npm audit` and `composer audit` run in CI/CD)

---

#### TR-005: Performance Degradation

**Description:** System becomes slow over time; response times exceed acceptable limits.

**Probability:** Medium (3)
**Impact:** Medium (3)
**Risk Score:** 9 (MEDIUM)

**Indicators:**
- API response times >5 seconds (p95)
- User complaints about slowness
- Database query log shows slow queries (>1 second)

**Root Causes:**
- Database table growth (no indexing or partitioning)
- Memory leaks (PHP processes not recycled)
- Inefficient queries (N+1 problem)
- Unoptimized frontend (large JavaScript bundles)

**Mitigation Strategies:**
1. **Performance Monitoring:** APM tool (New Relic, Datadog) tracks response times
2. **Database Indexing:** Add indexes on frequently queried columns
3. **Query Optimization:** Use EXPLAIN to analyze slow queries, optimize
4. **Caching:** Implement Redis caching for expensive queries
5. **Load Testing:** Quarterly load tests to identify bottlenecks

**Contingency Plan:**
- If slow due to database: Add indexes, optimize queries, scale up database
- If slow due to PHP: Increase PHP-FPM worker count, add more servers
- If slow due to frontend: Code splitting, lazy loading, CDN

**Owner:** Engineering Team
**Status:** ⚠️ No monitoring yet (acceptable for MVP, critical for production)

---

#### TR-006: Docker Registry Unavailable

**Description:** Cannot pull Docker images during deployment; deployment blocked.

**Probability:** Low (2)
**Impact:** Medium (3)
**Risk Score:** 6 (LOW)

**Indicators:**
- `docker pull` times out or fails
- DockerHub or GitHub Container Registry down

**Root Causes:**
- Registry outage (DockerHub, GitHub)
- Network connectivity issue
- Rate limit exceeded (DockerHub free tier: 100 pulls/6 hours)

**Mitigation Strategies:**
1. **Private Registry:** Host own Docker registry (Harbor, GitLab Registry)
2. **Image Caching:** Cache images on production server (avoid re-pulling)
3. **Multiple Registries:** Mirror images to multiple registries (DockerHub + GitHub)
4. **Manual Fallback:** Keep Docker image tarball backup on server

**Contingency Plan:**
- If DockerHub down: Use GitHub Container Registry (ghcr.io)
- If all registries down: Load image from tarball (`docker load < image.tar`)

**Owner:** DevOps Engineer
**Status:** ✅ Low priority (rare occurrence)

---

### 2.3 Security Risks

#### SR-001: Data Breach (Unauthorized Access to Patient Data)

**Description:** Attacker gains access to database or API; steals patient records.

**Probability:** Low (4)
**Impact:** Critical (5)
**Risk Score:** 20 (CRITICAL)

**Indicators:**
- Unusual database queries (SELECT * FROM patients WHERE 1=1)
- Failed login attempts from unknown IPs
- Data exfiltration (large data transfers)
- User reports unauthorized access to their account

**Root Causes:**
- SQL injection vulnerability
- Weak passwords (brute force attack)
- Insider threat (malicious employee)
- Server misconfiguration (exposed database port)

**Mitigation Strategies:**
1. **Parameterized Queries:** All queries use Doctrine QueryBuilder (SQL injection prevention)
2. **Strong Password Policy:** Minimum 12 characters, complexity requirements
3. **Two-Factor Authentication:** TOTP-based 2FA for all users (v1.1)
4. **Access Control:** Database firewalled (only accessible from app server)
5. **Intrusion Detection:** Monitor for suspicious activity (failed logins, bulk exports)
6. **Encryption:** HTTPS enforced, database encryption at rest (v1.2)
7. **Security Audit:** External penetration test before production

**Contingency Plan (Breach Response):**
1. **Containment:** Block attacker IP, revoke compromised credentials
2. **Assessment:** Determine scope (how many records accessed)
3. **Notification:** Notify AEPD (Spanish Data Protection Agency) within 72 hours
4. **Patient Notification:** If >100 records or high-risk data, notify affected patients
5. **Remediation:** Fix vulnerability, implement additional controls
6. **Documentation:** Record incident details for compliance and post-mortem

**Owner:** Security Officer
**Status:** ⚠️ CRITICAL (penetration test pending, 2FA not implemented)

**Pre-Production Blocker:** ✅ YES (penetration test required)

---

#### SR-002: Ransomware Attack

**Description:** Malware encrypts server files; attackers demand payment for decryption key.

**Probability:** Low (2)
**Impact:** Critical (5)
**Risk Score:** 10 (MEDIUM)

**Indicators:**
- Files renamed with strange extensions (.locked, .encrypted)
- Ransom note (text file or wallpaper)
- Server unusable

**Root Causes:**
- Phishing attack (user clicks malicious link)
- Unpatched vulnerability (RDP, SMB exploit)
- Weak passwords (brute force)

**Mitigation Strategies:**
1. **Backups:** Offline backups (not accessible from server) prevent encryption
2. **Security Updates:** Regular OS and application patching
3. **Firewall:** Close unnecessary ports (RDP, SMB)
4. **User Training:** Phishing awareness training
5. **Antivirus:** Server-side antivirus (ClamAV)

**Contingency Plan:**
- **DO NOT pay ransom** (no guarantee of decryption, funds criminal activity)
- Wipe server, restore from backup (potential data loss since last backup)
- Report to authorities (FBI, Europol)

**Owner:** Security Officer + DevOps Engineer
**Status:** ✅ Mitigated (backups prevent total loss, but not implemented yet)

---

#### SR-003: Denial of Service (DoS) Attack

**Description:** Attacker floods server with requests; legitimate users cannot access system.

**Probability:** Medium (3)
**Impact:** Medium (3)
**Risk Score:** 9 (MEDIUM)

**Indicators:**
- Extremely high traffic (1000+ req/sec)
- Server CPU/bandwidth maxed out
- Legitimate requests timing out

**Root Causes:**
- DDoS attack (distributed from many IPs)
- Single attacker with botnet
- Misconfigured application (infinite loop causing self-DoS)

**Mitigation Strategies:**
1. **Rate Limiting:** Limit to 10 requests/sec per IP
2. **CloudFlare:** CDN with DDoS protection (absorbs attack traffic)
3. **Firewall:** Block known malicious IPs (fail2ban)
4. **Web Application Firewall (WAF):** CloudFlare WAF or AWS WAF

**Contingency Plan:**
- If under attack: Enable CloudFlare "Under Attack Mode" (CAPTCHA for all visitors)
- If specific IP: Block at firewall level
- If sustained: Contact hosting provider for DDoS mitigation service

**Owner:** DevOps Engineer
**Status:** ⚠️ No rate limiting or WAF implemented (should add before production)

---

#### SR-004: Insider Threat (Malicious Employee)

**Description:** Employee with legitimate access steals patient data or sabotages system.

**Probability:** Very Low (1)
**Impact:** High (4)
**Risk Score:** 4 (LOW)

**Indicators:**
- Unusual access patterns (logged in at 3am, accessing 100+ patient records)
- Data export (large CSV download)
- Account used from unexpected location

**Root Causes:**
- Disgruntled employee (recent termination, demotion)
- Financial motivation (selling data)
- Lack of access controls (employee has more access than needed)

**Mitigation Strategies:**
1. **Least Privilege:** Role-based access control (receptionists cannot access financial data)
2. **Audit Logging:** Log all data access (who viewed which patient when)
3. **Access Review:** Quarterly review of user permissions
4. **Offboarding:** Immediately revoke access when employee leaves
5. **Data Loss Prevention:** Alert on bulk exports (>50 records in 1 hour)

**Contingency Plan:**
- If suspected: Immediately revoke employee's access, review audit logs
- If confirmed: Terminate employment, legal action if appropriate
- If data stolen: Follow data breach response plan

**Owner:** HR + Security Officer
**Status:** ⚠️ Partial mitigation (RBAC not granular, audit logging not implemented)

---

#### SR-005: Security Audit Failure (Penetration Test Findings)

**Description:** External security audit identifies critical vulnerabilities; deployment blocked.

**Probability:** Medium (3)
**Impact:** High (5)
**Risk Score:** 15 (HIGH)

**Indicators:**
- Penetration test report lists high-severity findings
- Auditor recommends delaying production deployment
- Vulnerabilities require significant refactoring to fix

**Root Causes:**
- Security oversight during development
- OWASP Top 10 vulnerabilities (SQL injection, XSS, etc.)
- Misconfiguration (default credentials, debug mode enabled)

**Mitigation Strategies:**
1. **Pre-Audit Security Review:** Internal security checklist before external audit
2. **OWASP Compliance:** Ensure OWASP Top 10 mitigations in place
3. **Security Testing:** Run OWASP ZAP automated scan
4. **Code Review:** Security-focused code review before audit

**Contingency Plan:**
- If critical findings: Delay go-live, fix vulnerabilities (1-4 weeks)
- If medium findings: Deploy with risk acceptance, fix in v1.1
- If low findings: Fix in next sprint

**Owner:** Security Officer + Engineering Team
**Status:** ⚠️ Pending (security audit not yet scheduled)

**Pre-Production Blocker:** ✅ YES

---

### 2.4 Compliance Risks

#### CR-001: GDPR Non-Compliance

**Description:** System violates GDPR; Spanish Data Protection Agency (AEPD) issues fine.

**Probability:** Medium (4)
**Impact:** High (4)
**Risk Score:** 16 (HIGH)

**Indicators:**
- AEPD audit finds violations
- Patient complaint to AEPD
- Missing required GDPR features (consent, data export, erasure)

**Root Causes:**
- No consent tracking
- No data portability (export feature)
- No right to erasure (pseudonymization)
- No data breach notification mechanism

**Mitigation Strategies:**
1. **GDPR Gap Analysis:** Review all GDPR requirements, document compliance status
2. **Consent Tracking:** Implement digital consent with timestamp (v1.2)
3. **Data Export:** Patient can request data in JSON format (v1.1)
4. **Pseudonymization:** Replace patient name with "DELETED PATIENT #ID" (v1.2)
5. **Legal Review:** External GDPR compliance audit before production

**Contingency Plan:**
- If AEPD audit: Cooperate fully, provide documentation, fix violations ASAP
- If fine issued: Pay fine, implement remediation plan
- If patient complaint: Investigate, resolve, document

**Owner:** Legal Advisor + Product Owner
**Status:** ⚠️ Compliance gaps identified (data export feature missing)

**Pre-Production Blocker:** ⚠️ MAYBE (consult legal advisor)

---

#### CR-002: Medical Records Retention Violation

**Description:** Clinical records deleted before legal retention period (15 years in Spain).

**Probability:** Very Low (1)
**Impact:** High (4)
**Risk Score:** 4 (LOW)

**Indicators:**
- Records missing from database
- Audit discovers premature deletion

**Root Causes:**
- User error (accidental deletion)
- Software bug (cascade delete)
- Misunderstanding of retention requirements

**Mitigation Strategies:**
1. **No Delete Feature:** Clinical records have no delete button (immutable by design)
2. **Soft Deletes:** If deletion required, mark as deleted (don't actually delete)
3. **Retention Policy Documentation:** Clearly document 15-year retention requirement
4. **Backups:** Long-term backups (7 years) ensure recovery if deleted

**Contingency Plan:**
- If records deleted: Restore from backup
- If backup too old: Cannot recover (legal violation, document incident)

**Owner:** Legal Advisor + DBA
**Status:** ✅ Mitigated (no delete feature for clinical records)

---

#### CR-003: Invoice Numbering Non-Compliance

**Description:** Invoice numbers not sequential or have gaps; tax audit violation.

**Probability:** Low (2)
**Impact:** Medium (3)
**Risk Score:** 6 (LOW)

**Indicators:**
- Invoice number gaps detected (e.g., 2025000001, 2025000003, missing 2025000002)
- Tax auditor questions missing invoices

**Root Causes:**
- Software bug (concurrent invoice creation)
- User error (manual number assignment)
- Database rollback (transaction failed, number lost)

**Mitigation Strategies:**
1. **Gap Detection:** `/api/invoices/number-gaps` endpoint identifies gaps
2. **Transaction Isolation:** Use database transactions for invoice creation
3. **Unique Constraint:** Database enforces unique invoice numbers
4. **Audit Trail:** Log all invoice creations

**Contingency Plan:**
- If gap detected: Create "cancelled invoice" placeholder for missing number
- If questioned by auditor: Provide gap detection report, explain technical issue

**Owner:** Engineering Team
**Status:** ✅ Mitigated (gap detection implemented, unique constraint enforced)

---

### 2.5 Operational Risks

#### OR-001: Key Person Dependency (Bus Factor)

**Description:** Single developer knows entire codebase; if unavailable, project stalled.

**Probability:** Medium (3)
**Impact:** High (4)
**Risk Score:** 12 (MEDIUM)

**Indicators:**
- Only one person can fix production issues
- Code reviews not possible (no other reviewer)
- Long vacation or illness blocks progress

**Root Causes:**
- Small team (solo developer)
- No knowledge transfer
- Poor documentation

**Mitigation Strategies:**
1. **Documentation:** Comprehensive technical documentation (this document set)
2. **Code Comments:** Self-documenting code with clear intent
3. **Pair Programming:** Occasional pair sessions with junior developer
4. **Backup Developer:** Identify external consultant who can step in
5. **Cross-Training:** Train clinic staff on basic troubleshooting

**Contingency Plan:**
- If developer unavailable: Contact backup consultant, use documentation to guide
- If critical issue: Prioritize resolution over new features

**Owner:** Program Manager
**Status:** ⚠️ High risk (single developer, mitigated by documentation)

---

#### OR-002: Insufficient Training

**Description:** Users not trained properly; make errors or avoid using system.

**Probability:** Medium (3)
**Impact:** Medium (3)
**Risk Score:** 9 (MEDIUM)

**Indicators:**
- Users asking same questions repeatedly
- Data entry errors (wrong patient selected, incorrect dates)
- Users revert to paper records

**Root Causes:**
- No formal training (only informal demo)
- Training too short or not hands-on
- Different user skill levels (some tech-savvy, some not)

**Mitigation Strategies:**
1. **Comprehensive Training:** 2-day hands-on training for all users
2. **User Manual:** Step-by-step guide with screenshots
3. **Video Tutorials:** Short videos for common tasks (YouTube or internal)
4. **On-Site Support:** Developer available for 1 week post-launch
5. **Refresher Training:** Monthly Q&A session for first 3 months

**Contingency Plan:**
- If users struggling: Additional training sessions, one-on-one coaching
- If persistent errors: Simplify UI, add validation, improve error messages

**Owner:** Product Owner + Training Coordinator
**Status:** ⚠️ Training plan in development (not yet delivered)

---

#### OR-003: Data Migration Errors

**Description:** Data migration from legacy system introduces errors or data loss.

**Probability:** Medium (3)
**Impact:** High (4)
**Risk Score:** 12 (MEDIUM)

**Indicators:**
- Patient count mismatch (legacy vs new system)
- Data inconsistencies (wrong dates, missing fields)
- User reports missing records

**Root Causes:**
- Migration script bugs
- Data format differences (legacy system uses different schema)
- Character encoding issues (legacy system not UTF-8)

**Mitigation Strategies:**
1. **Test Migration:** Run migration on copy of legacy data, validate results
2. **Data Validation:** Compare record counts, checksums
3. **Backup Legacy System:** Keep legacy system operational during transition
4. **Rollback Plan:** If migration fails, revert to legacy system
5. **Manual Verification:** Spot-check 10% of migrated records

**Contingency Plan:**
- If errors detected: Fix migration script, re-run migration
- If data loss: Restore missing records from legacy system backup
- If unrecoverable: Manual data entry for missing records

**Owner:** Engineering Team + Data Migration Lead
**Status:** ⚠️ Not applicable if no legacy system (greenfield deployment)

---

#### OR-004: Network Outage

**Description:** Internet connection lost; system inaccessible to users.

**Probability:** Medium (3)
**Impact:** Medium (3)
**Risk Score:** 9 (MEDIUM)

**Indicators:**
- Cannot access system URL
- "Connection timed out" errors
- Ping to server fails

**Root Causes:**
- ISP outage
- Router failure
- Network misconfiguration

**Mitigation Strategies:**
1. **Backup Internet:** Secondary ISP or 4G/5G hotspot
2. **Uptime Monitoring:** Alert if server unreachable (UptimeRobot)
3. **Local Network:** Ensure clinic Wi-Fi is reliable

**Contingency Plan:**
- If ISP outage: Switch to backup internet connection
- If server outage: Contact hosting provider
- If extended outage: Revert to paper records temporarily

**Owner:** IT Support + DevOps Engineer
**Status:** ✅ Acceptable (clinic has reliable internet)

---

#### OR-005: Budget Overrun

**Description:** Project costs exceed budget; funding runs out before completion.

**Probability:** Low (2)
**Impact:** High (4)
**Risk Score:** 8 (MEDIUM)

**Indicators:**
- Spending >90% of budget with <90% completion
- Unexpected costs (licensing, infrastructure)
- Scope creep (additional features requested)

**Root Causes:**
- Underestimated effort
- Scope creep (features added mid-project)
- Expensive external services (APM, monitoring)

**Mitigation Strategies:**
1. **Fixed Scope:** Defer non-critical features to v1.1
2. **Budget Tracking:** Monthly budget review
3. **Change Control:** All scope changes require budget approval
4. **Open-Source:** Use free/open-source tools where possible

**Contingency Plan:**
- If budget exceeded: Reduce scope, defer enhancements
- If funding cut: Deliver MVP only, pause development

**Owner:** Program Manager + Finance
**Status:** ✅ Low risk (MVP approach, minimal dependencies)

---

### 2.6 Project Risks

#### PR-001: Delayed Go-Live

**Description:** Production deployment delayed beyond target date (March 15, 2026).

**Probability:** Medium (3)
**Impact:** Medium (3)
**Risk Score:** 9 (MEDIUM)

**Indicators:**
- Milestone dates missed
- Security audit takes longer than expected
- Critical bugs discovered in UAT

**Root Causes:**
- Underestimated effort
- Unexpected technical challenges
- External dependencies (security auditor availability)

**Mitigation Strategies:**
1. **Buffer Time:** Include 2-week buffer in timeline
2. **Early Audits:** Schedule security audit early (not at last minute)
3. **Parallel Activities:** Run UAT and security audit in parallel
4. **Risk-Adjusted Timeline:** Commit to April 1 internally, March 15 externally

**Contingency Plan:**
- If delayed by <2 weeks: Communicate new date, adjust marketing
- If delayed by >1 month: Conduct post-mortem, identify root cause

**Owner:** Program Manager
**Status:** ✅ Mitigated (buffer time included in plan)

---

#### PR-002: Scope Creep

**Description:** Unplanned features added mid-project; timeline and budget impacted.

**Probability:** Medium (3)
**Impact:** Medium (3)
**Risk Score:** 9 (MEDIUM)

**Indicators:**
- Features not in PRD being developed
- Timeline slipping due to "just one more feature"
- User requests during UAT treated as must-haves

**Root Causes:**
- Weak change control process
- Pressure from stakeholders
- Developer enthusiasm (adding features proactively)

**Mitigation Strategies:**
1. **Change Control:** All new features require Change Request (CR) approval
2. **Prioritization:** New features added to backlog, not current sprint
3. **MVP Focus:** Remind stakeholders of MVP scope (defer enhancements to v1.1)
4. **Backlog Grooming:** Regular review of backlog, prune low-priority items

**Contingency Plan:**
- If scope creeps: Pause new features, complete existing scope first
- If timeline impacted: Cut low-priority features, defer to v1.1

**Owner:** Product Owner + Program Manager
**Status:** ✅ Mitigated (change control process documented)

---

#### PR-003: Resource Unavailability

**Description:** Key team member unavailable (illness, resignation); project delayed.

**Probability:** Low (2)
**Impact:** High (4)
**Risk Score:** 8 (MEDIUM)

**Indicators:**
- Team member on extended sick leave
- Resignation during critical project phase
- Vacation during go-live week

**Root Causes:**
- Illness or personal emergency
- Job offer from another company
- Burnout from overwork

**Mitigation Strategies:**
1. **Cross-Training:** Multiple team members can handle critical tasks
2. **Documentation:** Knowledge not locked in one person's head
3. **Backup Resources:** Identify external consultant for emergencies
4. **Vacation Planning:** No vacations during go-live week

**Contingency Plan:**
- If developer unavailable: Activate backup consultant
- If extended absence: Delay go-live if critical, continue if minor

**Owner:** Program Manager
**Status:** ⚠️ High risk (single developer, mitigated by documentation)

---

## 3. Risk Heat Map

```
Impact
 ↑
 5 │                    │ SR-001 (Data Breach)
   │                    │ TR-001 (Database Loss)
 4 │                    │ CR-001 (GDPR)        │ SR-005 (Audit Fail)
   │                    │ TR-002 (Server Fail) │ OR-001 (Bus Factor)
 3 │                    │ TR-005 (Performance) │
   │                    │ OR-002 (Training)    │
 2 │                    │                       │
   │                    │                       │
 1 │                    │                       │
   └────────────────────┼──────────────────────┼─────────────────────► Probability
                        1    2    3    4    5

Legend:
  Low Risk (1-7)     │ Medium Risk (8-14)   │ High Risk (15-19)    │ Critical Risk (20-25)
```

---

## 4. Risk Mitigation Timeline

### 4.1 Pre-Production (Must Complete Before Go-Live)

| Risk ID | Action | Owner | Deadline | Status |
|---------|--------|-------|----------|--------|
| **TR-001** | Implement automated daily backups | DevOps | Jan 15, 2026 | ⚠️ Pending |
| **SR-001** | Complete penetration test | Security | Jan 30, 2026 | ⚠️ Pending |
| **SR-005** | Security audit (external) | Security | Jan 30, 2026 | ⚠️ Pending |
| **CR-001** | Add data export feature (GDPR) | Engineering | Feb 15, 2026 | ⚠️ Pending |
| **OR-002** | Deliver user training | Product | Feb 15, 2026 | ⚠️ Pending |

### 4.2 Post-Production (v1.1 - Q2 2026)

| Risk ID | Action | Priority |
|---------|--------|----------|
| **SR-001** | Implement 2FA | High |
| **SR-003** | Add rate limiting | High |
| **OR-001** | Cross-train backup developer | Medium |
| **TR-005** | Implement APM (New Relic) | Medium |

---

## 5. Risk Monitoring

### 5.1 Risk Review Cadence

| Review Type | Frequency | Participants | Purpose |
|-------------|-----------|--------------|---------|
| **Daily Standup** | Daily | Engineering Team | Identify new technical risks |
| **Sprint Review** | Bi-weekly | Product + Engineering | Review risk status, mitigation progress |
| **Steering Committee** | Monthly | Stakeholders + PMO | Executive risk overview, decision-making |
| **Post-Production Review** | Quarterly | All Teams | Reassess risks, update mitigation plans |

### 5.2 Risk Escalation Path

**Level 1 (Team):**
- Technical risks identified by engineering team
- Resolve within team (1-3 days)

**Level 2 (Product Owner):**
- Risks impacting timeline or scope
- Product Owner approval required for scope changes

**Level 3 (Steering Committee):**
- Critical risks (score 15+)
- Risks impacting budget or go-live date
- Escalation requires executive decision

**Level 4 (Executive Sponsor):**
- Catastrophic risks (database loss, security breach)
- Legal or regulatory implications
- Immediate executive notification required

---

## 6. Contingency Plans Summary

### 6.1 Critical Incident Response

**Data Breach:**
1. Contain: Block attacker, revoke credentials
2. Assess: Determine scope (records affected)
3. Notify: AEPD within 72 hours, patients if high risk
4. Remediate: Fix vulnerability, enhance controls
5. Document: Incident report for compliance

**Database Loss:**
1. Stop application (prevent further damage)
2. Restore from latest backup
3. Validate data integrity
4. Restart application
5. Investigate root cause

**Server Failure:**
1. Check server health (SSH, logs)
2. Restart Docker containers
3. If unresponsive: Reboot server
4. If repeated: Scale up resources

---

## 7. Lessons Learned (Future Risk Reduction)

### 7.1 Post-Implementation Review (After Go-Live)

**Schedule:** 30 days after production deployment

**Agenda:**
1. Review risk register: Which risks materialized? Which didn't?
2. Evaluate mitigation effectiveness: Did our strategies work?
3. Identify new risks: What risks emerged that we didn't anticipate?
4. Update risk register: Revise probabilities based on actual experience
5. Document lessons: What would we do differently next time?

---

## 8. Appendices

### 8.1 Risk Assessment Matrix

| Probability | Very Low (1) | Low (2) | Medium (3) | High (4) | Very High (5) |
|-------------|--------------|---------|------------|----------|---------------|
| **Critical (5)** | 5 (Low) | 10 (Medium) | 15 (High) | 20 (Critical) | 25 (Critical) |
| **High (4)** | 4 (Low) | 8 (Medium) | 12 (Medium) | 16 (High) | 20 (Critical) |
| **Medium (3)** | 3 (Low) | 6 (Low) | 9 (Medium) | 12 (Medium) | 15 (High) |
| **Low (2)** | 2 (Low) | 4 (Low) | 6 (Low) | 8 (Medium) | 10 (Medium) |
| **Negligible (1)** | 1 (Low) | 2 (Low) | 3 (Low) | 4 (Low) | 5 (Low) |

### 8.2 Risk Response Strategies

| Strategy | Description | When to Use |
|----------|-------------|-------------|
| **Avoid** | Eliminate risk by changing approach | High probability + high impact |
| **Mitigate** | Reduce probability or impact | Most common strategy |
| **Transfer** | Shift risk to third party (insurance, vendor) | Financial risks, liability |
| **Accept** | Acknowledge risk, do nothing (monitor) | Low probability + low impact |

---

**Document End**
