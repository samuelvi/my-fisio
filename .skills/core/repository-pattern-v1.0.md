---
type: skill
category: core
version: 1.0.0
status: production
compatibility:
  llms:
    - claude
    - gemini
    - openai
  frameworks:
    - symfony
    - doctrine
    - ddd
dependencies: []
tags:
  - repository
  - doctrine
  - querybuilder
  - data-access
  - ddd
created: 2026-01-09
updated: 2026-01-09
author: MyPhysio Team
license: MIT
description: |
  Repository Pattern implementation with Doctrine QueryBuilder for Symfony applications.
  Encapsulates data access logic, enforces consistent query patterns, and maintains clean architecture.
---

# Repository Pattern with Doctrine QueryBuilder

## Overview

The Repository Pattern encapsulates data access logic, providing a collection-like interface for accessing domain objects. In Symfony/Doctrine, this pattern prevents direct `EntityManager` usage in business logic and ensures all queries go through well-defined repository methods.

## Problem Statement

Direct `EntityManager` or magic method usage leads to:
- **Scattered queries**: Data access logic spread across controllers, services
- **Inconsistent patterns**: Some use `find()`, others use DQL, others use QueryBuilder
- **Hard to test**: Mocking `EntityManager` is complex
- **Performance issues**: Magic methods don't allow optimization
- **Identity Map pollution**: `find()` methods bypass freshness controls

## Solution

**Repository Pattern with QueryBuilder:**
- All database queries encapsulated in repository methods
- QueryBuilder used exclusively (no magic methods)
- Repository interfaces in Domain layer
- Concrete implementations in Infrastructure layer
- Named methods for each specific query need

## Implementation

### Prerequisites

```bash
# Doctrine ORM already installed in Symfony
composer require symfony/orm-pack
```

### Directory Structure

```
src/
├── Domain/
│   └── Repository/                    # Interfaces (contracts)
│       ├── PatientRepositoryInterface.php
│       └── InvoiceRepositoryInterface.php
│
└── Infrastructure/
    └── Persistence/
        └── Doctrine/
            └── Repository/            # Implementations
                ├── DoctrinePatientRepository.php
                └── DoctrineInvoiceRepository.php
```

### Step-by-Step Guide

#### 1. Create Repository Interface (Domain Layer)

```php
<?php
// src/Domain/Repository/PatientRepositoryInterface.php

declare(strict_types=1);

namespace App\Domain\Repository;

use App\Domain\Entity\Patient;

interface PatientRepositoryInterface
{
    /**
     * Get patient by ID or throw exception.
     *
     * @throws \RuntimeException if patient not found
     */
    public function get(int $id): Patient;

    /**
     * Save patient (create or update).
     */
    public function save(Patient $patient): void;

    /**
     * Delete patient.
     */
    public function delete(Patient $patient): void;

    /**
     * Find patient for invoice prefill (optimized query).
     * Returns only fields needed for invoice creation.
     *
     * @return array{fullName: string, taxId: string, email: string}|null
     */
    public function findForInvoicePrefill(int $id): ?array;

    /**
     * Find all patients for list display (paginated).
     * Returns lightweight data for UI list.
     *
     * @return list<array{id: int, fullName: string, taxId: string, phone: string|null}>
     */
    public function findAllForList(int $limit = 50, int $offset = 0): array;

    /**
     * Search patients by name or tax ID.
     *
     * @return list<array{id: int, fullName: string, taxId: string}>
     */
    public function searchByNameOrTaxId(string $query, int $limit = 10): array;
}
```

#### 2. Create Concrete Implementation (Infrastructure Layer)

