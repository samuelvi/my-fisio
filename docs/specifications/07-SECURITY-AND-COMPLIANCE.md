# Security & Compliance
## Physiotherapy Clinic Management System

**Document Version:** 1.0
**Last Updated:** December 30, 2025
**Classification:** Internal - Confidential
**Owner:** Chief Security Officer & Compliance Team

---

## 1. Executive Summary

This document provides a comprehensive specification of security architecture, authentication mechanisms, authorization policies, data protection measures, and regulatory compliance strategies for the Physiotherapy Clinic Management System. The system handles sensitive personal and medical data, requiring rigorous security controls to protect against unauthorized access, data breaches, and regulatory violations.

### 1.1 Security Posture

**Current Status:** Production-ready with baseline security controls
**Risk Level:** Medium (pending external security audit)
**Compliance Target:** GDPR, Spanish LOPD (Ley Orgánica de Protección de Datos)

### 1.2 Critical Security Controls

| Control | Status | Priority |
|---------|--------|----------|
| **Authentication (JWT)** | ✅ Implemented | Critical |
| **HTTPS/TLS** | ⚠️ Not configured (dev only) | Critical |
| **Input Validation** | ✅ Implemented | Critical |
| **SQL Injection Prevention** | ✅ Implemented | Critical |
| **XSS Prevention** | ✅ Implemented | Critical |
| **Role-Based Access Control** | ⚠️ Partial (basic roles only) | High |
| **Rate Limiting** | ⚠️ Not implemented | High |
| **Two-Factor Authentication** | ⚠️ Not implemented | Medium |
| **Security Monitoring** | ⚠️ Not implemented | High |
| **Penetration Testing** | ⚠️ Pending | Critical |

---

## 2. Threat Model

### 2.1 Assets to Protect

**Critical Assets:**
1. **Patient Medical Records** (special category personal data)
2. **Patient Personal Information** (names, contact details, dates of birth)
3. **User Credentials** (hashed passwords, JWT tokens)
4. **Invoice Financial Data** (payment information, tax IDs)
5. **Authentication Tokens** (JWT tokens, authentication state)

**Asset Classification:**

| Asset | Confidentiality | Integrity | Availability | Regulatory |
|-------|----------------|-----------|--------------|------------|
| Medical Records | Critical | Critical | High | GDPR Art. 9 |
| Patient PII | Critical | Critical | High | GDPR Art. 6 |
| User Credentials | Critical | Critical | Critical | GDPR Art. 32 |
| Financial Data | High | Critical | High | Tax law, GDPR |
| Authentication Tokens | High | High | High | - |

### 2.2 Threat Actors

| Threat Actor | Motivation | Capability | Likelihood |
|--------------|-----------|------------|------------|
| **External Attacker** | Financial gain, data theft | Medium-High | Medium |
| **Malicious Insider** | Data theft, sabotage | High | Low |
| **Curious Insider** | Unauthorized access to patient records | Medium | Medium |
| **Competitors** | Business intelligence | Low-Medium | Low |
| **Nation-State** | Data collection | High | Very Low |

### 2.3 Attack Vectors

**High-Risk Vectors:**
1. **Credential Theft** (phishing, keylogging, brute force)
2. **SQL Injection** (exploiting input validation flaws)
3. **Cross-Site Scripting (XSS)** (executing malicious scripts in browser)
4. **Cross-Site Request Forgery (CSRF)** (unauthorized actions on behalf of user)
5. **JWT Token Theft** (stealing authentication tokens from client storage)
6. **Denial of Service (DoS)** (overwhelming server resources)
7. **Man-in-the-Middle** (intercepting unencrypted traffic)
8. **Insider Threat** (authorized user accessing data beyond their role)

**Attack Scenarios:**

**Scenario 1: External Attacker - Credential Theft**
- Attacker sends phishing email to clinic staff
- Staff member clicks malicious link, enters credentials
- Attacker gains access to system, downloads patient records
- **Mitigation:** 2FA, security awareness training, email filtering

**Scenario 2: SQL Injection Attack**
- Attacker enters `' OR 1=1 --` into patient search field
- Vulnerable query returns all patients
- **Mitigation:** Parameterized queries (✅ Implemented)

**Scenario 3: JWT Token Theft**
- Attacker intercepts unencrypted HTTP traffic, steals JWT token
- Attacker uses token to impersonate user
- **Mitigation:** HTTPS enforced (⚠️ Production only)

---

## 3. Authentication Architecture

