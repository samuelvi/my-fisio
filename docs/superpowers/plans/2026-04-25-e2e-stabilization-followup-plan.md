# E2E Stabilization Follow-up Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dejar la suite E2E ejecutable y estable en entorno test Docker con puerto configurable, y avanzar hasta tener la mayor parte de escenarios en verde.

**Architecture:** Mantener Playwright-BDD como runner principal, con generación automática de `.features-gen` antes de ejecutar. Estabilizar primero infraestructura (contenedores, permisos, cache/proxy Doctrine), luego autenticación/headers y finalmente steps BDD frágiles por dominio (customers/appointments).

**Tech Stack:** Symfony 7 + API Platform + Docker Compose (test), Playwright + playwright-bdd, Makefile orchestration.

---

## Estado actual (checkpoint)

- ✅ `typecheck` pasa.
- ✅ tests unitarios frontend pasan.
- ✅ `make test-e2e` ya descubre tests (68) tras añadir `bddgen` al pipeline.
- ✅ smoke E2E de login pasa:
  - `.features-gen/tests/e2e/security/login/login.feature.spec.js` (2/2 pass).
- ⚠️ Suite E2E completa falla por problemas funcionales/infra:
  - `401` intermitentes en flujos protegidos.
  - errores backend en test runtime:
    - `Failed to open stream: Operation not permitted`
    - sobre `var/cache/test/doctrine/orm/Proxies/...`.

## Cambios ya aplicados relevantes

- `docker/test/docker-compose.yaml`: puerto web configurable con `TEST_WEB_PORT`.
- `playwright.config.ts`: `baseURL` configurable por `E2E_BASE_URL`.
- `Makefile`: generación `bddgen` previa en targets E2E + soporte `TEST_WEB_PORT` y `E2E_BASE_URL`.
- `tests/e2e/common/auth.ts`: login por UI para evitar fragilidad de API token bootstrap.

---

### Task 1: Stabilize test container permissions/cache for Doctrine proxies

**Files:**
- Modify: `docker/test/docker-compose.yaml`
- Modify: `Makefile`

- [ ] **Step 1: Reproducir error de permisos de proxy en entorno test**

Run:

```bash
make test-up TEST_WEB_PORT=18081
docker-compose -f docker/test/docker-compose.yaml logs --tail=200 php_test
```

Expected evidence: entradas con `Failed to open stream: Operation not permitted` en `var/cache/test/doctrine/orm/Proxies`.

- [ ] **Step 2: Forzar ownership/permisos en cache test antes de E2E**

Propuesta mínima:

- Añadir comando previo (en `test-e2e`) para limpiar y recrear cache/proxies con permisos amplios dentro de `php_test`.
- Añadir target helper en Makefile (ej: `test-fix-cache-perms`) y llamarlo antes de `cache:clear`.

Command draft:

```bash
$(DOCKER_COMPOSE_TEST) exec -T php_test sh -c "rm -rf var/cache/test && mkdir -p var/cache/test && chmod -R 777 var/cache"
```

- [ ] **Step 3: Verificar que desaparece el error de proxy/permisos**

Run:

```bash
make test-e2e TEST_WEB_PORT=18081 file=".features-gen/tests/e2e/security/login/login.feature.spec.js"
docker-compose -f docker/test/docker-compose.yaml logs --tail=200 php_test
```

Expected: login spec en verde y sin nuevos `Operation not permitted`.

---

### Task 2: Stabilize authenticated API calls in React flows

**Files:**
- Modify: `assets/presentation/api/httpClient.ts`
- Modify: `assets/components/LanguageContext.tsx`
- Inspect/Modify (if needed): React forms/lists that still rely on global axios (`assets/components/**`)

- [ ] **Step 1: Auditar requests 401 durante escenarios customers/appointments**

Run failing slice:

```bash
make test-e2e TEST_WEB_PORT=18081 file=".features-gen/tests/e2e/customers/create/customers-create.feature.spec.js"
docker-compose -f docker/test/docker-compose.yaml logs --tail=300 php_test
```

Capture exact endpoint/method returning 401.

- [ ] **Step 2: Unificar inyección de Authorization en axios global y apiClient**

Ensure both clients always take token from storage at request time and preserve locale header.

- [ ] **Step 3: Revalidar scenario de customers create**

Run:

```bash
make test-e2e TEST_WEB_PORT=18081 file=".features-gen/tests/e2e/customers/create/customers-create.feature.spec.js"
```

