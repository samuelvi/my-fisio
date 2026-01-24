---
name: dangerous-defaults
description: Avoid dangerous default values in method parameters that can lead to security vulnerabilities or incorrect behavior. Applies to user IDs, tenant IDs, and other context-dependent values.
---

# Dangerous Default Values

## Problem

Using default values for security-sensitive or context-dependent parameters creates hidden assumptions that can lead to:
- **Security vulnerabilities**: Hardcoded user IDs can bypass authentication
- **Data leakage**: Operations may affect wrong user's data
- **Silent failures**: Bugs go unnoticed because defaults "work"
- **Testing gaps**: Default values mask missing dependencies

## The Antipattern

```php
// ❌ DANGEROUS: Assumes user 1 exists and is valid
public function createEmptySlotsIfNeeded(
    DateTimeImmutable $start,
    DateTimeImmutable $end,
    int $userId = 1  // 🚨 Never do this!
): int {
    // ...
}

// Caller forgets to pass userId - silently uses wrong user
$service->createEmptySlotsIfNeeded($start, $end);
```

## The Solution

**Make context-dependent parameters required.**

```php
// ✅ SAFE: Caller must explicitly provide userId
public function createEmptySlotsIfNeeded(
    DateTimeImmutable $start,
    DateTimeImmutable $end,
    int $userId  // Required - no default
): int {
    // ...
}

// Controller gets user from authentication context
/** @var User $user */
$user = $this->getUser();
$service->createEmptySlotsIfNeeded($start, $end, $user->getId());
```

## Parameters That Should NEVER Have Defaults

| Parameter Type | Why |
|----------------|-----|
| `userId` | Must come from authenticated session |
| `tenantId` | Must come from request context |
| `organizationId` | Must come from user's membership |
| `ownerId` | Must be explicitly determined |
| `createdBy` | Must reflect actual actor |
| `ipAddress` | Must come from request |

## Symfony Controller Pattern

```php
use Symfony\Component\Security\Http\Attribute\IsGranted;

class MyController extends AbstractController
{
    #[Route('/api/resource', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]  // Ensure user is logged in
    public function create(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();  // Get from security context

        // Pass explicitly to service layer
        $this->service->create($data, $user->getId());
    }
}
```

## Service Layer Pattern

```php
// ✅ Service requires userId - doesn't assume it
class OrderService
{
    public function createOrder(array $items, int $userId): Order
    {
        // userId is guaranteed to be provided
        return Order::create($items, $userId);
    }
}

// ❌ Service assumes userId
class OrderService
{
    public function createOrder(array $items, int $userId = 1): Order
    {
        // Bug: if caller forgets userId, order belongs to user 1
        return Order::create($items, $userId);
    }
}
```

## Testing Implications

Required parameters make tests more explicit:

```php
// ✅ Test clearly shows what user is being used
$service->createOrder($items, userId: 42);

// ❌ Test hides the user - might pass accidentally
$service->createOrder($items);  // Uses default user 1
```

## Valid Uses of Default Parameters

Defaults are acceptable for:
- **Configuration options**: `bool $sendEmail = true`
- **Pagination**: `int $limit = 20`
- **Sorting**: `string $orderBy = 'createdAt'`
- **Format preferences**: `string $format = 'json'`

```php
// ✅ These defaults are safe - they're preferences, not identity
public function search(
    array $filters,
    int $userId,           // Required: identity
    int $limit = 20,       // Optional: pagination preference
    string $sort = 'date'  // Optional: display preference
): array {
    // ...
}
```

## Checklist

- [ ] User/tenant/owner IDs have no default values
- [ ] Context-dependent parameters are required
- [ ] Controllers extract user from `$this->getUser()`
- [ ] Services receive identity as explicit parameters
- [ ] Tests explicitly provide all identity parameters
- [ ] `#[IsGranted]` attribute protects authenticated endpoints
