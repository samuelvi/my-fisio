# System architecture

PCMS is a Symfony application serving a React SPA and a JSON API. It manages
patients, clinical records, appointments, billing customers and invoices.

## Request flow

```text
React screen -> API resource/controller
  write -> processor -> command.bus -> handler -> entity + repository
                                               -> event.bus -> event store + audit
  read  -> provider/controller -> repository -> response DTO
```

SQL tables hold the current state. Events record changes; reads do not replay an
event stream. See [domain events](event-driven-strategy.md).
Most writes use command handlers; inspect each feature's processor because not
every endpoint follows an identical pipeline.

## Backend map

| Location | Responsibility |
| --- | --- |
| `src/Domain/Entity/` | Domain state and named constructors |
| `src/Domain/Event/` | Change events and event store interface |
| `src/Domain/Repository/` | Repository contracts |
| `src/Application/Command/` | Write use cases and handlers |
| `src/Application/Query/`, `Dto/`, `Service/` | Read use cases, data shapes and services |
| `src/Infrastructure/Api/` | Controllers, API Platform resources, providers, processors and validators |
| `src/Infrastructure/Persistence/` | Doctrine repository implementations and event storage |
| `config/services.yaml` | Service bindings and application parameters |
| `config/packages/messenger.yaml` | Command/query/event buses |

Start with `PatientProcessor` and `CreatePatientHandler` for a concrete write
example. Patients and billing customers are separate entities: a patient's
clinical identity need not be the invoice recipient.

Repository reads use explicit queries and DTO/array mapping in many endpoints.
Several lists fetch one extra row to detect a next page. Match the existing
repository contract rather than assuming every list returns a total count.

## Frontend and authentication

`assets/app.tsx` defines navigation. Symfony renders the page shell; React handles
screens and API requests. See the [frontend map](frontend.md).

The browser posts credentials to `/api/login_check`, stores the JWT locally and
sends it as a Bearer token. Symfony's API firewall validates it. Client-side
route guards control navigation; backend authorization is configured separately
in `config/packages/security.yaml`.

Translations originate in Symfony YAML catalogs. A Twig extension injects English
and Spanish catalogs into the page for React to consume without another request.

## Runtime and tests

Development uses `docker/dev/docker-compose.yaml` plus its override. Tests use
`docker/test/docker-compose.yaml`, a separate database and web port, but mount
the same source tree and dependency directories. See [installation](../operations/installation.md)
and [testing](../testing/e2e.md).

The [original architecture specification](../specifications/04-SYSTEM-ARCHITECTURE.md)
is retained as historical context, including proposals that may not be implemented.
