---
name: clean-code
description: Clean Code principles from Robert C. Martin and Refactoring patterns from Martin Fowler applied to TypeScript/JavaScript. Use when writing or reviewing code for readability, maintainability, and structure.
---

# Clean Code

Principios de Robert C. Martin (Clean Code) y Martin Fowler (Refactoring) adaptados a TypeScript/JavaScript.

## Newspaper Metaphor (Stepdown Rule)

El código debe leerse como un artículo de periódico: de arriba a abajo, de lo general a lo específico.

### Orden de un módulo

```typescript
// 1. Imports
import { something } from 'somewhere';

// 2. Types/Interfaces (contratos públicos primero)
type PublicType = { ... };
type InternalType = { ... };

// 3. Public API (exports principales)
export const mainFunction = () => {
  // usa helperA y helperB
};

export const anotherExport = () => { ... };

// 4. Private Helpers (detalles de implementación)
function helperA() { ... }
function helperB() { ... }

// 5. Module State (si es necesario)
const moduleState = new Map();
```

### Ejemplo real

```typescript
// ❌ MAL - helpers antes de donde se usan
function shouldReset() { ... }      // ¿Para qué es esto?
function getSkipReason() { ... }    // ¿Cuándo se llama?

export const test = base.extend({   // Finalmente el código principal
  dbReset: [
    async () => {
      if (!shouldReset()) { ... }   // Ah, aquí se usa
    }
  ]
});

// ✅ BIEN - código principal primero, helpers después
export const test = base.extend({
  dbReset: [
    async () => {
      if (!shouldReset()) { ... }   // Se usa aquí
    }
  ]
});

// Helpers al final - ya sabemos para qué sirven
function shouldReset() { ... }
function getSkipReason() { ... }
```

## Early Returns

Evitar anidación profunda retornando temprano.

```typescript
// ❌ MAL
function process(data) {
  let result = null;
  if (data) {
    if (data.isValid) {
      if (data.hasPermission) {
        result = doWork(data);
      }
    }
  }
  return result;
}

// ✅ BIEN
function process(data) {
  if (!data) return null;
  if (!data.isValid) return null;
  if (!data.hasPermission) return null;
  return doWork(data);
}
```

## Single Responsibility

Cada función hace una sola cosa.

```typescript
// ❌ MAL - hace demasiado
async function handleUser(user) {
  const validated = validateUser(user);
  const saved = await db.save(validated);
  await sendEmail(saved.email);
  await logAction('user_created', saved.id);
  return saved;
}

// ✅ BIEN - una responsabilidad
async function createUser(user) {
  const validated = validateUser(user);
  return await db.save(validated);
}

// Orquestación separada
async function handleUserCreation(user) {
  const saved = await createUser(user);
  await notifyUserCreated(saved);
  return saved;
}
```

## Nombres descriptivos

```typescript
// ❌ MAL
const d = new Date();
const arr = users.filter(u => u.a);
function proc(x) { ... }

// ✅ BIEN
const createdAt = new Date();
const activeUsers = users.filter(user => user.isActive);
function processPayment(order) { ... }
```

## Evitar comentarios obvios

```typescript
// ❌ MAL - el código ya lo dice
// Increment counter by 1
counter++;

// Check if user is admin
if (user.role === 'admin') { ... }

// ✅ BIEN - comentar el "por qué", no el "qué"
// Offset by 1 because API uses 1-based indexing
const apiIndex = index + 1;

// Legacy users don't have role field, default to basic
const role = user.role ?? 'basic';
```

## Funciones pequeñas

Máximo 20 líneas. Si es más larga, extraer helpers.

```typescript
// ❌ MAL - función de 50 líneas
async function processOrder(order) {
  // validación (10 líneas)
  // cálculos (15 líneas)
  // guardado (10 líneas)
  // notificaciones (15 líneas)
}

// ✅ BIEN - funciones pequeñas y enfocadas
async function processOrder(order) {
  const validated = validateOrder(order);
  const calculated = calculateTotals(validated);
  const saved = await saveOrder(calculated);
  await notifyOrderCreated(saved);
  return saved;
}
```

## Parámetros de función

Preferir 0-2 parámetros. Si necesitas más, usar objeto.

```typescript
// ❌ MAL
function createUser(name, email, age, role, department, manager) { ... }

// ✅ BIEN
function createUser({ name, email, age, role, department, manager }: CreateUserParams) { ... }
```

## Estructura de archivos

```
module/
├── index.ts          # Exports públicos
├── types.ts          # Tipos/interfaces
├── module.ts         # Lógica principal
└── helpers.ts        # Funciones auxiliares
```

