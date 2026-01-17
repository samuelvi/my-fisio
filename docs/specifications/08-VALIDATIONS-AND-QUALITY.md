# Validations & Quality Assurance
## Physiotherapy Clinic Management System

**Document Version:** 1.0
**Last Updated:** December 30, 2025
**Classification:** Internal - Technical
**Owner:** QA Lead & Engineering Team

---

## 1. Executive Summary

This document defines the comprehensive testing strategy, quality assurance processes, validation frameworks, and quality metrics for the Physiotherapy Clinic Management System. The system employs a multi-layered testing approach encompassing unit tests, integration tests, end-to-end tests, and automated code quality checks to ensure production readiness and maintainability.

### 1.1 Quality Philosophy

**Principles:**
1. **Prevention over Detection:** Automated checks prevent defects from reaching production
2. **Shift-Left Testing:** Integrate testing early in development lifecycle
3. **Test Pyramid:** Majority unit tests, fewer integration tests, minimal E2E tests
4. **Continuous Quality:** Automated checks in CI/CD pipeline
5. **Living Documentation:** Tests serve as executable specifications

### 1.2 Quality Metrics Summary

| Metric | Current Status | Target | Priority |
|--------|---------------|--------|----------|
| **Unit Test Coverage** | ~40% | >70% | High |
| **E2E Test Coverage** | ~80% (critical flows) | >90% | Critical |
| **PHPStan Level** | 8 (maximum) | 8 | ✅ Achieved |
| **Code Style Compliance** | 100% (PHP-CS-Fixer) | 100% | ✅ Achieved |
| **CI/CD Pass Rate** | ~95% | >98% | Medium |
| **Production Defect Rate** | N/A (pre-production) | <5 defects/month | Critical |

---

## 2. Testing Strategy

### 2.1 Test Pyramid

```
                    ┌──────────────┐
                    │  Manual      │  <--- Exploratory testing
                    │  Testing     │       Security audits
                    └──────────────┘       User acceptance testing
                   ┌────────────────┐
                   │   E2E Tests    │  <--- Playwright (critical workflows)
                   │  (~15 tests)   │       Full stack integration
                   └────────────────┘
              ┌────────────────────────┐
              │  Integration Tests     │  <--- API endpoints
              │    (~10 tests)         │       Database interactions
              └────────────────────────┘
        ┌──────────────────────────────────┐
        │      Unit Tests                  │  <--- Business logic
        │      (~50 tests)                 │       Domain services
        └──────────────────────────────────┘
```

**Test Distribution (Target):**
- **70% Unit Tests:** Fast, isolated, domain logic
- **20% Integration Tests:** API contracts, database queries
- **10% E2E Tests:** User workflows, browser automation

**Current Distribution:**
- **Unit Tests:** ~40% (needs expansion)
- **Integration Tests:** ~10% (basic API tests)
- **E2E Tests:** ~50% (over-reliance on E2E, should shift to unit)

### 2.2 Testing Tools Stack

| Layer | Tool | Version | Purpose |
|-------|------|---------|---------|
| **Unit Testing (Backend)** | PHPUnit | 11.5 | PHP unit/integration tests |
| **E2E Testing** | Playwright | 1.57 | Browser automation, user workflows |
| **Static Analysis** | PHPStan | 2.1 | Type safety, bug detection |
| **Code Style** | PHP-CS-Fixer | 3.92 | Code formatting, style enforcement |
| **Refactoring** | Rector | 2.3 | Automated code upgrades |
| **Mocking** | PHPUnit Mocks | Built-in | Test doubles for dependencies |
| **API Testing** | Symfony WebTestCase | Built-in | Functional API tests |
| **Database Testing** | Doctrine Fixtures | 3.6 | Test data seeding |

---

## 3. Backend Testing (PHPUnit)

### 3.1 Unit Tests

**Purpose:** Test individual units of code in isolation (methods, classes)

**Scope:**
- Domain entities (validation logic, business rules)
- Domain services (EmptySlotGenerator, WeekGridBuilder)
- Application layer (Query handlers, DTOs)
- Validators (InvoiceNumberValidator)

**Test Structure:**
```
tests/
├── Unit/
│   ├── Domain/
│   │   ├── Entity/
│   │   │   └── PatientTest.php
│   │   ├── Service/
│   │   │   └── EmptySlotGeneratorTest.php
│   │   └── Factory/
│   │       └── AppointmentFactoryTest.php
│   └── Application/
│       └── Service/
│           └── InvoiceNumberValidatorTest.php
```

**Example Unit Test:**
```php
// tests/Application/Service/InvoiceNumberValidatorTest.php
namespace App\Tests\Application\Service;

use PHPUnit\Framework\TestCase;
use App\Application\Service\InvoiceNumberValidator;

final class InvoiceNumberValidatorTest extends TestCase
{
    public function testValidateInvoiceNumberFormat(): void
    {
        $validator = new InvoiceNumberValidator();

        $this->assertTrue($validator->isValid('2025000001'));
        $this->assertTrue($validator->isValid('2025999999'));

        $this->assertFalse($validator->isValid('2025ABC123'));
        $this->assertFalse($validator->isValid('20250001'));  // Too short
        $this->assertFalse($validator->isValid(''));
    }

    public function testExtractYearFromInvoiceNumber(): void
    {
        $validator = new InvoiceNumberValidator();

        $this->assertEquals(2025, $validator->extractYear('2025000001'));
        $this->assertEquals(2024, $validator->extractYear('2024123456'));
    }
}
```

**Status:** ⚠️ Limited coverage (~40%)

**Recommendations:**
- Add unit tests for all domain services
- Test entity validation logic
- Test factory methods
- Test value objects (enums)

