# E2E Testing

Tests E2E con Playwright-BDD. Stack: Playwright + Gherkin + TypeScript.

## Estructura

```
tests/e2e/
├── common/
│   ├── bdd.ts              # Fixtures y exports de Given/When/Then
│   ├── auth.ts             # Helpers de autenticación
│   └── steps/              # Steps genéricos reutilizables
│       ├── navigation.steps.ts   # "I navigate to", "I should be on"
│       ├── forms.steps.ts        # "I fill in", "I click the button"
│       └── assertions.steps.ts   # "I should see", "table should contain"
├── factories/              # Factorías de datos (Fishery + Faker)
│   ├── patient.factory.ts
│   ├── customer.factory.ts
│   ├── invoice.factory.ts
│   └── record.factory.ts
└── <domain>/
    └── <feature>/
        ├── feature.feature     # Escenarios Gherkin
        └── feature.steps.ts    # Step definitions específicos
```

## Ejecución

```bash
# Recomendado para desarrollo local (evita colisiones de BD)
npx playwright test --workers=1

# Generar specs y ejecutar
npx bddgen && npx playwright test --project=bdd

# Ejecutar con UI para depuración
npx playwright test --project=bdd --ui
```

## Estrategia de Datos

### 1. Factorías (Recomendado)

Usamos `fishery` y `@faker-js/faker` para generar datos dinámicos y robustos. **Evita hardcodear datos** en los tests.

```typescript
// tests/e2e/factories/patient.factory.ts
export const patientFactory = Factory.define<Partial<Patient>>(() => ({
    firstName: faker.person.firstName(),
    taxId: faker.helpers.replaceSymbols('########?').toUpperCase(),
    // ...
}));

// En tu step definition
const testPatient = patientFactory.build();
await page.getByLabel(/First Name/).fill(testPatient.firstName);
```

### 2. Database Reset con Tags

La base de datos se resetea siguiendo esta lógica para soportar "User Journeys" secuenciales:

| Contexto | Comportamiento |
|----------|----------------|
| Primer escenario del feature | Reset automático |
| Escenarios siguientes (sin tag) | Reutiliza datos (secuencial) |
| `@no-reset` | **Nunca resetea** (reutiliza datos, incluso en CI) |
| `@reset` | Siempre resetea |

> **Nota sobre CI**: A diferencia de versiones anteriores, el modo CI **respeta** el tag `@no-reset` para permitir la ejecución de historias de usuario completas que dependen del estado anterior (ej: Crear paciente -> Editar paciente -> Añadir historial).

## Reglas de Oro (Auditadas)

1. **Sin waits explícitos** - `waitForTimeout` está **PROHIBIDO**. Usa `waitFor()`, `expect().toBeVisible()`, o `waitForLoadState('networkidle')`.
2. **Selectores semánticos** - Usa `getByRole()`, `getByLabel()`, `getByText()`. Evita selectores CSS frágiles (`#id`, `.class`).
3. **Datos Dinámicos** - Usa las factorías en `tests/e2e/factories/` en lugar de strings fijos.
4. **Validación Robusta** - Sincroniza las aserciones con los datos generados por la factoría.
   * *Mal*: `expect(locator).toHaveValue("12345678A")`
   * *Bien*: `expect(locator).toHaveValue(testPatient.taxId)`

## Steps Genéricos Disponibles

### Navigation (`common/steps/navigation.steps.ts`)

```gherkin
Given I am on the "{path}" page
Given I am on the login page
When I navigate to "{path}"
When I reload the page
Then I should be on "{path}"
Then I should be redirected to "{path}"
```

### Forms (`common/steps/forms.steps.ts`)

```gherkin
When I fill in "{field}" with "{value}"
When I click the "{name}" button
When I click the "{name}" link
When I select "{option}" from "{field}"
When I check "{label}"
Then the field "{field}" should have value "{value}"
```

### Assertions (`common/steps/assertions.steps.ts`)

```gherkin
Then I should see "{text}"
Then I should see text matching "{pattern}"
Then I should see {n} rows in the table
Then the table should contain "{text}"
Then the "{name}" button should be visible
Then the "{name}" button should be disabled
```