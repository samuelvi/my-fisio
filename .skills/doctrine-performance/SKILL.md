---
name: doctrine-performance
description: Doctrine performance optimization patterns to ensure data freshness and query efficiency.
---

# Doctrine Performance Optimization

## Key Principles

### 1. Bypass Identity Map with getArrayResult()
```php
// ✅ Always fresh data, bypasses UnitOfWork
$results = $qb->getQuery()->getArrayResult();

// ❌ Uses Identity Map, may return stale data
$results = $qb->getQuery()->getResult();
```

### 2. Clear UnitOfWork for Consistency
```php
// After multiple writes, clear to ensure fresh reads
$em->flush();
$em->clear(); // Purges Identity Map
```

### 3. Use QueryBuilder Only (No Magic Methods)
```php
// ✅ Explicit QueryBuilder
$patient = $this->createQueryBuilder('p')
    ->where('p.id = :id')
    ->setParameter('id', $id)
    ->getQuery()
    ->getOneOrNullResult();

// ❌ Magic methods (forbidden)
$patient = $this->find($id);
$patients = $this->findBy(['active' => true]);
```

### 4. Select Only Needed Fields
```php
// ✅ Optimized: SELECT 3 fields
$qb->select('p.id', 'p.fullName', 'p.email');

// ❌ Unoptimized: SELECT *
$qb->select('p'); // Selects all fields
```

### 5. Eager Loading with Joins
```php
// ✅ One query with join
$qb->select('p', 'i')
   ->leftJoin('p.invoices', 'i');

// ❌ N+1 problem: triggers lazy loading
$qb->select('p');
// Later: $patient->getInvoices() → N+1 queries
```

### 6. Use LIMIT 1 for Existence Checks
When checking if data exists, use `LIMIT 1` instead of `COUNT(*)`.

```php
// ✅ Efficient: stops at first match
public function existsByEmail(string $email): bool
{
    $result = $this->createQueryBuilder('u')
        ->select('1')
        ->where('u.email = :email')
        ->setParameter('email', $email)
        ->setMaxResults(1)
        ->getQuery()
        ->getOneOrNullResult();

    return $result !== null;
}

// ❌ Inefficient: counts ALL matching rows
public function countByEmail(string $email): int
{
    $qb = $this->createQueryBuilder('u')
        ->select('COUNT(u.id)')
        ->where('u.email = :email')
        ->setParameter('email', $email);

    return (int) $qb->getQuery()->getSingleScalarResult();
}
// Then used as: if ($count > 0) { ... }
```

**Performance impact:**

| Scenario | COUNT(*) | LIMIT 1 |
|----------|----------|---------|
| 0 matching rows | Scans index | Scans index |
| 1 matching row | Scans all results | Stops at 1st |
| 1M matching rows | Counts 1M rows | Stops at 1st |

**Naming convention:** Use `exists*` methods returning `bool` instead of `count*` returning `int` when only checking existence.

## Performance Checklist
- [ ] Use getArrayResult() for read-only queries
- [ ] Use QueryBuilder exclusively
- [ ] Select only needed fields
- [ ] Eager load associations with joins
- [ ] Clear EntityManager after batch operations
- [ ] Use indexes on frequently queried fields
- [ ] Use LIMIT 1 for existence checks (not COUNT)
- [ ] Monitor slow query log

## References
- [Doctrine Performance Best Practices](https://www.doctrine-project.org/projects/doctrine-orm/en/current/reference/best-practices.html)
- Related: [repository-pattern-v1.0.md](../core/repository-pattern-v1.0.md)