### 3.2 Integration Tests (Functional Tests)

**Purpose:** Test API endpoints with real database, verify integration between layers

**Scope:**
- API Platform resources (PatientResource, AppointmentResource, InvoiceResource)
- Database queries (repositories)
- State processors/providers
- Authentication/authorization flows

**Test Structure:**
```
tests/
├── Functional/
│   ├── PatientResourceTest.php
│   ├── AppointmentResourceTest.php
│   ├── CustomerResourceTest.php
│   ├── InvoiceResourceTest.php
│   └── AuthenticationTest.php
```

**Example Functional Test:**
```php
// tests/Functional/PatientResourceTest.php
namespace App\Tests\Functional;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

final class PatientResourceTest extends WebTestCase
{
    private $client;
    private $token;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $this->token = $this->authenticate();
    }

    public function testCreatePatient(): void
    {
        $this->client->request(
            'POST',
            '/api/patients',
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer ' . $this->token,
            ],
            json_encode([
                'firstName' => 'John',
                'lastName' => 'Doe',
                'phone' => '+34 612 345 678',
            ])
        );

        $this->assertResponseStatusCodeSame(Response::HTTP_CREATED);

        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertEquals('John', $data['firstName']);
        $this->assertEquals('Doe', $data['lastName']);
        $this->assertNotNull($data['id']);
    }

    public function testCreatePatientWithMissingRequiredFields(): void
    {
        $this->client->request(
            'POST',
            '/api/patients',
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer ' . $this->token,
            ],
            json_encode([
                'firstName' => '',  // Empty (invalid)
                'lastName' => '',   // Empty (invalid)
            ])
        );

        $this->assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);

        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('violations', $data);
    }

    private function authenticate(): string
    {
        $this->client->request(
            'POST',
            '/api/login_check',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'email' => 'tina@tinafisio.com',
                'password' => 'password',
            ])
        );

        $data = json_decode($this->client->getResponse()->getContent(), true);
        return $data['token'];
    }
}
```

**Status:** ✅ Implemented for core resources (Patient, Appointment, Customer)

**Coverage:**
- ✅ Patient CRUD operations
- ✅ Appointment CRUD operations
- ✅ Customer CRUD operations
- ⚠️ Invoice operations (partial)
- ⚠️ Record operations (not implemented)
- ⚠️ Authentication edge cases (weak passwords, token expiration)

### 3.3 Test Execution

**Run All Tests:**
```bash
make test
# OR
php bin/phpunit
```

**Run Specific Test:**
```bash
php bin/phpunit tests/Functional/PatientResourceTest.php
```

**Run with Coverage:**
```bash
make test-coverage
# Generates HTML report: var/coverage/index.html
```

**Test Configuration:** `phpunit.dist.xml`

```xml
<phpunit bootstrap="tests/bootstrap.php">
    <testsuites>
        <testsuite name="unit">
            <directory>tests/Unit</directory>
        </testsuite>
        <testsuite name="functional">
            <directory>tests/Functional</directory>
        </testsuite>
    </testsuites>

    <coverage>
        <include>
            <directory>src</directory>
        </include>
        <exclude>
            <directory>src/Infrastructure/Persistence/Doctrine/Migrations</directory>
        </exclude>
    </coverage>
</phpunit>
```

### 3.4 Database Test Strategy

**Approach:** Isolated test database (`physiotherapy_db_test`)

**Test Data Management:**
1. **Reset database before each test** (via `/api/test/reset-db-empty` endpoint)
2. **Load fixtures if needed** (Doctrine Data Fixtures)
3. **Execute test** (create/read/update/delete operations)
4. **Assert results** (verify database state, API responses)

**Test Database Configuration:**
```bash
# .env.test
DATABASE_URL="mysql://physiotherapy_user:physiotherapy_pass@mariadb_test:5433/physiotherapy_db_test"
```

**Benefits:**
- ✅ Tests don't pollute development database
- ✅ Parallel test execution possible
- ✅ Fast reset (drop/create database)

---

## 4. End-to-End Testing (Playwright)

### 4.1 E2E Test Strategy

**Purpose:** Validate complete user workflows from browser perspective

**Scope:**
- Critical user journeys (login, patient creation, appointment scheduling, invoice generation)
- Cross-browser compatibility (Chromium, Firefox, WebKit)
- Mobile responsiveness (optional)

**Test Environment:**
- **Base URL:** `http://localhost:8081` (isolated test environment)
- **Browser:** Headless Chromium (CI/CD), headed (local debugging)
- **Retries:** 3 attempts (handles flaky network/timing issues)

### 4.2 E2E Test Structure

```
tests/
├── e2e/
│   ├── login.spec.ts              # Authentication flow
│   ├── patients-create.spec.ts    # Patient creation workflow
│   ├── patients-search.spec.ts    # Patient search functionality
│   ├── appointments.spec.ts       # Appointment scheduling
│   ├── records.spec.ts            # Clinical record creation
│   ├── customers-create.spec.ts   # Customer management
│   ├── customers-search.spec.ts   # Customer search
│   ├── invoices.spec.ts           # Invoice generation
│   ├── invoices-search.spec.ts    # Invoice search
│   ├── security.spec.ts           # Security controls (unauthorized access)
│   └── security-auth.spec.ts      # Authentication edge cases
```

**Total E2E Tests:** 11 files, ~30-40 individual test cases

### 4.3 Example E2E Test

