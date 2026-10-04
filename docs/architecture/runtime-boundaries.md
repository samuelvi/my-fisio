# Runtime, trust boundaries and failures

Part of the [PCMS System Design](system-architecture.md). This view distinguishes
source/configuration behavior from deployment assumptions; no runtime checks
or application tests were run during the documentation review.

## Authentication boundary

[Security configuration](../../config/packages/security.yaml) makes `/api/login_check`
public, validates other clinic API requests with a stateless JWT firewall, and
requires `IS_AUTHENTICATED_FULLY`. Users are loaded by email. The configured
[JWT lifetime](../../config/packages/lexik_jwt_authentication.yaml) is 7,200 seconds.
Login throttling is configured for five attempts per 15 minutes and disabled in
test. Actual key rotation and deployed limiter behavior were not verified.

The [browser session store](../../assets/presentation/auth/sessionStore.ts) keeps
the token in `localStorage`; [HTTP interceptors](../../assets/presentation/api/httpClient.ts)
attach it as `Authorization: Bearer ...`. The reviewed flow has no refresh-token
exchange. [ProtectedRoute](../../assets/app.tsx) checks token presence, not validity.
It is a navigation convenience; backend authentication is the data boundary.

## Authorization boundaries

| Boundary | Implemented behavior and limitation |
| --- | --- |
| Authenticated user → clinic API | The reviewed resources/controllers use full authentication, without per-patient ownership or an admin-role requirement in the general API rule. Role names in E2E scenarios are not evidence of role-specific enforcement. |
| User/Application → data | [User.application](../../src/Domain/Entity/User.php) exists, but [patient](../../src/Infrastructure/Persistence/Doctrine/Repository/DoctrinePatientRepository.php) and [appointment](../../src/Infrastructure/Persistence/Doctrine/Repository/DoctrineAppointmentRepository.php) reads do not filter by it. Tenant separation is not an implemented guarantee. |
| Appointment creator identity | [AppointmentProcessor](../../src/Infrastructure/Api/State/AppointmentProcessor.php) takes the authenticated user's ID on create; update/delete look up the supplied appointment ID without an ownership check. |
| Invoice editing | [InvoiceForm](../../assets/components/invoices/InvoiceForm.tsx) gates UI editing with `VITE_INVOICE_EDIT_ENABLED`; [InvoiceResource](../../src/Infrastructure/Api/Resource/InvoiceResource.php) still declares PUT, and its processor has no equivalent feature-flag check. |
| Browser-visible configuration | `import.meta.env.VITE_*` values used by the UI are public build inputs. [Login](../../assets/components/Login.tsx) even reads optional `VITE_AUTH_EMAIL`/`VITE_AUTH_PASSWORD` prefills; these cannot be treated as server-only secrets. No actual configured values were inspected. |
| Local drafts | [Draft storage](../../assets/infrastructure/storage/LocalStorageDraftRepository.ts) stores form payloads in origin-local storage, one key per entity type, not per logged-in user. Clearing the auth token does not clear draft keys. |
| Invoice rendering | [Export](../../src/Infrastructure/Api/Controller/InvoiceExportController.php) requires authentication, uses server-side Twig/Dompdf, disables remote PDF fetching and sanitizes the download filename. No complete PDF renderer security assessment is implied. |

The [CORS configuration](../../config/packages/nelmio_cors.yaml) reads an allowed-origin
expression from configuration; CORS is not a substitute for these authorization
checks. Deployed origins and public network exposure remain unverified.

## Test endpoints

`/api/test/stats`, `/api/test/reset-db` and `/api/test/reset-db-empty` are declared
in [TestController](../../tests/Controller/TestController.php). Reset actions drop
and recreate mapped tables, then load deterministic fixtures.

The boundary is layered:

1. [Attribute routes](../../config/routes/attributes.yaml) import these controllers
   under `when@test` only. [Services](../../config/services.yaml) register test
   controllers in dev/test; service registration alone is not route exposure.
2. Each action checks `kernel.environment === 'test'` and returns `403` otherwise.
3. [The `/api/test` firewall](../../config/packages/security.yaml) disables security
   and has a public access rule in all environments. Thus an actual test runtime
   exposes these actions without JWT authentication.

Isolation depends on environment and deployment routing, not on an admin token.
The test Compose file publishes its web port without a loopback-only bind;
host/network restrictions were not checked. Non-test route absence and guard
responses were not exercised over HTTP in this review.

## Failure behavior