### 3.1 Authentication Flow

**Technology:** JWT (JSON Web Tokens) with RS256 asymmetric encryption

**Login Sequence:**
```
1. User → Frontend: Enters email + password
2. Frontend → Backend: POST /api/login_check
3. Backend → Database: Validates credentials (bcrypt hash comparison)
4. Backend → Backend: Generates JWT token (signed with private key)
5. Backend → Frontend: Returns JWT token
6. Frontend → LocalStorage: Stores token
7. Frontend → Backend: All API calls include Authorization: Bearer {token}
8. Backend → Backend: Validates token signature (public key)
9. Backend → Frontend: Returns protected resource
```

**Sequence Diagram:**
```
┌─────────┐          ┌──────────┐          ┌──────────┐          ┌──────────┐
│ User    │          │ Frontend │          │ Backend  │          │ Database │
└────┬────┘          └────┬─────┘          └────┬─────┘          └────┬─────┘
     │                    │                     │                     │
     │ Login form         │                     │                     │
     ├───────────────────>│                     │                     │
     │                    │ POST /api/login_check                    │
     │                    ├────────────────────>│                     │
     │                    │                     │ SELECT user WHERE email=? │
     │                    │                     ├────────────────────>│
     │                    │                     │<────────────────────┤
     │                    │                     │ Verify password     │
     │                    │                     │ (bcrypt compare)    │
     │                    │                     │                     │
     │                    │                     │ Generate JWT        │
     │                    │                     │ (sign with RS256)   │
     │                    │<────────────────────┤                     │
     │                    │ { "token": "..." }  │                     │
     │<───────────────────┤                     │                     │
     │ Store in localStorage                    │                     │
     │                    │                     │                     │
     │ Request protected resource               │                     │
     │                    ├────────────────────>│                     │
     │                    │ Authorization: Bearer <token>            │
     │                    │                     │ Validate signature  │
     │                    │                     │ (verify with public key) │
     │                    │                     │                     │
     │                    │<────────────────────┤                     │
     │<───────────────────┤ Protected data      │                     │
```

### 3.2 JWT Token Structure

**Token Components:**
```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT"
  },
  "payload": {
    "username": "tina@tinafisio.com",
    "roles": ["ROLE_ADMIN"],
    "exp": 1735574400,  // Expiration timestamp
    "iat": 1733155200   // Issued at timestamp
  },
  "signature": "..."  // RS256 signature
}
```

**Token Lifetime:** 28 days (configurable via `JWT_TOKEN_TTL`)

**Storage:** LocalStorage (frontend)
- ✅ Survives page refresh
- ⚠️ Vulnerable to XSS (mitigated by React auto-escaping)
- Alternative considered: HttpOnly cookies (rejected due to CORS complexity)

### 3.3 Password Security

**Hashing Algorithm:** Bcrypt
**Cost Factor:** 13 (production), 4 (tests)
**Salt:** Automatic (bcrypt includes random salt per password)

**Password Policy (Current):**
- ⚠️ No minimum length enforced
- ⚠️ No complexity requirements (uppercase, numbers, symbols)
- ⚠️ No password expiration
- ⚠️ No password history (can reuse old passwords)

**Password Policy (Recommended for Production):**
```yaml
# config/packages/security.yaml
security:
    password_hashers:
        Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface:
            algorithm: bcrypt
            cost: 13

    # Future: Add password validation
    validators:
        password:
            min_length: 12
            require_uppercase: true
            require_lowercase: true
            require_numbers: true
            require_special_chars: true
            expiration_days: 90
```

### 3.4 Authentication Management

**Authentication Method:** JWT (JSON Web Tokens) - Stateless
**Token Expiration:** Configurable via JWT_TTL (default: ~18 days)
**Token Storage:** Client-side (localStorage in browser)
**Token Validation:** Signature verification on each request

**JWT Configuration:**
```yaml
# config/packages/lexik_jwt_authentication.yaml
lexik_jwt_authentication:
    secret_key: '%env(resolve:JWT_SECRET_KEY)%'
    public_key: '%env(resolve:JWT_PUBLIC_KEY)%'
    pass_phrase: '%env(JWT_PASSPHRASE)%'
    token_ttl: 1555200  # ~18 days
```

**JWT Security:**
- ✅ Stateless authentication (no server-side session storage)
- ✅ Tokens signed with RS256 (asymmetric encryption)
- ✅ Token invalidation on logout (client-side removal)
- ✅ No session hijacking risk (no session cookies)
- ✅ Horizontal scalability (no session sharing needed)