# PHP Best Practices

Additional specific rules for PHP development in this project.

## Language and Comments

*   **English Only:** All code, variable names, function names, class names, and **comments** must be in English.
    *   *Exception:* Domain-specific terms that are untranslatable or legally required in another language (e.g., specific tax forms like "Modelo 303").
*   **No "Spanglish":** Avoid mixing languages.

```php
// ❌ BAD
// Calculamos el total
$total = $precio + $impuesto;

// ✅ GOOD
// Calculate total
$total = $price + $tax;
```

## Null and Empty Checks

*   **Use `empty()`:** Prefer `empty()` over checking for `null` or `""` explicitly when you want to catch both (and `0`, `false`, `[]`).
*   **Be explicit when necessary:** Only check for `=== null` if `0` or `false` are valid values that should *not* be treated as empty.

```php
// ❌ BAD
if ($email === null || $email === '') { ... }

// ✅ GOOD
if (empty($email)) { ... }
```

## Type Declarations

*   **Strict Types:** Always use `declare(strict_types=1);` at the top of PHP files.
*   **Type Hinting:** Always type hint arguments and return values.

```php
<?php

declare(strict_types=1);

namespace App\Service;

class Calculator
{
    public function add(int $a, int $b): int
    {
        return $a + $b;
    }
}
```

## Dependency Injection

*   **Constructor Injection:** Prefer constructor injection over setter or property injection.
*   **Interfaces:** Type hint against interfaces, not concrete classes.

```php
// ❌ BAD
class UserService
{
    public function __construct(Mailer $mailer) { ... } // Concrete class
}

// ✅ GOOD
class UserService
{
    public function __construct(MailerInterface $mailer) { ... } // Interface
}
```

## Performance Mindset (IO Operations)

Applying **Early Returns** is critical when dealing with I/O (Database, API calls, File System). Avoid unnecessary "round-trips" by validating inputs that would result in empty/no-op operations.

```php
// ✅ GOOD: Avoid DB call if we know the answer
public function findUsers(array $ids): array
{
    if (empty($ids)) {
        return [];
    }
    // ... query DB
}
```

---

# Refactoring (Martin Fowler)

## Tell, Don't Ask

No pidas datos para tomar decisiones. Dile al objeto qué hacer.

```typescript
// ❌ MAL - Ask: pides datos y decides fuera
if (user.getRole() === 'admin') {
  user.setPermissions(['read', 'write', 'delete']);
}

// ✅ BIEN - Tell: el objeto decide internamente
user.grantAdminPermissions();

// ❌ MAL - Ask: lógica de negocio fuera del objeto
const total = order.getItems().reduce((sum, item) =>
  sum + item.getPrice() * item.getQuantity(), 0
);

// ✅ BIEN - Tell: el objeto calcula su propio total
const total = order.calculateTotal();
```

## Law of Demeter (Don't Talk to Strangers)

Solo hablar con amigos directos, no con amigos de amigos.

```typescript
// ❌ MAL - cadena de llamadas (train wreck)
const city = order.getCustomer().getAddress().getCity();

// ✅ BIEN - preguntar directamente
const city = order.getShippingCity();

// ❌ MAL - conoce demasiado de la estructura interna
invoice.getCustomer().getAccount().debit(amount);

// ✅ BIEN - delegar la responsabilidad
invoice.charge(amount);
```

## Replace Magic Numbers/Strings

Constantes con nombre en lugar de valores literales.

```typescript
// ❌ MAL - números mágicos
if (user.age >= 18) { ... }
setTimeout(callback, 86400000);
if (status === 'P') { ... }

// ✅ BIEN - constantes con significado
const LEGAL_AGE = 18;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const STATUS_PENDING = 'P';

if (user.age >= LEGAL_AGE) { ... }
setTimeout(callback, ONE_DAY_MS);
if (status === STATUS_PENDING) { ... }
```

## Extract Method

Si puedes nombrar un bloque de código, extráelo.

```typescript
// ❌ MAL - bloque anónimo dentro de función
function processOrder(order) {
  // validate order
  if (!order.items.length) throw new Error('Empty order');
  if (!order.customer) throw new Error('No customer');
  if (order.total < 0) throw new Error('Invalid total');

  // continue processing...
}

// ✅ BIEN - extraer con nombre descriptivo
function processOrder(order) {
  validateOrder(order);
  // continue processing...
}

function validateOrder(order) {
  if (!order.items.length) throw new Error('Empty order');
  if (!order.customer) throw new Error('No customer');
  if (order.total < 0) throw new Error('Invalid total');
}
```