```javascript
// tests/e2e/patients-create.spec.ts
import { test, expect } from '@playwright/test';

async function resetDbEmpty(request) {
  const response = await request.post('/api/test/reset-db-empty');
  expect(response.ok()).toBeTruthy();
}

async function login(page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'tina@tinafisio.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
}

test('patient creation flow with server validation', async ({ page, request }) => {
  await page.addInitScript(() => {
    localStorage.setItem('app_locale', 'en');
  });

  await resetDbEmpty(request);
  await login(page);

  // Navigate to patient list (should be empty)
  await page.goto('/patients');
  await expect(page.getByText(/No patients found/).first()).toBeVisible();

  // Click "New Patient"
  await page.getByRole('link', { name: 'New Patient' }).click();
  await expect(page).toHaveURL('/patients/new');

  // Try to save with empty required fields (server validation)
  await page.waitForSelector('#patient-form');
  await page.evaluate(() => {
    const form = document.querySelector('#patient-form');
    if (form) form.setAttribute('novalidate', 'true');  // Bypass browser validation
  });

  await page.getByLabel(/First Name/).clear();
  await page.getByLabel(/Last Name/).clear();
  await page.getByRole('button', { name: 'Save Patient' }).click();

  // Expect validation errors
  await expect(page).toHaveURL('/patients/new');
  await expect(page.getByText('This value should not be blank.').first()).toBeVisible();

  // Fill required fields
  await page.getByLabel(/First Name/).fill('TestFirst');
  await page.getByLabel(/Last Name/).fill('TestLast');

  // Save successfully
  const successResponsePromise = page.waitForResponse(
    (response) => response.url().includes('/api/patients') && response.status() === 201
  );
  await page.getByRole('button', { name: 'Save Patient' }).click();
  await successResponsePromise;

  // Verify redirect to patient list
  await expect(page).toHaveURL('/patients');
  await expect(page.getByText('TestFirst TestLast')).toBeVisible();
});
```

### 4.4 E2E Test Execution

**Run All E2E Tests:**
```bash
make test-e2e
# OR
npx playwright test
```

**Run Single Test:**
```bash
make test-e2e file=tests/e2e/patients-create.spec.ts
# OR
npx playwright test tests/e2e/patients-create.spec.ts
```

**Run in UI Mode (Debug):**
```bash
make test-e2e-ui
# OR
npx playwright test --ui
```

**Run in Headed Mode:**
```bash
npx playwright test --headed
```

**Configuration:** `playwright.config.cjs`

```javascript
module.exports = {
  testDir: './tests/e2e',
  timeout: 60000,  // 60 seconds per test
  retries: 3,      // Retry flaky tests
  use: {
    baseURL: 'http://localhost:8081',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
    // Uncomment for cross-browser testing
    // { name: 'firefox', use: { browserName: 'firefox' } },
    // { name: 'webkit', use: { browserName: 'webkit' } },
  ],
};
```

### 4.5 E2E Test Best Practices

**Implemented:**
- ✅ **Reset database before each test** (ensures clean state)
- ✅ **Use role-based selectors** (`getByRole`, `getByLabel`) instead of CSS selectors
- ✅ **Wait for network responses** (`waitForResponse`) instead of arbitrary timeouts
- ✅ **Set language explicitly** (`localStorage.setItem('app_locale', 'en')`)
- ✅ **Disable client-side validation** (test server-side validation independently)
- ✅ **Take screenshots/videos on failure** (debugging aid)

**Recommended Additions:**
- ⚠️ Add visual regression testing (screenshot comparison)
- ⚠️ Add mobile viewport testing
- ⚠️ Add accessibility testing (ARIA attributes, keyboard navigation)

### 4.6 E2E Test Coverage

| Workflow | Test File | Status |
|----------|-----------|--------|
| **Login (success/failure)** | `login.spec.ts` | ✅ Complete |
| **Patient Creation** | `patients-create.spec.ts` | ✅ Complete |
| **Patient Search (fuzzy)** | `patients-search.spec.ts` | ✅ Complete |
| **Appointment Scheduling** | `appointments.spec.ts` | ✅ Complete |
| **Appointment Conflict Detection** | `appointments.spec.ts` | ✅ Complete |
| **Clinical Record Creation** | `records.spec.ts` | ✅ Complete |
| **Customer Creation** | `customers-create.spec.ts` | ✅ Complete |
| **Customer Search** | `customers-search.spec.ts` | ✅ Complete |
| **Invoice Generation** | `invoices.spec.ts` | ✅ Complete |
| **Invoice Search** | `invoices-search.spec.ts` | ✅ Complete |
| **Unauthorized Access (security)** | `security.spec.ts` | ✅ Complete |
| **JWT Token Expiration** | `security-auth.spec.ts` | ✅ Complete |
| **Multi-language Switching** | N/A | ⚠️ Not implemented |
| **Mobile Responsiveness** | N/A | ⚠️ Not implemented |

**Critical Workflows Coverage:** ~80% (good)
**Edge Cases Coverage:** ~40% (needs improvement)

---

## 5. Code Quality Tools

### 5.1 PHPStan (Static Analysis)

**Level:** 8 (maximum strictness)

**Purpose:**
- Detect type errors before runtime
- Enforce strict typing
- Identify unreachable code
- Detect undefined variables

**Configuration:** `phpstan.neon`

```neon
parameters:
    level: 8
    paths:
        - src
    excludePaths:
        - src/Infrastructure/Persistence/Doctrine/Migrations
    doctrine:
        objectManagerLoader: tests/phpstan-doctrine-bootstrap.php
```

**Run:**
```bash
make phpstan
# OR
vendor/bin/phpstan analyse src --level=8
```