**Security Considerations:**
- Tokens stored in localStorage (XSS protection required)
- No server-side token revocation (tokens valid until expiration)
- Refresh token mechanism not implemented (tokens long-lived)

### 3.5 Authentication Vulnerabilities & Mitigations

| Vulnerability | Risk | Current Mitigation | Recommended Enhancement |
|---------------|------|-------------------|------------------------|
| **Brute Force** | High | None | Rate limiting (10 attempts/hour) |
| **Credential Stuffing** | Medium | None | CAPTCHA after 3 failed attempts |
| **Token Theft** | High | HTTPS (prod), short token lifetime | HttpOnly cookies, token rotation |
| **Session Fixation** | N/A | JWT (stateless - no sessions) | ✅ Not applicable |
| **Password Reuse** | Medium | None | Password history check |
| **Weak Passwords** | High | None | Password complexity policy |

---

## 4. Authorization Architecture

### 4.1 Role-Based Access Control (RBAC)

**Roles Defined:**

| Role | Description | Access Level |
|------|-------------|--------------|
| `ROLE_USER` | Standard clinic staff | Full access (patients, appointments, records, invoices) |
| `ROLE_ADMIN` | Administrator | Full access (same as ROLE_USER currently) |

**Current Limitation:** ⚠️ No functional difference between `ROLE_USER` and `ROLE_ADMIN`

**Recommended Role Structure (v1.2):**

| Role | Patients | Appointments | Records | Invoices | Users | Settings |
|------|----------|--------------|---------|----------|-------|----------|
| `ROLE_RECEPTIONIST` | Read, Create, Update | Read, Create, Update, Delete | None | Read, Create | None | None |
| `ROLE_PRACTITIONER` | Read, Create, Update | Read, Create, Update, Delete | Full | None | None | None |
| `ROLE_BILLING` | Read | None | None | Full | None | None |
| `ROLE_ADMIN` | Full | Full | Full | Full | Full | Full |

### 4.2 Access Control Configuration

**File:** `config/packages/security.yaml`

```yaml
access_control:
    - { path: ^/api/test, roles: PUBLIC_ACCESS }
    - { path: ^/api/login_check, roles: PUBLIC_ACCESS }
    - { path: ^/api, roles: IS_AUTHENTICATED_FULLY }
```

**Current Policy:**
- Public: `/api/login_check`, `/api/test` (test environment only)
- Authenticated: All other `/api/*` endpoints

**Missing Granularity:**
- ⚠️ No per-endpoint role checks (all authenticated users can access all endpoints)
- ⚠️ No resource-level permissions (user can access any patient, not just their assigned patients)

### 4.3 API Platform Security

**Entity-Level Security (Example):**
```php
#[ApiResource(
    security: "is_granted('ROLE_USER')",
    operations: [
        new Get(security: "is_granted('ROLE_USER')"),
        new Post(security: "is_granted('ROLE_ADMIN')"),
        new Put(security: "is_granted('ROLE_ADMIN')"),
        new Delete(security: "is_granted('ROLE_ADMIN')"),
    ]
)]
```

**Current Status:** ⚠️ Security annotations not applied to entities

**Recommendation:** Add security expressions to all API Platform resources

### 4.4 Frontend Authorization

**Route Guards (React):**
```typescript
// Check if user is authenticated before rendering protected routes
if (!token) {
    return <Navigate to="/login" />;
}

// Check if user has required role
if (!user.roles.includes('ROLE_ADMIN')) {
    return <Navigate to="/unauthorized" />;
}
```

**Current Status:** ✅ Basic authentication check implemented
**Missing:** Role-based UI rendering (hide buttons/menus based on role)

### 4.5 Authorization Vulnerabilities & Mitigations

| Vulnerability | Risk | Current Mitigation | Recommended Enhancement |
|---------------|------|-------------------|------------------------|
| **Privilege Escalation** | High | Backend validates roles | Add resource-level permissions |
| **Insecure Direct Object Reference (IDOR)** | High | None | Check user ownership before access |
| **Missing Function Level Access Control** | High | None | Add `@Security` annotations to all endpoints |
| **Horizontal Privilege Escalation** | Medium | None | Validate user can only access their patients |

**IDOR Example (Vulnerable):**
```php
// User can access ANY patient by changing ID in URL
GET /api/patients/123  // No check if this patient belongs to requesting user
```