```php
<?php
// src/Infrastructure/Persistence/Doctrine/Repository/DoctrinePatientRepository.php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Doctrine\Repository;

use App\Domain\Entity\Patient;
use App\Domain\Repository\PatientRepositoryInterface;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\AbstractQuery;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Patient>
 */
final class DoctrinePatientRepository extends ServiceEntityRepository implements PatientRepositoryInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Patient::class);
    }

    public function get(int $id): Patient
    {
        $patient = $this->createQueryBuilder('p')
            ->where('p.id = :id')
            ->setParameter('id', $id)
            ->getQuery()
            ->getOneOrNullResult();

        if ($patient === null) {
            throw new \RuntimeException("Patient with ID {$id} not found");
        }

        return $patient;
    }

    public function save(Patient $patient): void
    {
        $em = $this->getEntityManager();
        $em->persist($patient);
        $em->flush();
    }

    public function delete(Patient $patient): void
    {
        $em = $this->getEntityManager();
        $em->remove($patient);
        $em->flush();
    }

    public function findForInvoicePrefill(int $id): ?array
    {
        return $this->createQueryBuilder('p')
            ->select('p.fullName', 'p.taxId', 'p.email')
            ->where('p.id = :id')
            ->setParameter('id', $id)
            ->getQuery()
            ->getOneOrNullResult(AbstractQuery::HYDRATE_ARRAY);
    }

    public function findAllForList(int $limit = 50, int $offset = 0): array
    {
        return $this->createQueryBuilder('p')
            ->select('p.id', 'p.fullName', 'p.taxId', 'p.phone')
            ->orderBy('p.fullName', 'ASC')
            ->setMaxResults($limit)
            ->setFirstResult($offset)
            ->getQuery()
            ->getArrayResult(); // Returns array, not entities (better performance)
    }

    public function searchByNameOrTaxId(string $query, int $limit = 10): array
    {
        return $this->createQueryBuilder('p')
            ->select('p.id', 'p.fullName', 'p.taxId')
            ->where('p.fullName LIKE :query OR p.taxId LIKE :query')
            ->setParameter('query', '%' . $query . '%')
            ->setMaxResults($limit)
            ->getQuery()
            ->getArrayResult();
    }
}
```

#### 3. Register Repository as Service

```yaml
# config/services.yaml
services:
    # Auto-register repositories
    App\Infrastructure\Persistence\Doctrine\Repository\:
        resource: '../src/Infrastructure/Persistence/Doctrine/Repository'

    # Bind interfaces to implementations
    App\Domain\Repository\PatientRepositoryInterface:
        class: App\Infrastructure\Persistence\Doctrine\Repository\DoctrinePatientRepository

    # Controllers/Services receive interface via autowiring
    App\Infrastructure\Api\Controller\:
        resource: '../src/Infrastructure/Api/Controller'
        autowire: true
```

#### 4. Use Repository in Controller (NO EntityManager!)

```php
<?php
// src/Infrastructure/Api/Controller/PatientController.php

declare(strict_types=1);

namespace App\Infrastructure\Api\Controller;

use App\Domain\Repository\PatientRepositoryInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/patients', name: 'api_patients_')]
final class PatientController extends AbstractController
{
    public function __construct(
        private readonly PatientRepositoryInterface $patientRepository, // Interface!
    ) {
    }

    #[Route('/{id}', name: 'get', methods: ['GET'])]
    public function get(int $id): JsonResponse
    {
        // ✅ Good: Use repository method
        $patientData = $this->patientRepository->findForInvoicePrefill($id);

        // ❌ Bad: DO NOT inject EntityManager
        // $em->find(Patient::class, $id)

        if ($patientData === null) {
            throw $this->createNotFoundException();
        }

        return new JsonResponse($patientData);
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        // ✅ Good: Use repository method
        $patients = $this->patientRepository->findAllForList(limit: 50);

        return new JsonResponse($patients);
    }

    #[Route('/search', name: 'search', methods: ['GET'])]
    public function search(string $q): JsonResponse
    {
        // ✅ Good: Use repository method
        $results = $this->patientRepository->searchByNameOrTaxId($q);

        return new JsonResponse($results);
    }
}
```

## Configuration

### Service Binding

```yaml
# config/services.yaml
services:
    _defaults:
        autowire: true
        autoconfigure: true

    # Bind all repository interfaces automatically
    _instanceof:
        App\Domain\Repository\:
            tags: ['app.repository']

    # Explicit bindings (alternative)
    App\Domain\Repository\PatientRepositoryInterface: '@App\Infrastructure\Persistence\Doctrine\Repository\DoctrinePatientRepository'
    App\Domain\Repository\InvoiceRepositoryInterface: '@App\Infrastructure\Persistence\Doctrine\Repository\DoctrineInvoiceRepository'
```

## Testing

### Unit Test with Mock Repository