**Example Issues Detected:**
```
------ -----------------------------------------------------------------------
 Line   src/Domain/Service/EmptySlotGenerator.php
------ -----------------------------------------------------------------------
 42     Parameter #1 $date of method DateTimeImmutable::modify() expects string, int given.
 58     Method App\Domain\Service\EmptySlotGenerator::generateSlots() should return array<App\Domain\Entity\Appointment> but returns array.
------ -----------------------------------------------------------------------
```

**Status:** ✅ Level 8 enforced, 0 errors in CI/CD

**Rules:**
- All method parameters must have type hints
- All method return types must be declared
- No `mixed` types allowed (must be specific)
- Strict comparison (`===`, not `==`)
- No unused variables or imports

### 5.2 PHP-CS-Fixer (Code Style)

**Ruleset:** Symfony standard + custom rules

**Purpose:**
- Enforce consistent code style
- Automatic formatting
- PSR-12 compliance

**Configuration:** `.php-cs-fixer.dist.php`

```php
return (new PhpCsFixer\Config())
    ->setRules([
        '@Symfony' => true,
        'declare_strict_types' => true,  // Force strict_types=1
        'array_syntax' => ['syntax' => 'short'],
        'no_unused_imports' => true,
        'ordered_imports' => ['sort_algorithm' => 'alpha'],
        'single_quote' => true,
        'trailing_comma_in_multiline' => true,
    ])
    ->setFinder(
        PhpCsFixer\Finder::create()
            ->in(__DIR__ . '/src')
            ->in(__DIR__ . '/tests')
    );
```

**Check:**
```bash
make cs-check
# OR
vendor/bin/php-cs-fixer fix --dry-run --diff
```

**Fix:**
```bash
make cs-fix
# OR
vendor/bin/php-cs-fixer fix
```

**Status:** ✅ 100% compliance (enforced in CI/CD, auto-fix in pre-commit hook)

**Key Rules:**
- `declare(strict_types=1)` at top of every PHP file
- Short array syntax (`[]` not `array()`)
- No trailing whitespace
- Unix line endings (LF)
- Import optimization (alphabetically sorted, unused removed)

### 5.3 Rector (Automated Refactoring)

**Purpose:**
- Automated code upgrades (PHP version, Symfony version)
- Refactoring (simplify code, modern syntax)
- Type declarations

**Configuration:** `rector.php`

```php
use Rector\Config\RectorConfig;
use Rector\Set\ValueObject\LevelSetList;
use Rector\Set\ValueObject\SetList;

return static function (RectorConfig $rectorConfig): void {
    $rectorConfig->paths([
        __DIR__ . '/src',
        __DIR__ . '/tests',
    ]);

    $rectorConfig->sets([
        LevelSetList::UP_TO_PHP_84,  // Upgrade to PHP 8.4 syntax
        SetList::CODE_QUALITY,        // Code quality improvements
        SetList::DEAD_CODE,           // Remove dead code
        SetList::TYPE_DECLARATION,    // Add type declarations
    ]);
};
```

**Dry Run:**
```bash
make rector
# OR
vendor/bin/rector process --dry-run
```

**Apply Changes:**
```bash
make rector-fix
# OR
vendor/bin/rector process
```

**Example Refactorings:**
- Convert `array()` → `[]`
- Add return type declarations
- Remove unused variables
- Simplify if/else chains
- Upgrade to PHP 8.4 features (property hooks)

**Status:** ⚠️ Configured but not enforced in CI/CD (run manually periodically)

---

## 6. Continuous Integration (CI/CD)

### 6.1 GitHub Actions Workflow

**File:** `.github/workflows/ci.yml`

**Jobs:**

#### Job 1: Backend Tests
```yaml
backend-tests:
  runs-on: ubuntu-latest
  steps:
    - Checkout code
    - Build PHP Docker image (with cache)
    - Start services (MariaDB, Redis)
    - Install Composer dependencies
    - Generate JWT keys
    - Setup database (drop, create, migrate, fixtures)
    - Run PHPUnit tests
    - Run PHPStan (continue-on-error: true)
    - Run PHP-CS-Fixer check (continue-on-error: true)
```

#### Job 2: E2E Tests (depends on backend-tests)
```yaml
e2e-tests:
  needs: backend-tests
  runs-on: ubuntu-latest
  steps:
    - Checkout code
    - Build PHP Docker image
    - Start services (MariaDB, Redis)
    - Install Composer + npm dependencies
    - Cache Playwright browsers
    - Generate JWT keys
    - Setup database with fixtures
    - Dump exposed routes (FOSJsRoutingBundle)
    - Build frontend assets (Vite)
    - Install Playwright browsers
    - Run Playwright tests
    - Upload test reports (on failure)
    - Upload screenshots (on failure)
```

**Caching Strategy:**
- Docker layers (BuildKit cache)
- Composer `vendor/` (keyed by `composer.lock`)
- npm `node_modules/` (automatic via `setup-node`)
- Playwright browsers (keyed by `package-lock.json`)

**Performance:**
- Cold build: ~10-15 minutes
- Cached build: ~5-8 minutes

### 6.2 CI/CD Quality Gates

**Pass Criteria:**
- ✅ All PHPUnit tests pass (backend-tests job)
- ✅ All Playwright tests pass (e2e-tests job)
- ⚠️ PHPStan passes (currently continue-on-error, should be blocking)
- ⚠️ PHP-CS-Fixer passes (currently continue-on-error, should be blocking)

**Current Status:**
- Backend tests: ✅ Passing
- E2E tests: ✅ Passing (with retry strategy for flaky tests)
- PHPStan: ⚠️ Passing but not blocking (should be enforced)
- PHP-CS-Fixer: ⚠️ Passing but not blocking (should be enforced)