**IDOR Mitigation:**
```php
#[ApiResource(
    operations: [
        new Get(
            security: "is_granted('ROLE_USER') and object.getAssignedUser() == user"
        )
    ]
)]
```

---

## 5. Input Validation & Output Encoding

### 5.1 Backend Validation (Symfony Validator)

**Validation Constraints:**
```php
use Symfony\Component\Validator\Constraints as Assert;

class PatientResource
{
    #[Assert\NotBlank(message: 'First name is required')]
    #[Assert\Length(max: 50)]
    public string $firstName;

    #[Assert\Email(message: 'Invalid email format')]
    public ?string $email = null;
}
```

**Validation Points:**
- ✅ API Platform automatic validation on POST/PUT
- ✅ Custom validation in Processors
- ✅ Database constraints (NOT NULL, unique)

**Validation Strategy:**
- ✅ Whitelisting (only accept known-good input)
- ✅ Type checking (Symfony type hints enforce types)
- ✅ Length limits (prevent buffer overflows, DoS)

### 5.2 SQL Injection Prevention

**Strategy:** Parameterized queries via Doctrine QueryBuilder

**Secure Example:**
```php
$qb = $this->createQueryBuilder('p')
    ->where('p.fullName LIKE :search')
    ->setParameter('search', '%' . $search . '%');
```

**Why Secure:**
- User input (`$search`) never concatenated into SQL string
- Doctrine escapes parameter values
- MariaDB prepared statements prevent injection

**Status:** ✅ All queries use QueryBuilder or DQL (no raw SQL with user input)

### 5.3 Cross-Site Scripting (XSS) Prevention

**Frontend (React):**
- ✅ React auto-escapes all text content by default
- ✅ No use of `dangerouslySetInnerHTML`
- ✅ All user input rendered as text, not HTML

**Example (Secure):**
```tsx
// React automatically escapes {patient.firstName}
<h1>Patient: {patient.firstName}</h1>

// Even if firstName = "<script>alert('XSS')</script>",
// it renders as literal text, not executed
```

**Backend (Twig):**
- ✅ Twig auto-escapes all variables by default
- ✅ No use of `raw` filter on user-generated content

**Status:** ✅ No XSS vulnerabilities identified

### 5.4 Cross-Site Request Forgery (CSRF) Prevention

**Current Status:** ⚠️ Not implemented (JWT-based API has different CSRF considerations)

**CSRF Risk for JWT APIs:**
- **Low Risk:** JWT tokens in `Authorization` header not automatically sent by browser (unlike cookies)
- **Scenario:** If JWT stored in cookie (not used), CSRF attack possible

**Current Approach:**
- JWT in LocalStorage → Manually added to requests → Not vulnerable to CSRF

**Alternative (HttpOnly Cookie + CSRF Token):**
```yaml
# If switching to cookie-based JWT
framework:
    csrf_protection:
        enabled: true
```

**Recommendation:** Current approach (LocalStorage) acceptable; if switching to cookies, add CSRF tokens

---

## 6. Data Protection

### 6.1 Encryption at Rest

**Current Status:** ⚠️ Not configured

**Database Encryption:**
- MariaDB supports InnoDB encryption (transparent data encryption)
- Encrypts table data, indexes, redo logs

**How to Enable:**
```sql
-- Enable encryption plugin
INSTALL PLUGIN file_key_management SONAME 'file_key_management.so';

-- Configure encryption keys
SET GLOBAL file_key_management_filename = '/etc/mysql/encryption_keys.txt';
SET GLOBAL innodb_encryption_threads = 4;

-- Create encrypted table
CREATE TABLE patients (...) ENCRYPTED=YES;
```

**Backup Encryption:**
```bash
# Encrypt backup with GPG
mysqldump physiotherapy_db | gzip | gpg --encrypt --recipient admin@clinic.com > backup.sql.gz.gpg
```

**Production Requirement:**
- ✅ Enable InnoDB encryption
- ✅ Encrypt backups before offsite storage
- ✅ Use hardware security module (HSM) or key management service (AWS KMS) for keys

### 6.2 Encryption in Transit

**Current Status:** ⚠️ Development: HTTP only; Production: HTTPS required

