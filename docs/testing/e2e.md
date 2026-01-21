# E2E Testing

Tests E2E con Playwright-BDD. Stack: Playwright + Gherkin + TypeScript.

## Estructura

```
tests/e2e/
├── common/
│   ├── bdd.ts          # Fixtures y exports de Given/When/Then
│   └── auth.ts         # Helpers de autenticación
└── <domain>/
    └── <feature>/
        ├── feature.feature     # Escenarios Gherkin
        └── feature.steps.ts    # Step definitions
```

## Ejecución

```bash
# Generar specs y ejecutar
npx bddgen && npx playwright test --project=bdd

# Solo generar specs
npx bddgen

# Ejecutar con UI
npx playwright test --project=bdd --ui
```

## Comportamiento por defecto

### Database Reset con Tags

La base de datos se resetea siguiendo esta lógica:

| Contexto | Comportamiento |
|----------|----------------|
| Primer escenario del feature | Reset automático |
| Escenarios siguientes (sin tag) | Reutiliza datos (secuencial) |
| `@no-reset` | Nunca resetea (reutiliza datos del anterior) |
| `@reset` | Siempre resetea |
| CI mode (`CI=true`) | Siempre resetea (ignora tags) |

**Ejemplo de uso:**

```gherkin
Feature: Invoice Management

  Scenario: Create invoice
    # Resetea (primer escenario)
    When I create an invoice
    Then it should be saved

  @no-reset
  Scenario: Edit invoice shows existing data
    # NO resetea - reutiliza la factura creada
    When I click edit on the first invoice
    Then the form should show the invoice data
```

**Implementación en `common/bdd.ts`:**

```typescript
const hasNoResetTag = testInfo.tags.includes('@no-reset');
const hasResetTag = testInfo.tags.includes('@reset');

if (isCI || hasResetTag) {
  shouldReset = true;
} else if (hasNoResetTag) {
  shouldReset = false;
} else if (isFirstScenarioOfFeature) {
  shouldReset = true;
}
```

### Autenticación

```typescript
// En steps
import { loginAsAdmin } from '../../common/auth';

Given('I am logged in as an administrator', async ({ page, context }) => {
  await loginAsAdmin(page, context);
});
```

## Reglas clave

1. **Sin waits explícitos** - Usar `waitFor()`, `waitForLoadState()`, expects
2. **Selectores semánticos** - `getByRole()`, `getByText()`, `getByLabel()` sobre CSS/IDs
3. **Steps atómicos** - Una acción o aserción por step
4. **Sin cleanup** - Los datos persisten para debugging post-fallo

## Anti-patrones

```typescript
// MAL
await page.waitForTimeout(5000);
await page.locator('#submit-btn').click();
// Handled by fixture in fixtures/bdd.ts

// BIEN
await page.waitForLoadState('networkidle');
await page.getByRole('button', { name: 'Submit' }).click();
// No-op: handled by dbReset fixture
```