**Recommendation:** Remove `continue-on-error` from PHPStan and PHP-CS-Fixer steps

### 6.3 Failure Handling

**Retry Strategy (Playwright):**
```javascript
// playwright.config.cjs
module.exports = {
  retries: 3,  // Retry flaky tests up to 3 times
};
```

**Race Condition Prevention:**
- ✅ All forms disable inputs during loading (prevents race conditions)
- ✅ Playwright waits for network responses (no arbitrary timeouts)
- ✅ Database reset before each test (clean state)

**Artifacts on Failure:**
- Screenshots (E2E test failures)
- Videos (E2E test failures)
- Trace files (Playwright timeline)
- Test reports (HTML)

**Example Failure Output:**
```
❌ tests/e2e/patients-create.spec.ts:42:5 › patient creation flow

Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
Locator: getByText('Patient created successfully')
Received: <not visible>

Screenshot: test-results/patients-create-chromium/test-failed-1.png
Video: test-results/patients-create-chromium/video.webm
```

---

## 7. Quality Metrics & Reporting

### 7.1 Test Coverage

**Current Coverage (Estimated):**
- **Backend (PHPUnit):** ~40%
  - Domain layer: ~60%
  - Application layer: ~30%
  - Infrastructure layer: ~20%
- **Frontend (E2E):** ~80% (critical workflows only)

**Target Coverage:**
- **Backend:** >70%
- **E2E:** >90% (critical workflows)

**Measurement:**
```bash
# Generate coverage report
make test-coverage

# Open HTML report
open var/coverage/index.html
```

**Coverage Report Output:**
```
Code Coverage Report:
  2025-12-30 12:00:00

 Summary:
  Classes: 42.31% (22/52)
  Methods: 58.97% (92/156)
  Lines:   61.23% (847/1383)

 App\Application\Service
  InvoiceNumberValidator  100.00% (15/15)

 App\Domain\Entity
  Patient                 75.00% (30/40)
  Appointment             60.00% (18/30)
  Invoice                 50.00% (20/40)
```

### 7.2 Code Quality Dashboard

**Current Status:** ⚠️ No centralized dashboard

**Recommended Tools:**
- **SonarQube:** Code quality, security vulnerabilities, technical debt
- **Codecov:** Code coverage tracking, pull request comments
- **CodeClimate:** Maintainability score, code smells

**Example SonarQube Integration:**
```yaml
# .github/workflows/ci.yml
- name: SonarQube Scan
  uses: sonarsource/sonarqube-scan-action@master
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
    SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
```

### 7.3 Defect Tracking

**Current Status:** ⚠️ No formal defect tracking (GitHub Issues only)

**Recommended Metrics:**
- **Defect Density:** Defects per 1000 lines of code
- **Defect Escape Rate:** Defects found in production / total defects
- **Mean Time to Resolution (MTTR):** Average time to fix defect
- **Reopened Defect Rate:** Defects reopened after fix

**Example Tracking:**

| Metric | Current | Target |
|--------|---------|--------|
| **Defects (total)** | 0 (pre-production) | <5/month |
| **Critical Defects** | 0 | 0 |
| **High Defects** | 0 | <2/month |
| **Medium Defects** | 0 | <5/month |

---

## 8. Validation Strategy

### 8.1 Frontend Validation

**Technology:** React (basic HTML5 validation)

**Validation Types:**
- **Required Fields:** `required` attribute (first name, last name)
- **Email Format:** `type="email"` (email field)
- **Pattern Matching:** `pattern` attribute (phone numbers)
- **Custom Validation:** JavaScript validation functions

**Example:**
```tsx
<input
  type="text"
  name="firstName"
  required
  minLength={1}
  maxLength={50}
  onChange={handleChange}
/>
```

**Limitations:**
- ⚠️ Basic validation only (can be bypassed by disabling JavaScript)
- ⚠️ No client-side duplicate detection
- ⚠️ No complex business rules (e.g., appointment conflicts)

**Purpose:** Improve UX (instant feedback), **not** security

### 8.2 Backend Validation (Symfony Validator)

**Technology:** Symfony Validator Constraints

**Validation Scope:**
- Required fields (`#[Assert\NotBlank]`)
- Field lengths (`#[Assert\Length]`)
- Format validation (`#[Assert\Email]`, `#[Assert\Regex]`)
- Custom business rules (via custom validators)

**Example:**
```php
use Symfony\Component\Validator\Constraints as Assert;

class PatientResource
{
    #[Assert\NotBlank(message: 'First name is required')]
    #[Assert\Length(max: 50, maxMessage: 'First name cannot exceed 50 characters')]
    public string $firstName;

    #[Assert\Email(message: 'Invalid email format')]
    public ?string $email = null;

    #[Assert\Regex(
        pattern: '/^\+?[0-9\s\-()]+$/',
        message: 'Invalid phone number format'
    )]
    public ?string $phone = null;
}
```

**Validation Execution:**
- ✅ Automatic validation in API Platform (POST/PUT operations)
- ✅ Returns 422 Unprocessable Entity with violation details

**Example Error Response:**
```json
{
  "violations": [
    {
      "propertyPath": "firstName",
      "message": "This value should not be blank."
    },
    {
      "propertyPath": "email",
      "message": "Invalid email format."
    }
  ]
}
```

**Status:** ✅ Implemented for all entities

### 8.2.1 React-Symfony Validation Error Mapping

**Implementation Date:** December 31, 2025

**Purpose:** Display server-side validation errors from Symfony in React forms with proper field-level error mapping

**Architecture:**