**HTTPS Configuration (Nginx):**
```nginx
server {
    listen 443 ssl http2;
    server_name clinic.example.com;

    ssl_certificate /etc/ssl/certs/clinic.example.com.crt;
    ssl_certificate_key /etc/ssl/private/clinic.example.com.key;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256...';
    ssl_prefer_server_ciphers on;

    # HSTS (force HTTPS for 1 year)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

**Database Connection Encryption:**
```bash
# Require SSL for database connection
DATABASE_URL="mysql://user:pass@host:3306/db?ssl_mode=REQUIRED"
```

**Production Requirements:**
- ✅ TLS 1.2 or higher (TLS 1.0/1.1 deprecated)
- ✅ Strong cipher suites (ECDHE, AES-GCM)
- ✅ HSTS header (force HTTPS)
- ✅ Certificate from trusted CA (Let's Encrypt, DigiCert)
- ✅ Automatic certificate renewal (Certbot)

### 6.3 Sensitive Data Masking

**Current Status:** ⚠️ Not implemented

**Use Cases:**
- Mask tax ID in logs: `12345678A` → `*****678A`
- Mask phone in error reports: `+34 612 345 678` → `+34 ***  *** 678`
- Mask patient names in audit logs: `John Doe` → `J*** D***`

**Implementation (Monolog Processor):**
```php
class SensitiveDataProcessor
{
    public function __invoke(LogRecord $record): LogRecord
    {
        $record['message'] = preg_replace('/\b\d{8}[A-Z]\b/', '*****', $record['message']);
        return $record;
    }
}
```

**Recommendation:** Mask sensitive data in logs, error tracking (Sentry), and debug output

---

## 7. Security Headers

### 7.1 HTTP Security Headers (Nginx)

**Current Status:** ⚠️ Not configured

**Recommended Headers:**
```nginx
# Prevent clickjacking
add_header X-Frame-Options "SAMEORIGIN" always;

# Prevent MIME type sniffing
add_header X-Content-Type-Options "nosniff" always;

# Enable XSS filter (legacy browsers)
add_header X-XSS-Protection "1; mode=block" always;

# Content Security Policy (prevent XSS)
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self';" always;

# Referrer Policy (limit referrer information)
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# Permissions Policy (restrict browser features)
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

### 7.2 CORS Configuration

**Current Status:** ✅ Configured for development (NelmioCorsBundle)

**File:** `config/packages/nelmio_cors.yaml`
```yaml
nelmio_cors:
    defaults:
        origin_regex: true
        allow_origin: ['http://localhost:5173']  # Vite dev server
        allow_methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
        allow_headers: ['Content-Type', 'Authorization']
        expose_headers: ['Link']
        max_age: 3600
```

**Production Configuration:**
```yaml
# Allow only production domain
allow_origin: ['https://clinic.example.com']
```

**Security Considerations:**
- ⚠️ Never use `allow_origin: ['*']` in production (allows any domain)
- ✅ Whitelist only trusted origins
- ✅ Include credentials only if needed (`allow_credentials: true`)

---

## 8. Logging & Monitoring

### 8.1 Security Event Logging

**Current Status:** ⚠️ Partial (application logs only, no security-specific logs)

**Events to Log:**

| Event | Log Level | Data to Include |
|-------|-----------|----------------|
| **Login Success** | INFO | User email, IP address, timestamp |
| **Login Failure** | WARNING | Attempted email, IP address, timestamp |
| **Logout** | INFO | User email, timestamp |
| **Password Change** | INFO | User email, timestamp |
| **Unauthorized Access Attempt** | WARNING | User email, resource, IP address |
| **Data Modification** | INFO | User, entity type, entity ID, action |
| **Data Deletion** | WARNING | User, entity type, entity ID |
| **Admin Action** | INFO | User, action, timestamp |

**Logging Implementation (Monolog):**
```php
$this->logger->info('User login successful', [
    'user' => $user->getEmail(),
    'ip' => $request->getClientIp(),
    'user_agent' => $request->headers->get('User-Agent'),
]);
```

**Log Storage:**
- Development: `var/log/dev.log`
- Production: Centralized logging (ELK, CloudWatch, Datadog)

### 8.2 Intrusion Detection

**Current Status:** ⚠️ Not implemented

**Detection Strategies:**
1. **Failed Login Threshold:** >10 failed attempts in 1 hour → block IP
2. **Unusual Access Patterns:** User accessing 100+ patient records in 1 minute → alert
3. **Privilege Escalation Attempts:** User accessing admin endpoints → alert
4. **Data Exfiltration:** Large number of API calls → alert