| Failure | Implemented response/recovery |
| --- | --- |
| Invalid patient/invoice input | Processors validate DTO/resource constraints. [Patient tests](../../tests/Functional/PatientResourceTest.php) expect `422` on duplicate email; [PatientForm](../../assets/components/PatientForm.tsx) maps `violations.propertyPath` to fields. [InvoiceForm](../../assets/components/invoices/InvoiceForm.tsx) also maps nested line errors. |
| Invalid invoice number | [Update processor](../../src/Infrastructure/Api/State/Processor/InvoiceUpdateProcessor.php) throws `400` with an `invoice_number_*` reason; the form translates that detail. |
| Invalid/conflicting gap range | [Gap controller](../../src/Infrastructure/Api/Controller/AppointmentGapController.php) returns `400` for missing/invalid ordering or excessive range, `409` for overlap, and catches exceptions as `500` with an error message. Date parsing exceptions reach the `500` branch. |
| SQL or synchronous event failure | Exceptions propagate; whether previous writes roll back depends on [the actual transaction path](data-consistency.md#transaction-boundaries). A failed response does not universally mean “nothing was saved.” |
| Network failure during form submit | Patient/invoice/calendar forms save a draft before the request and clear it on success. [useDraft](../../assets/presentation/hooks/useDraft.ts) marks network-classified failures as `savedByError`; ordinary server/validation errors do not receive that flag. See [draft integration](../features/draft-system.md#canonical-trigger-source). |
| Storage unavailable/full | The [localStorage adapter](../../assets/infrastructure/storage/LocalStorageDraftRepository.ts) catches/logs storage failures. Draft recovery is best effort, not guaranteed durable persistence. |
| Calendar drag/resize failure | [Calendar](../../assets/components/Calendar.tsx) displays an alert and calls the calendar's `revert()`; this reverts the UI, not a server transaction. |
| Expired/invalid token | The shared `apiClient` unauthorized handler clears auth and redirects to `/login?expired=1`. Legacy direct Axios calls receive auth request headers but do not share that response interceptor, so expiry UX is not uniform. |

Drafts are submit recovery, not a periodic autosave or an offline write queue.
A lost response can follow a committed server write; the reviewed create
processors have no idempotency-key handling. Restoring and resubmitting a draft
therefore does not establish exactly-once execution.

Evidence tests include [draft hook behavior](../../assets/tests/presentation/useDraft.test.tsx),
[storage](../../assets/tests/infrastructure/LocalStorageDraftRepository.test.ts),
[calendar network scenarios](../../tests/e2e/appointments/network/appointments-network.feature)
and [route protection](../../tests/e2e/security/protection/security-protection.feature).
Their presence is not a claim that all failure branches are covered or passing.

## Development and test runtime

| Concern | Source-backed runtime contract |
| --- | --- |
| Development | [Compose](../../docker/dev/docker-compose.yaml) provides PHP-FPM, Nginx, MariaDB, Redis, Vite watch, MailPit and Adminer; [override](../../docker/dev/docker-compose.override.yaml) selects polling for file watch. |
| Test separation | [Test Compose](../../docker/test/docker-compose.yaml) uses its own network, database/data directory, Redis and web port (`TEST_WEB_PORT`, default 8081). Development uses web port 80; database ports are 3306/3307 and Redis 6379/6380. |
| Shared mutable files | Both stacks bind-mount the same checkout at `/var/www/html`, including `vendor`, `node_modules`, generated routes/assets and environment-specific cache directories. Separate databases do not make builds, key generation or filesystem mutations independent. |
| Builds | [Makefile](../../Makefile) makes `build-assets` dump routes before Vite build and cache refresh. `test-assets-build` builds in a disposable Node container. [Package scripts](../../package.json) select explicit Vite modes. |
| Schema | `db-migrate` applies Doctrine migrations. `test-reset-db` rebuilds schema from mappings and loads fixtures; that is not migration-upgrade coverage. |
| Test execution | PHP and frontend unit targets use containers; [Playwright](../../playwright.config.ts) runs on the host against the test URL with one worker and `fullyParallel: false`. [Database-reset hooks](../../tests/e2e/common/bdd.ts) mean parallel workers cannot assume isolated data. |

Operational steps and prerequisites remain in [installation](../operations/installation.md)
and [testing](../testing/e2e.md); `make help` is the command catalog. Calendar,
branding and audit parameters are wired in [services](../../config/services.yaml);
see [configuration](../operations/configuration.md) rather than duplicating values here.

## Observability and production evidence limits

- [HealthController](../../src/Infrastructure/Api/Controller/HealthController.php)
  exposes `/api/health`, which still falls under API authentication. A separate
  health token enables SQL and optional Redis checks after the firewall. Without
  it the controller reports basic `ok`; detailed `degraded` responses still use
  HTTP 200. This is not an unauthenticated readiness endpoint or an HTTP-status-only
  dependency check.
- [Monolog](../../config/packages/monolog.yaml) configures dev file logging, test
  error-triggered stderr output and prod error-triggered file logging.
  [Nginx](../../docker/dev/nginx/default.conf) has access/error logs. Auditing is a
  separate data trail, with the [coverage limits](data-consistency.md#audit-completeness-and-known-deviations)
  described in the consistency view.
- [Release tooling](../../scripts/release.sh) and the
  [deployment guide](../operations/deployment.md) describe Docker artifact building,
  rsync/SSH delivery and conditional remote migration/cache tasks. These are
  repository mechanisms, not evidence of the currently deployed topology or a
  successful release/rollback. Older guide sections may name superseded targets;
  the current Makefile/script are authoritative for commands.
- **Documented but unverified:** production environment values, TLS/proxy setup,
  migration state, backups/restores, monitoring coverage and operational access.
  No production environment files were read. No capacity, RPO/RTO, availability
  or compliance guarantee can be derived from this static review.