```
┌─────────────┐     422 + violations     ┌──────────────┐
│   Symfony   │ ───────────────────────► │    React     │
│  Validator  │                          │   Frontend   │
└─────────────┘                          └──────────────┘
                                                │
                                                ▼
                                         ┌──────────────┐
                                         │ Parse & Map  │
                                         │   Errors     │
                                         └──────────────┘
                                                │
                                                ▼
                                         ┌──────────────┐
                                         │ Display Next │
                                         │  to Fields   │
                                         └──────────────┘
```

**Implementation Details:**

1. **Violation Structure from Symfony:**
```json
{
  "@context": "/api/contexts/ConstraintViolation",
  "@type": "ConstraintViolation",
  "status": 422,
  "violations": [
    {
      "propertyPath": "lines[0].price",
      "message": "Invoice line price must be greater than 0.",
      "code": "778b7ae0-84d3-481a-9dec-35fdb64b1d78"
    },
    {
      "propertyPath": "fullName",
      "message": "This value should not be blank."
    }
  ]
}
```

2. **React Parsing Function:**
```typescript
interface ValidationErrors {
    [key: string]: string;
}

function parseValidationViolations(
    violations: Array<{ propertyPath: string; message: string }>
): ValidationErrors {
    const errors: ValidationErrors = {};
    violations.forEach(violation => {
        errors[violation.propertyPath] = violation.message;
    });
    return errors;
}
```

3. **Error Display Strategy:**

**Simple Fields:**
```tsx
<InvoiceInput
    label={t('customer_name')}
    value={customerName}
    setter={setCustomerNameWithClearError}
    error={validationErrors['fullName']}
/>
```

**Array Fields (nested):**
```tsx
const priceError = validationErrors[`lines[${index}].price`];

<input
    type="number"
    value={line.price}
    onChange={(e) => handleLineChange(index, 'price', parseFloat(e.target.value))}
    className={`border ${priceError ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-300'}`}
/>
{priceError && <p className="text-xs text-red-600">{priceError}</p>}
```

4. **Auto-Clear Errors on Input Change:**
```typescript
const handleLineChange = (index: number, field: keyof InvoiceLine, value: string | number) => {
    // Update field value
    const newLines = [...lines];
    (newLines[index] as any)[field] = value;
    setLines(newLines);

    // Clear validation error for this specific field
    const errorKey = `lines[${index}].${field}`;
    if (validationErrors[errorKey]) {
        const newErrors = { ...validationErrors };
        delete newErrors[errorKey];
        setValidationErrors(newErrors);
    }
};
```

5. **Visual Feedback:**
- **Field with error:** Red border (`border-red-500`) + red ring (`ring-2 ring-red-200`)
- **Error message:** Red text below field (`text-red-600`)
- **Array items with error:** Pink background (`bg-red-50`) on entire row
- **General error:** Red banner at top of form

**Files Modified:**
- `assets/components/invoices/InvoiceForm.tsx` (InvoiceForm.tsx:1-555)

**Benefits:**
- ✅ **Field-level precision:** Errors appear next to the exact field that failed validation
- ✅ **Nested array support:** Properly maps `lines[0].price` to the price field of the first line
- ✅ **Immediate feedback:** Errors clear automatically when user corrects the field
- ✅ **Type-safe:** Full TypeScript typing for validation errors
- ✅ **Reusable pattern:** Can be applied to any React form with Symfony backend

**Test Coverage:**
- ✅ Manual test script: `test-validation.sh`
- ✅ Verifies 422 response with violations structure
- ⚠️ No automated E2E test yet (should be added)

**Known Limitations:**
- Only handles `propertyPath` as flat strings (e.g., `lines[0].price`)
- Does not handle deeply nested objects beyond 2 levels
- Assumes violation messages are user-friendly (no additional formatting)

**Future Enhancements:**
- Add E2E test for validation error display
- Extract validation logic into reusable React hook (`useFormValidation`)
- Support for grouped errors (e.g., "3 fields have errors")
- Scroll to first error field on submission failure

### 8.2.2 Invoice Validation Rules Update

**Implementation Date:** December 31, 2025

**Changes Made:**

1. **Address Field - Now Required**
   - **Rule:** `#[Assert\NotBlank(message: 'invoice_address_required')]`
   - **Location:** `InvoiceInput.php:29-30`
   - **Reason:** Invoices require complete billing information for legal compliance
   - **Error Message (ES):** "La dirección es obligatoria."
   - **Error Message (EN):** "Address is required."

2. **Price Field - Allow Zero but Not Null**
   - **Previous:** `#[Assert\Positive]` (did not allow 0)
   - **New Rules:**
     - `#[Assert\NotNull(message: 'invoice_line_price_required')]`
     - `#[Assert\PositiveOrZero(message: 'invoice_line_price_non_negative')]`
   - **Location:** `InvoiceLineInput.php:26-27`
   - **Reason:** Free services (price = 0) are valid business cases
   - **Error Message (ES):** "El precio es obligatorio."
   - **Error Message (EN):** "Price is required."

3. **Concept Field - Visual Indicator**
   - **Change:** Added asterisk (*) to label in form
   - **Location:** `InvoiceForm.tsx:478`
   - **Implementation:** `{t('concept')} *` (not in translation file)
   - **Reason:** Clear visual indication that field is required, works for all languages

**Test Results:**
```bash
✅ Test 1: Address validation works (422 when empty)
✅ Test 2: Price 0 is accepted (201 created)
✅ Test 3: Valid invoice created successfully
```

**Files Modified:**
- `src/Infrastructure/Api/Resource/InvoiceInput.php`
- `src/Infrastructure/Api/Resource/InvoiceLineInput.php`
- `assets/components/invoices/InvoiceForm.tsx`
- `translations/messages.es.yaml`
- `translations/messages.en.yaml`
- `test-new-validations.sh` (new test script)

### 8.3 Database Constraints

**Validation Layer:** Database schema

**Constraints:**
- **NOT NULL:** Required fields (`first_name`, `last_name`, `number`)
- **UNIQUE:** No duplicates (`email` in users, `number` in invoices)
- **FOREIGN KEYS:** Referential integrity (patient_id → patients.id)
- **CHECK:** Value constraints (⚠️ not currently used)

**Example (from migration):**
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(180) NOT NULL,
  UNIQUE INDEX UNIQ_EMAIL (email)
);