**Implementation (Symfony Event Listener):**
```php
class SecurityMonitorListener
{
    public function onLoginFailure(LoginFailureEvent $event): void
    {
        $email = $event->getEmail();
        $ip = $event->getRequest()->getClientIp();

        $attempts = $this->cache->get("login_attempts_{$ip}") ?? 0;
        $this->cache->set("login_attempts_{$ip}", $attempts + 1, 3600);

        if ($attempts > 10) {
            $this->firewall->blockIp($ip);
            $this->alerting->send("IP blocked: {$ip} (too many failed logins)");
        }
    }
}
```

### 8.3 Security Monitoring Tools

**Recommended Tools:**

| Tool | Purpose | Priority |
|------|---------|----------|
| **Sentry** | Error tracking, exception monitoring | High |
| **Datadog / New Relic** | APM, performance monitoring | Medium |
| **OSSEC / Wazuh** | Host-based intrusion detection | Medium |
| **Fail2Ban** | Automated IP blocking | High |
| **CloudFlare WAF** | Web application firewall | High |

**Current Status:** ⚠️ None implemented

---

## 9. GDPR Compliance

### 9.1 Legal Basis for Processing

**GDPR Article 6 (Lawful Basis):**
- **Consent:** Patient consents to clinic storing their data
- **Contract:** Processing necessary for patient care contract
- **Legal Obligation:** Medical records required by law

**GDPR Article 9 (Special Category Data):**
- Medical/health data requires explicit consent or legal basis
- Clinic must document legal basis for processing health data

**Current Status:** ⚠️ Legal basis documented but not enforced in system (no consent tracking)

### 9.2 Data Subject Rights

**Right to Access (GDPR Art. 15):**
- Patient can request copy of all their data
- **Implementation:** Export patient + records + appointments as JSON or PDF
- **Timeline:** Respond within 30 days
- **Status:** ⚠️ Not implemented (manual export required)

**Right to Rectification (GDPR Art. 16):**
- Patient can request corrections to inaccurate data
- **Implementation:** Update patient record via UI
- **Status:** ✅ Implemented (edit patient form)

**Right to Erasure (GDPR Art. 17 - "Right to be Forgotten"):**
- Patient can request deletion of data
- **Limitation:** Medical records must be retained by law (15 years in Spain)
- **Implementation:** Pseudonymization (replace name with "DELETED PATIENT #123")
- **Status:** ⚠️ Not implemented

**Right to Data Portability (GDPR Art. 20):**
- Patient can request data in machine-readable format
- **Implementation:** Export as JSON or CSV
- **Status:** ⚠️ Not implemented

**Right to Object (GDPR Art. 21):**
- Patient can object to processing (e.g., marketing emails)
- **Status:** ⚠️ Not applicable (no marketing features)

### 9.3 Data Processing Inventory

**Data Processing Register (GDPR Art. 30):**

| Processing Activity | Data Categories | Legal Basis | Retention Period | Security Measures |
|-------------------|-----------------|-------------|------------------|-------------------|
| Patient Registration | Name, DOB, contact details | Consent, Contract | Active + 15 years | Encryption, access control |
| Clinical Records | Health data, treatment history | Consent, Legal Obligation | 15 years | Encryption, audit trail |
| Invoicing | Name, tax ID, address | Contract, Legal Obligation | 6 years (tax law) | Encryption, access control |
| User Authentication | Email, hashed password | Legitimate Interest | Employment + 1 year | Bcrypt, JWT |

**Status:** ⚠️ Register exists in documentation, not tracked in system

### 9.4 Data Breach Response Plan

**GDPR Requirements:**
- Notify supervisory authority within 72 hours (GDPR Art. 33)
- Notify affected data subjects if high risk (GDPR Art. 34)

**Breach Response Procedure:**
1. **Detection:** Identify breach (unauthorized access, data leak)
2. **Containment:** Stop ongoing breach (block access, revoke credentials)
3. **Assessment:** Determine scope (how many records, what data)
4. **Notification:**
   - If >100 records: Notify Spanish Data Protection Agency (AEPD) within 72 hours
   - If high risk: Notify affected patients
5. **Remediation:** Fix vulnerability, improve security controls
6. **Documentation:** Record breach details, response actions, lessons learned

**Current Status:** ⚠️ No documented breach response plan, no breach notification mechanism

### 9.5 Privacy by Design

**GDPR Principle:** Privacy by Design and Default (GDPR Art. 25)

