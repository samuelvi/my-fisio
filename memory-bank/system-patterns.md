# Implementation map

- Writes: patient/customer create/update use `command.bus`; appointment/record/invoice processors also write directly. Check `docs/architecture/critical-flows.md` before assuming a uniform pipeline.
- Reads: API providers/controllers -> repository interfaces in `src/Domain/Repository/`; implementations in `src/Infrastructure/Persistence/Doctrine/Repository/`. Check each existing query before extending it.
- HTTP endpoints: `src/Infrastructure/Api/Controller/`, resources and state providers/processors next to them.
- Events: `src/Domain/Event/`; `AuditEventHandler` stores events and optionally creates audit entries. Command/event buses have Doctrine transaction middleware, but direct processor writes are not necessarily atomic with later event dispatch. See `docs/architecture/data-consistency.md`.
- UI: existing screens in `assets/components/`; supporting layers in `assets/application/`, `domain/`, `infrastructure/`, `presentation/`. Follow the touched feature rather than creating another architecture.
- Translations: `TranslationExtension` reads Symfony YAML catalogs; `templates/default/index.html.twig` injects them for React language context. Routing integration: `assets/routing/`.
- Tests: PHP under `tests/{Unit,Integration,Functional,Application,Controller}`; frontend under `assets/tests`; E2E under `tests/e2e`.

Keep documentation tied to code. Older specifications and agent documents contain aspirational or obsolete statements; they are not proof of current implementation.

Dev/test containers mount the same checkout and dependencies; databases and ports
are separate. Frontend dependency tools and Playwright currently run on the host;
PHP, Vite builds and Vitest have container-backed Make targets. See
`docs/testing/e2e.md` for first-run prerequisites.