CREATE TABLE invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  number VARCHAR(20) NOT NULL,
  UNIQUE INDEX UNIQ_NUMBER (number)
);
```

**Defense in Depth:**
- Frontend validation → UX improvement
- Backend validation → Business rules enforcement
- Database constraints → Last line of defense

### 8.4 Business Logic Validation

**Custom Validators:**

| Validator | Purpose | Location |
|-----------|---------|----------|
| **InvoiceNumberValidator** | Validate invoice number format, detect gaps | `App\Application\Service\InvoiceNumberValidator` |
| **AppointmentConflictValidator** | Prevent double-bookings | `App\Domain\Service\AppointmentConflictDetector` (implicit) |
| **SequentialNumberValidator** | Ensure invoice numbers are sequential | Invoice creation processor |

**Example Business Rule:**
```php
// Invoice number must be sequential (no gaps)
$lastNumber = $this->invoiceRepository->getLastNumberForYear($year);
$expectedNumber = $lastNumber + 1;

if ($requestedNumber !== $expectedNumber) {
    throw new InvalidInvoiceNumberException(
        "Expected invoice number {$expectedNumber}, got {$requestedNumber}"
    );
}
```

**Status:** ✅ Implemented for critical business rules (invoice numbering, appointment conflicts)

---

## 9. Performance Testing

### 9.1 Load Testing

**Current Status:** ⚠️ Not implemented

**Recommended Tools:**
- **Apache JMeter:** Simulate multiple users, measure response times
- **k6:** Modern load testing (JavaScript-based)
- **Locust:** Python-based, distributed load testing

**Example k6 Test:**
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50,         // 50 virtual users
  duration: '5m',  // 5 minutes
};

export default function () {
  const res = http.get('http://localhost/api/patients?page=1&itemsPerPage=15');

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

**Metrics to Measure:**
- Response time (p50, p95, p99)
- Requests per second (RPS)
- Error rate
- Database query time

**Target Performance:**
- ✅ GET (single entity): <200ms (p95)
- ✅ GET (collections): <500ms (p95)
- ✅ POST/PUT/DELETE: <1000ms (p95)

### 9.2 Database Query Profiling

**Current Status:** ⚠️ Ad-hoc profiling only (no continuous monitoring)

**Tools:**
- **Symfony Profiler:** Web debug toolbar (dev environment)
- **Doctrine Query Logger:** Log all queries
- **MariaDB Slow Query Log:** Log queries >1 second

**Enable Slow Query Log:**
```sql
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;  -- Log queries > 1 second
SET GLOBAL slow_query_log_file = '/var/log/mysql/slow-query.log';
```

**Analyze Slow Queries:**
```bash
# Install Percona Toolkit
apt-get install percona-toolkit