```php
<?php
// tests/Unit/Controller/PatientControllerTest.php

declare(strict_types=1);

namespace App\Tests\Unit\Controller;

use App\Domain\Repository\PatientRepositoryInterface;
use App\Infrastructure\Api\Controller\PatientController;
use PHPUnit\Framework\TestCase;

final class PatientControllerTest extends TestCase
{
    public function testGetReturnsPatientData(): void
    {
        // Arrange
        $repository = $this->createMock(PatientRepositoryInterface::class);
        $repository->method('findForInvoicePrefill')
            ->with(123)
            ->willReturn([
                'fullName' => 'John Doe',
                'taxId' => '12345678A',
                'email' => 'john@example.com',
            ]);

        $controller = new PatientController($repository);

        // Act
        $response = $controller->get(123);

        // Assert
        $this->assertSame(200, $response->getStatusCode());
        $data = json_decode($response->getContent(), true);
        $this->assertSame('John Doe', $data['fullName']);
    }
}
```

### Integration Test with Real Database

```php
<?php
// tests/Integration/Repository/DoctrinePatientRepositoryTest.php

declare(strict_types=1);

namespace App\Tests\Integration\Repository;

use App\Domain\Entity\Patient;
use App\Domain\Repository\PatientRepositoryInterface;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

final class DoctrinePatientRepositoryTest extends KernelTestCase
{
    private PatientRepositoryInterface $repository;

    protected function setUp(): void
    {
        self::bootKernel();
        $this->repository = self::getContainer()->get(PatientRepositoryInterface::class);
    }

    public function testFindForInvoicePrefillReturnsArrayNotEntity(): void
    {
        // Arrange: Create test patient
        $patient = Patient::create('Jane Smith', '87654321B', 'jane@example.com');
        $this->repository->save($patient);

        // Act
        $result = $this->repository->findForInvoicePrefill($patient->getId());

        // Assert
        $this->assertIsArray($result);
        $this->assertArrayHasKey('fullName', $result);
        $this->assertSame('Jane Smith', $result['fullName']);
    }
}
```

## Performance Considerations

### Use getArrayResult() for Reads

```php
// ✅ Good: Returns arrays, bypasses Identity Map
public function findAllForList(): array
{
    return $this->createQueryBuilder('p')
        ->select('p.id', 'p.fullName', 'p.taxId')
        ->getQuery()
        ->getArrayResult(); // Array of arrays
}

// ❌ Bad: Returns entities, uses Identity Map, slower
public function findAllForList(): array
{
    return $this->createQueryBuilder('p')
        ->getQuery()
        ->getResult(); // Array of Patient objects
}
```

### Select Only Needed Fields

```php
// ✅ Good: SELECT only 3 fields
public function findForDropdown(): array
{
    return $this->createQueryBuilder('p')
        ->select('p.id', 'p.fullName')
        ->getQuery()
        ->getArrayResult();
}

// ❌ Bad: SELECT * (all entity fields)
public function findForDropdown(): array
{
    return $this->createQueryBuilder('p')
        ->getQuery()
        ->getArrayResult(); // Still selects all fields
}
```

### Avoid N+1 Queries with Joins

```php
// ✅ Good: One query with join
public function findWithInvoices(int $id): ?array
{
    return $this->createQueryBuilder('p')
        ->select('p', 'i') // Include related entity
        ->leftJoin('p.invoices', 'i')
        ->where('p.id = :id')
        ->setParameter('id', $id)
        ->getQuery()
        ->getOneOrNullResult(AbstractQuery::HYDRATE_ARRAY);
}

// ❌ Bad: Triggers N+1 when accessing $patient->getInvoices()
public function get(int $id): Patient
{
    return $this->createQueryBuilder('p')
        ->where('p.id = :id')
        ->setParameter('id', $id)
        ->getQuery()
        ->getOneOrNullResult(); // Lazy loading invoices later = N+1
}
```

## Troubleshooting

### Repository not found

```
Cannot autowire service "PatientController": argument "$patientRepository"
references interface "PatientRepositoryInterface" but no such service exists.
```

**Solution**: Ensure interface is bound to implementation in `services.yaml`

```yaml
App\Domain\Repository\PatientRepositoryInterface:
    class: App\Infrastructure\Persistence\Doctrine\Repository\DoctrinePatientRepository
```

### Magic methods still used

```php
// ❌ Forbidden: Don't use magic methods
$patient = $repository->find($id);
$patients = $repository->findBy(['active' => true]);
$patient = $repository->findOneBy(['taxId' => '12345678A']);

// ✅ Required: Use explicit QueryBuilder methods
$patient = $this->createQueryBuilder('p')
    ->where('p.id = :id')
    ->setParameter('id', $id)
    ->getQuery()
    ->getOneOrNullResult();
```