## Replace Conditional with Polymorphism

Cuando hay switch/if basados en tipo, usar polimorfismo.

```typescript
// ❌ MAL - switch por tipo
function calculateArea(shape) {
  switch (shape.type) {
    case 'circle': return Math.PI * shape.radius ** 2;
    case 'rectangle': return shape.width * shape.height;
    case 'triangle': return (shape.base * shape.height) / 2;
  }
}

// ✅ BIEN - cada tipo sabe calcularse
interface Shape {
  calculateArea(): number;
}

class Circle implements Shape {
  calculateArea() { return Math.PI * this.radius ** 2; }
}

class Rectangle implements Shape {
  calculateArea() { return this.width * this.height; }
}
```

## Compose Method

Una función debe hacer cosas al mismo nivel de abstracción.

```typescript
// ❌ MAL - mezcla niveles de abstracción
async function checkout(cart) {
  // Alto nivel
  const order = createOrder(cart);

  // Bajo nivel mezclado
  const tax = order.subtotal * 0.21;
  order.tax = Math.round(tax * 100) / 100;
  order.total = order.subtotal + order.tax;

  // Alto nivel otra vez
  await saveOrder(order);
  await sendConfirmation(order);
}

// ✅ BIEN - mismo nivel de abstracción
async function checkout(cart) {
  const order = createOrder(cart);
  calculateTotals(order);
  await saveOrder(order);
  await sendConfirmation(order);
}
```

## Code Smells (señales de refactoring)

| Smell | Síntoma | Solución |
|-------|---------|----------|
| **Feature Envy** | Método usa más datos de otra clase que de la propia | Mover método a la otra clase |
| **Data Clumps** | Grupos de datos que siempre van juntos | Extraer a clase/tipo |
| **Long Parameter List** | Más de 3 parámetros | Introducir Parameter Object |
| **Primitive Obsession** | Usar primitivos para conceptos de dominio | Crear Value Objects |
| **Shotgun Surgery** | Un cambio requiere editar muchos archivos | Consolidar lógica relacionada |
| **Divergent Change** | Una clase cambia por múltiples razones | Separar responsabilidades |

### Ejemplos de Code Smells

```typescript
// Feature Envy - el método envidia los datos de 'account'
// ❌ MAL
class Report {
  generateStatement(account) {
    return `Balance: ${account.balance},
            Transactions: ${account.transactions.length},
            Average: ${account.transactions.reduce((a,b) => a+b, 0) / account.transactions.length}`;
  }
}

// ✅ BIEN - mover a Account
class Account {
  generateStatement() {
    return `Balance: ${this.balance},
            Transactions: ${this.transactions.length},
            Average: ${this.getAverageTransaction()}`;
  }
}
```

```typescript
// Data Clump - estos 3 siempre van juntos
// ❌ MAL
function createUser(street, city, zipCode, name, email) { ... }
function updateAddress(street, city, zipCode) { ... }

// ✅ BIEN - extraer Address
type Address = { street: string; city: string; zipCode: string };
function createUser(address: Address, name: string, email: string) { ... }
function updateAddress(address: Address) { ... }
```

```typescript
// Primitive Obsession - string para concepto de dominio
// ❌ MAL
function sendEmail(to: string) {
  if (!to.includes('@')) throw new Error('Invalid email');
  // ...
}

// ✅ BIEN - Value Object
class Email {
  constructor(private value: string) {
    if (!value.includes('@')) throw new Error('Invalid email');
  }
  toString() { return this.value; }
}

function sendEmail(to: Email) { ... }
```

## Checklist

### Robert C. Martin (Clean Code)
- [ ] Imports al principio
- [ ] API pública antes que helpers privados
- [ ] Early returns en lugar de if/else anidados
- [ ] Funciones < 20 líneas
- [ ] Nombres descriptivos (no abreviaturas)
- [ ] Comentarios solo para el "por qué"
- [ ] Máximo 2-3 parámetros por función
- [ ] Una responsabilidad por función

### Martin Fowler (Refactoring)
- [ ] Tell, Don't Ask (objetos deciden, no exponen)
- [ ] Law of Demeter (no cadenas de llamadas)
- [ ] Sin números/strings mágicos
- [ ] Mismo nivel de abstracción por función
- [ ] Sin Feature Envy (métodos en su clase correcta)
- [ ] Data Clumps extraídos a tipos
- [ ] Value Objects para conceptos de dominio