# Analyze slow query log
pt-query-digest /var/log/mysql/slow-query.log
```

**Optimization Targets:**
- No N+1 queries (use eager loading)
- All queries <100ms (p95)
- Proper indexing on frequently queried columns

---

## 10. User Acceptance Testing (UAT)

### 10.1 UAT Strategy

**Purpose:** Validate system meets business requirements from end-user perspective

**Participants:**
- Clinic Director (business owner)
- Physiotherapists (primary users)
- Administrative Staff (receptionists, billing)

**Test Environment:**
- Staging environment (identical to production)
- Real-like test data (anonymized patient records)
- Limited access (internal clinic staff only)

### 10.2 UAT Test Scenarios

| Scenario | Actor | Acceptance Criteria | Status |
|----------|-------|---------------------|--------|
| **Patient Registration** | Receptionist | Create patient in <2 minutes, all fields saved correctly | ⚠️ Pending |
| **Appointment Scheduling** | Receptionist | Schedule appointment without conflicts, visible on calendar | ⚠️ Pending |
| **Clinical Documentation** | Physiotherapist | Create record in <5 minutes, accessible from patient detail | ⚠️ Pending |
| **Invoice Generation** | Billing Staff | Generate invoice in <2 minutes, PDF downloads correctly | ⚠️ Pending |
| **Patient Search** | All Users | Find patient by name in <10 seconds, fuzzy search works | ⚠️ Pending |
| **Multi-language Switch** | All Users | Switch to Spanish, all text translated | ⚠️ Pending |

### 10.3 UAT Feedback Loop

**Process:**
1. **Preparation:** Provide training materials, access credentials
2. **Execution:** Users perform test scenarios, record feedback
3. **Feedback Collection:** Bug reports, usability issues, feature requests
4. **Triage:** Categorize feedback (bug, enhancement, won't fix)
5. **Implementation:** Fix critical bugs, defer enhancements to backlog
6. **Re-test:** Verify fixes, repeat UAT cycle

**Feedback Tracking:**
- **Tool:** GitHub Issues (labeled `UAT`, `bug`, `enhancement`)
- **Priority:** P0 (blocker), P1 (critical), P2 (high), P3 (medium), P4 (low)

---

## 11. Regression Testing

### 11.1 Regression Strategy

**Purpose:** Ensure new changes don't break existing functionality

**Approach:**
- ✅ Automated regression (CI/CD runs all tests on every commit)
- ⚠️ Manual regression (exploratory testing before releases)

**Test Suite Execution:**
- **On Every Commit:** Unit tests, integration tests
- **On Pull Request:** Unit tests, integration tests, E2E tests
- **Before Release:** Full test suite + manual exploratory testing

### 11.2 Regression Test Baseline

**Baseline:** All tests passing as of December 30, 2025

**Regression Detection:**
- If previously passing test fails → Regression introduced
- If new test fails → Bug in new feature (not regression)

**Regression Prevention:**
- Code review before merge
- Automated tests in CI/CD
- Feature flags for risky changes

---

## 12. Known Quality Issues & Technical Debt

### 12.1 Test Coverage Gaps

| Gap | Impact | Priority | Mitigation Plan |
|-----|--------|----------|----------------|
| **Low unit test coverage (40%)** | High | High | Add unit tests for domain services (Q2 2026) |
| **No load testing** | Medium | Medium | Implement k6 load tests (Q2 2026) |
| **No visual regression testing** | Low | Low | Add Playwright screenshot comparison (Q3 2026) |
| **No accessibility testing** | Medium | Medium | Add axe-core or similar (Q3 2026) |
| **No security testing (SAST/DAST)** | High | Critical | Integrate SonarQube, OWASP ZAP (Pre-production) |

### 12.2 Flaky Tests

**Current Status:** ⚠️ Some E2E tests occasionally fail due to timing issues

**Mitigation:**
- ✅ Retry strategy (3 retries per test)
- ✅ Wait for network responses (not arbitrary timeouts)
- ⚠️ Occasional failures still occur (~5% failure rate)

**Root Causes:**
- Network latency in CI/CD environment
- Race conditions in form loading
- Database reset timing

**Action Plan:**
- Increase timeout for slow operations
- Add explicit wait states (e.g., wait for form to be ready)
- Investigate database reset performance

### 12.3 Technical Debt Register

| Debt Item | Introduced | Impact | Effort to Fix |
|-----------|-----------|--------|---------------|
| **PHPStan/PHP-CS-Fixer not blocking in CI** | Initial setup | Medium | Low (change CI config) |
| **No centralized quality dashboard** | N/A | Medium | Medium (integrate SonarQube) |
| **Manual UAT process** | Initial setup | Medium | Medium (create UAT checklist) |
| **No performance benchmarks** | N/A | Medium | Medium (implement k6 tests) |
| **Race condition prevention (manual)** | Iterative development | Low | Low (already implemented in forms) |

---

## 13. Quality Roadmap

### 13.1 Immediate Actions (Pre-Production)

| Action | Priority | Timeline | Owner |
|--------|----------|----------|-------|
| **Enforce PHPStan in CI** | Critical | 1 week | Engineering |
| **Enforce PHP-CS-Fixer in CI** | Critical | 1 week | Engineering |
| **Increase unit test coverage to 60%** | High | 4 weeks | Engineering |
| **Conduct UAT** | Critical | 2 weeks | QA + Clinic Staff |
| **Run OWASP ZAP security scan** | Critical | 1 week | Security |

### 13.2 Short-Term Enhancements (v1.1)

| Action | Priority | Timeline |
|--------|----------|----------|
| **Add load testing (k6)** | High | Q2 2026 |
| **Integrate SonarQube** | Medium | Q2 2026 |
| **Add visual regression testing** | Low | Q3 2026 |
| **Increase unit test coverage to 70%** | High | Q2 2026 |

### 13.3 Long-Term Enhancements (v2.0)

| Action | Priority | Timeline |
|--------|----------|----------|
| **Implement mutation testing** | Low | Q1 2027 |
| **Add performance monitoring (APM)** | Medium | Q1 2027 |
| **Automated accessibility testing** | Medium | Q1 2027 |

---

## 14. Appendices

### 14.1 Testing Glossary

| Term | Definition |
|------|------------|
| **Unit Test** | Test of a single unit of code in isolation (method, class) |
| **Integration Test** | Test of interaction between components (API + database) |
| **E2E Test** | Test of complete user workflow from browser perspective |
| **Functional Test** | Test of API endpoint functionality (subset of integration tests) |
| **Regression Test** | Re-running tests to ensure new changes don't break existing features |
| **Smoke Test** | Minimal test suite to verify basic functionality (critical paths) |
| **UAT** | User Acceptance Testing (validation by end users) |
| **Load Test** | Test system performance under realistic traffic |
| **Penetration Test** | Security testing to identify vulnerabilities |

### 14.2 Test Data Management

**Test Fixtures (PHPUnit):**
```php
// tests/DataFixtures/UserFixtures.php
class UserFixtures extends Fixture
{
    public function load(ObjectManager $manager): void
    {
        $user = new User();
        $user->setEmail('tina@tinafisio.com');
        $user->setPassword($this->hasher->hashPassword($user, 'password'));
        $user->setRoles(['ROLE_ADMIN']);

        $manager->persist($user);
        $manager->flush();
    }
}
```

**E2E Test Data:**
- Reset database via `/api/test/reset-db-empty` endpoint
- Create test data inline (within test)
- No persistent test data (prevents test pollution)

### 14.3 Quality Metrics Dashboard (Proposed)

**SonarQube Metrics:**
- **Bugs:** 0 target
- **Vulnerabilities:** 0 target
- **Code Smells:** <50 target
- **Technical Debt:** <5% target
- **Coverage:** >70% target
- **Duplication:** <3% target
- **Maintainability Rating:** A target
- **Reliability Rating:** A target
- **Security Rating:** A target

---

**Document End**