**Implementation:**
- ✅ Minimal data collection (no unnecessary fields)
- ✅ Password hashing (bcrypt)
- ⚠️ No data minimization enforcement (all fields optional but stored indefinitely)
- ⚠️ No pseudonymization (patient names stored in plaintext)
- ⚠️ No automatic data deletion (inactive patients not archived)

**Recommendations:**
- Implement automatic archival (inactive patients >2 years)
- Add consent tracking (record when patient consented to data processing)
- Add data retention policies (automatic deletion after retention period)

---

## 10. Penetration Testing & Vulnerability Management

### 10.1 Security Audit Checklist

**Pre-Production Security Audit:**

| Test Category | Test Cases | Status |
|---------------|-----------|--------|
| **Authentication** | Brute force resistance, JWT token expiration | ⚠️ Pending |
| **Authorization** | IDOR, privilege escalation, missing access controls | ⚠️ Pending |
| **Injection** | SQL injection, command injection, LDAP injection | ⚠️ Pending |
| **XSS** | Reflected XSS, stored XSS, DOM-based XSS | ⚠️ Pending |
| **CSRF** | Token validation, SameSite cookies | ⚠️ Pending |
| **Sensitive Data** | Encryption at rest/transit, password storage | ⚠️ Pending |
| **Security Misconfiguration** | Default credentials, verbose error messages | ⚠️ Pending |
| **OWASP Top 10** | All OWASP Top 10 vulnerabilities | ⚠️ Pending |

### 10.2 Recommended Tools

**Static Analysis:**
- **PHPStan** (Level 8) - ✅ Configured, enforced in CI/CD
- **SonarQube** - ⚠️ Not configured (code quality + security vulnerabilities)
- **Snyk** - ⚠️ Not configured (dependency vulnerability scanning)

**Dynamic Analysis:**
- **OWASP ZAP** - ⚠️ Not run (automated penetration testing)
- **Burp Suite** - ⚠️ Not run (manual penetration testing)
- **Nikto** - ⚠️ Not run (web server scanner)

**Dependency Scanning:**
```bash
# Check for vulnerable npm packages
npm audit

# Check for vulnerable Composer packages
composer audit
```

**Current Status:**
- ✅ `npm audit` run periodically (no critical vulnerabilities)
- ✅ `composer audit` run periodically (no critical vulnerabilities)
- ⚠️ No automated scanning in CI/CD

### 10.3 Vulnerability Disclosure Policy

**Current Status:** ⚠️ No public disclosure policy

**Recommended Policy:**
1. **Contact:** security@clinic.example.com
2. **Response Time:** Acknowledge within 48 hours
3. **Fix Timeline:** Critical vulnerabilities fixed within 7 days, High within 30 days
4. **Disclosure:** Responsible disclosure (90 days before public disclosure)
5. **Recognition:** Security Hall of Fame (public acknowledgment of researchers)

---

## 11. Incident Response Plan

### 11.1 Security Incident Categories

| Severity | Examples | Response Time |
|----------|----------|---------------|
| **Critical** | Data breach, ransomware, unauthorized admin access | Immediate (15 min) |
| **High** | Successful SQL injection, XSS attack, DDoS | 1 hour |
| **Medium** | Failed intrusion attempt, phishing email | 4 hours |
| **Low** | Security misconfiguration, outdated software | 24 hours |

### 11.2 Incident Response Procedure

**Phase 1: Preparation**
- Maintain incident response team contact list
- Document incident response procedures
- Regular security training for staff

**Phase 2: Detection & Analysis**
- Monitor security logs for suspicious activity
- Investigate alerts from intrusion detection systems
- Analyze scope and severity of incident

**Phase 3: Containment**
- **Short-term:** Isolate affected systems, block malicious IPs
- **Long-term:** Patch vulnerabilities, apply security updates

**Phase 4: Eradication**
- Remove malware, close backdoors
- Reset compromised credentials
- Verify no attacker persistence

**Phase 5: Recovery**
- Restore systems from clean backups
- Verify system integrity
- Monitor for re-infection

**Phase 6: Post-Incident Activity**
- Document incident details (timeline, root cause, impact)
- Update security controls to prevent recurrence
- Conduct lessons learned session

### 11.3 Communication Plan

**Internal Communication:**
- Notify IT team immediately
- Escalate to management (severity Critical or High)
- Inform affected users if credentials compromised

**External Communication:**
- Notify AEPD (Spanish Data Protection Agency) if data breach (within 72 hours)
- Notify affected patients if high risk to rights and freedoms
- Public statement if media attention (coordinate with PR team)