### Identity Map causing stale data

```php
// Problem: Identity Map caches entities, may return stale data
$patient1 = $repository->get(1); // Fetches from DB
$patient1->setEmail('old@example.com');
// Another process updates email in DB to 'new@example.com'
$patient2 = $repository->get(1); // Returns cached $patient1, not fresh data!

// ✅ Solution: Use getArrayResult() for fresh data
public function get(int $id): Patient
{
    // Clear identity map if needed
    $this->getEntityManager()->clear();

    return $this->createQueryBuilder('p')
        ->where('p.id = :id')
        ->setParameter('id', $id)
        ->getQuery()
        ->getOneOrNullResult();
}

// ✅ Better: For read-only queries, use arrays
public function findForDisplay(int $id): ?array
{
    return $this->createQueryBuilder('p')
        ->select('p.id', 'p.fullName', 'p.email')
        ->where('p.id = :id')
        ->setParameter('id', $id)
        ->getQuery()
        ->getOneOrNullResult(AbstractQuery::HYDRATE_ARRAY); // Always fresh
}
```

## Best Practices

### Naming Conventions

```php
// ✅ Good: Descriptive method names
findForInvoicePrefill()     // Specific purpose
findAllForList()            // Specific view
searchByNameOrTaxId()       // Clear search criteria

// ❌ Bad: Generic names
find()                      // What does it return?
getAll()                    // In what format?
search()                    // Search by what field?
```

### Repository Methods Should

- ✅ Return arrays for read-only queries (use `getArrayResult()`)
- ✅ Return entities only when modifications needed
- ✅ Use QueryBuilder exclusively (no magic methods, no DQL strings)
- ✅ Have explicit, named methods for each use case
- ✅ Select only needed fields (performance)
- ✅ Use parameter binding (security)
- ❌ Never execute raw SQL without prepared statements
- ❌ Never return `QueryBuilder` (return results, not builder)

### Controller/Service Rules

- ✅ Inject `PatientRepositoryInterface` (not concrete class)
- ✅ Inject specific repositories only (not `EntityManagerInterface`)
- ✅ Use Command Bus for writes (when using CQRS)
- ✅ Use repository directly for reads
- ❌ Never inject `EntityManagerInterface` in controllers
- ❌ Never create repositories manually with `new`

## Advanced Patterns

### Repository with Custom Query Objects

```php
// Create query object
class PatientSearchQuery
{
    public function __construct(
        public readonly ?string $name = null,
        public readonly ?string $taxId = null,
        public readonly ?bool $active = null,
        public readonly int $limit = 50,
        public readonly int $offset = 0,
    ) {
    }
}

// Use in repository
public function search(PatientSearchQuery $query): array
{
    $qb = $this->createQueryBuilder('p')
        ->select('p.id', 'p.fullName', 'p.taxId');

    if ($query->name !== null) {
        $qb->andWhere('p.fullName LIKE :name')
           ->setParameter('name', '%' . $query->name . '%');
    }

    if ($query->taxId !== null) {
        $qb->andWhere('p.taxId = :taxId')
           ->setParameter('taxId', $query->taxId);
    }

    if ($query->active !== null) {
        $qb->andWhere('p.active = :active')
           ->setParameter('active', $query->active);
    }

    return $qb->setMaxResults($query->limit)
              ->setFirstResult($query->offset)
              ->getQuery()
              ->getArrayResult();
}
```

## References

- [Doctrine QueryBuilder Documentation](https://www.doctrine-project.org/projects/doctrine-orm/en/current/reference/query-builder.html)
- [Repository Pattern by Martin Fowler](https://martinfowler.com/eaaCatalog/repository.html)
- Related skills:
  - [cqrs-pattern-v1.0.md](./cqrs-pattern-v1.0.md)
  - [../integration/doctrine-performance-v1.0.md](../integration/doctrine-performance-v1.0.md)

## Examples in MyPhysio Project

```bash
# See real implementations:
src/Domain/Repository/PatientRepositoryInterface.php
src/Infrastructure/Persistence/Doctrine/Repository/DoctrinePatientRepository.php
src/Infrastructure/Api/Controller/PatientController.php
```