Expected: request POST customer observable (ya no timeout por ausencia de response 201/422).

---

### Task 3: Harden brittle BDD steps (customers/appointments)

**Files:**
- Modify: `tests/e2e/customers/common/customers-common.steps.ts`
- Modify: `tests/e2e/appointments/common/appointments-common.steps.ts`
- Modify: `tests/e2e/common/steps/*.steps.ts` (solo donde falle)

- [ ] **Step 1: Cambiar waits frágiles por espera condicional robusta**

Problema observado: timeouts en `waitForResponse` estrictos (solo 201/422 exacto).

Acción:
- permitir respuestas API válidas equivalentes cuando el backend varía por flujo.
- añadir espera explícita de UI outcome (toast/list row/url) junto al response.

- [ ] **Step 2: Ejecutar paquetes por dominio**

Run:

```bash
make test-e2e TEST_WEB_PORT=18081 file=".features-gen/tests/e2e/customers/**/*.spec.js"
make test-e2e TEST_WEB_PORT=18081 file=".features-gen/tests/e2e/appointments/**/*.spec.js"
```

Expected: reducción progresiva de fallos y aislamiento de escenarios restantes.

- [ ] **Step 3: Ajustar selectors semánticos inestables**

Donde falle `getByRole('row', { name: /John/i })`, reemplazar por selector visible y verificable en tabla objetivo (manteniendo accesibilidad).

---

### Task 4: Run full E2E suite and produce closure report

**Files:**
- No code necessarily; update this plan with final status block.

- [ ] **Step 1: Ejecutar suite completa**

```bash
make test-e2e TEST_WEB_PORT=18081
```

- [ ] **Step 2: Si falla, registrar matriz de fallos residual**

Crear lista con:
- spec
- escenario
- error exacto
- clasificación: infra / auth / selector / timing / backend rule

- [ ] **Step 3: Re-ejecutar hasta estabilizar o dejar backlog técnico explícito**

Expected finish condition:
- ideal: suite completa verde,
- aceptable temporal: smoke + dominios críticos verdes y backlog documentado con causas raíz verificadas.

---

### Task 5: Verification checklist (mandatory)

- [ ] `npm run typecheck`
- [ ] `npm run test:unit`
- [ ] `make test-e2e TEST_WEB_PORT=18081 file=".features-gen/tests/e2e/security/login/login.feature.spec.js"`
- [ ] `make test-e2e TEST_WEB_PORT=18081` (full)
- [ ] `make test-down TEST_WEB_PORT=18081`
- [ ] `python3 .opencode/meta/hooks/quality_gate.py --workspace . --mode quick --strict` (si existe en repo)

---

## Notes

- No commit/no push until explicit user instruction.
- Keep `TEST_WEB_PORT=18081` as default local workaround when 8081 is occupied.
- `.features-gen/` is generated and already ignored; do not commit generated files.

---

## Final status (2026-04-26)

- ✅ Task 1 completed:
  - Added `test-fix-cache-perms` target in `Makefile` and wired it into E2E targets before `cache:clear`.
  - Hardened cache cleanup command to avoid race-related `rm` failures (`rm -rf ... || true`).
  - Login smoke revalidated green after change.
- ✅ Task 2 completed:
  - Unified customers React flow on shared `apiClient` (instead of raw `axios`) in:
    - `assets/components/customers/CustomerForm.tsx`
    - `assets/components/customers/CustomerList.tsx`
  - Rebuilt frontend assets in test mode to ensure runtime bundle reflects source changes.
  - Customers create scenario now green (`3 passed`).
- ✅ Task 3 completed:
  - Domain packs executed:
    - customers: `13 passed`
    - appointments: `13 passed`
  - No additional selector hardening required after auth/client stabilization (existing selectors passed as-is).
- ✅ Task 4 completed:
  - Full E2E suite executed green: `68 passed`.
  - Residual failure matrix: none.

### Mandatory verification checklist result

- ✅ `npm run typecheck`
- ✅ `npm run test:unit` (`41 passed`)
- ✅ `make test-e2e TEST_WEB_PORT=18081 file=".features-gen/tests/e2e/security/login/login.feature.spec.js"`
- ✅ `make test-e2e TEST_WEB_PORT=18081` (full, `68 passed`)
- ✅ `make test-down TEST_WEB_PORT=18081`
- ⚪ `python3 .opencode/meta/hooks/quality_gate.py --workspace . --mode quick --strict` not executed because script was not present in this worktree.