---

## 12. Compliance Roadmap

### 12.1 Immediate Actions (Pre-Production)

| Action | Priority | Timeline | Owner |
|--------|----------|----------|-------|
| **Enable HTTPS** | Critical | 1 week | DevOps |
| **Security Audit** | Critical | 2 weeks | External Auditor |
| **Implement Rate Limiting** | High | 1 week | Engineering |
| **Add Security Headers** | High | 3 days | DevOps |
| **Document Data Processing** | High | 1 week | Compliance Officer |
| **Create Breach Response Plan** | High | 1 week | Security Officer |

### 12.2 Short-Term Enhancements (v1.1)

| Action | Priority | Timeline |
|--------|----------|----------|
| **Two-Factor Authentication** | High | Q2 2026 |
| **Granular RBAC** | High | Q2 2026 |
| **Audit Logging UI** | Medium | Q2 2026 |
| **Data Export (GDPR)** | High | Q2 2026 |
| **Consent Tracking** | Medium | Q3 2026 |

### 12.3 Long-Term Enhancements (v2.0)

| Action | Priority | Timeline |
|--------|----------|----------|
| **Database Encryption** | Medium | Q1 2027 |
| **Intrusion Detection System** | Medium | Q1 2027 |
| **Security Monitoring (SIEM)** | Medium | Q1 2027 |
| **Penetration Testing (Annual)** | High | Ongoing |

---

## 13. Appendices

### 13.1 Security Configuration Checklist

**Production Deployment Checklist:**

- [ ] HTTPS enabled (TLS 1.2+)
- [ ] SSL certificate installed and auto-renewal configured
- [ ] HSTS header enabled
- [ ] Security headers configured (X-Frame-Options, CSP, etc.)
- [ ] Rate limiting enabled (10 req/sec per IP)
- [ ] Strong password policy enforced (12+ chars, complexity)
- [ ] JWT token expiration set (28 days max)
- [ ] Database credentials rotated (unique, strong)
- [ ] Database encryption enabled (InnoDB)
- [ ] Backup encryption enabled (GPG)
- [ ] Logging configured (centralized, secure storage)
- [ ] Error messages sanitized (no stack traces in production)
- [ ] Debug mode disabled (`APP_DEBUG=0`)
- [ ] CORS restricted to production domain only
- [ ] Security audit completed (no critical vulnerabilities)
- [ ] Incident response plan documented and tested

### 13.2 OWASP Top 10 Compliance Matrix

| OWASP Category | Vulnerability | Status | Mitigation |
|----------------|---------------|--------|------------|
| **A01:2021 – Broken Access Control** | IDOR, missing authorization | ⚠️ Partial | Add resource-level permissions |
| **A02:2021 – Cryptographic Failures** | Weak encryption, plain text | ⚠️ Partial | Enable TLS, database encryption |
| **A03:2021 – Injection** | SQL injection, command injection | ✅ Mitigated | Parameterized queries, input validation |
| **A04:2021 – Insecure Design** | Missing security controls | ⚠️ Partial | Add rate limiting, 2FA |
| **A05:2021 – Security Misconfiguration** | Default credentials, debug enabled | ⚠️ Pending | Production hardening checklist |
| **A06:2021 – Vulnerable Components** | Outdated dependencies | ✅ Monitored | `npm audit`, `composer audit` |
| **A07:2021 – Authentication Failures** | Weak passwords, session fixation | ⚠️ Partial | Password policy, 2FA |
| **A08:2021 – Software and Data Integrity Failures** | Unsigned code, unverified updates | ✅ Mitigated | Composer lock file, npm lock file |
| **A09:2021 – Logging and Monitoring Failures** | No security logs, no alerts | ⚠️ Partial | Add security event logging, SIEM |
| **A10:2021 – Server-Side Request Forgery (SSRF)** | Unvalidated URLs | ✅ N/A | No URL fetching features |

### 13.3 Regulatory References

**GDPR:**
- Regulation (EU) 2016/679 (General Data Protection Regulation)
- Spanish LOPD (Ley Orgánica 3/2018 de Protección de Datos)

**Medical Data:**
- Spanish Law 41/2002 (Patient Autonomy and Medical Records)
- Royal Decree 1720/2007 (Medical Records Regulation)

**Tax/Invoicing:**
- Spanish Law 58/2003 (General Tax Law)
- Royal Decree 1619/2012 (Electronic Invoicing)

---

**Document End**
