# Patient Search Strategy Architecture

This directory contains the **Strategy Pattern** implementation for patient search functionality, allowing the application to support multiple database platforms with optimized search strategies.

## 📐 Architecture Overview

```
PatientProvider
    ↓
PatientSearchStrategyFactory (detects DB platform)
    ↓
PatientSearchStrategyInterface
    ↓
    ├── MariaDBPatientSearchStrategy
    ├── PostgreSQLPatientSearchStrategy
    └── [Future: OraclePatientSearchStrategy, etc.]
```

## 🎯 Benefits

### 1. **Database Agnostic**
- Easy to switch between MariaDB, PostgreSQL, Oracle, etc.
- No code changes needed in `PatientProvider`
- Auto-detects database platform at runtime

### 2. **Optimized for Each Platform**
- **MariaDB**: Leverages `utf8mb4_unicode_ci` collation (no LOWER() needed)
- **PostgreSQL**: Can use `pg_trgm`, `unaccent()`, `levenshtein()`
- Each strategy uses platform-specific features for best performance

### 3. **Maintainable**
- Single Responsibility: Each strategy handles one database platform
- Open/Closed Principle: Add new platforms without modifying existing code
- Easy to test each strategy independently

### 4. **Extensible**
- Add new database platforms by creating a new strategy class
- Implement custom search algorithms per platform

## 📁 Files

### `PatientSearchStrategyInterface.php`
Interface defining the contract for all search strategies:
- `applySearchConditions()`: Adds WHERE conditions to query
- `applySearchOrdering()`: Adds ORDER BY for relevance ranking
- `getPlatformName()`: Returns platform identifier

### `MariaDBPatientSearchStrategy.php`
**MariaDB/MySQL optimized strategy:**
- ✅ Uses `utf8mb4_unicode_ci` collation (case + accent insensitive)
- ✅ No `LOWER()` needed (collation handles it)
- ✅ Direct column access (`fullName` instead of `CONCAT()`)
- ✅ Fuzzy search with wildcard patterns (`%m%a%n%u%e%l%`)
- ✅ Multi-token search for full names

### `PostgreSQLPatientSearchStrategy.php`
**PostgreSQL optimized strategy:**
- ✅ Uses `LOWER()` for case-insensitive matching
- ✅ Can be extended to use `pg_trgm` extension
- ✅ Can use `unaccent()` for accent removal
- ✅ Can use `levenshtein()` for fuzzy matching
- ✅ Same fuzzy pattern as MariaDB for consistency

### `PatientSearchStrategyFactory.php`
**Auto-detection factory:**
- Detects database platform from Doctrine connection
- Returns appropriate strategy instance
- Throws exception for unsupported platforms

## 🚀 Usage

The strategy is automatically selected in `PatientProvider`:

```php
public function __construct(
    private EntityManagerInterface $entityManager,
    private int $itemsPerPage,
) {
    // Auto-detect database platform and use appropriate search strategy
    $connection = $this->entityManager->getConnection();
    $this->searchStrategy = PatientSearchStrategyFactory::create($connection);
}
```

Then used in the search logic:

```php
$this->searchStrategy->applySearchConditions($qb, $search, $useFuzzy);
$this->searchStrategy->applySearchOrdering($qb, $search);
```

## 🔧 Adding a New Database Platform

To add support for a new database (e.g., Oracle):

1. **Create strategy class:**
```php
// src/Infrastructure/Search/OraclePatientSearchStrategy.php
final class OraclePatientSearchStrategy implements PatientSearchStrategyInterface
{
    public function applySearchConditions(QueryBuilder $qb, string $search, bool $useFuzzy): void
    {
        // Oracle-specific search logic
    }

    public function applySearchOrdering(QueryBuilder $qb, string $search): void
    {
        // Oracle-specific ordering
    }

    public function getPlatformName(): string
    {
        return 'oracle';
    }
}
```

2. **Update factory:**
```php
// PatientSearchStrategyFactory.php
return match (true) {
    str_contains($platform, 'mysql') || str_contains($platform, 'mariadb') => new MariaDBPatientSearchStrategy(),
    str_contains($platform, 'postgresql') => new PostgreSQLPatientSearchStrategy(),
    str_contains($platform, 'oracle') => new OraclePatientSearchStrategy(), // ← Add this
    default => throw new RuntimeException(...),
};
```

That's it! No changes needed in `PatientProvider` or any other code.

## 🧪 Testing

Each strategy can be tested independently:

```php
// Test MariaDB strategy
$strategy = new MariaDBPatientSearchStrategy();
$qb = $repository->createQueryBuilder('p');
$strategy->applySearchConditions($qb, 'García', false);

// Test PostgreSQL strategy
$strategy = new PostgreSQLPatientSearchStrategy();
$qb = $repository->createQueryBuilder('p');
$strategy->applySearchConditions($qb, 'García', false);
```

## 📊 Search Features

All strategies support:
- **Exact matching**: Full name, email, phone
- **Partial matching**: LIKE patterns
- **Multi-token**: Search "Juan Garcia" finds both words
- **Fuzzy matching**: Tolerates typos (optional with `?fuzzy=true`)
- **Relevance ordering**: Exact > Partial > Fuzzy

## 🔍 Current Platform Support

| Platform   | Status | Notes                                    |
|------------|--------|------------------------------------------|
| MariaDB    | ✅ Full | Optimized with utf8mb4_unicode_ci       |
| MySQL      | ✅ Full | Same as MariaDB                          |
| PostgreSQL | ✅ Full | Basic implementation, can be enhanced    |
| Oracle     | ❌ TODO | Add when needed                          |
| SQL Server | ❌ TODO | Add when needed                          |

## 💡 Future Enhancements

### PostgreSQL Advanced Features
```php
// Using pg_trgm extension
WHERE full_name % :search  -- Similarity operator
ORDER BY full_name <-> :search  -- Distance operator

// Using trigram indexes for performance
CREATE INDEX trgm_idx_patients_full_name ON patients USING GIN (full_name gin_trgm_ops);
```

### MariaDB Full-Text Search
```php
// Using FULLTEXT indexes
CREATE FULLTEXT INDEX ft_idx_patients_full_name ON patients(full_name);

// Using MATCH ... AGAINST
WHERE MATCH(full_name) AGAINST(:search IN NATURAL LANGUAGE MODE)
```

## 📚 References

- [Strategy Pattern](https://refactoring.guru/design-patterns/strategy)
- [MariaDB Character Sets](https://mariadb.com/kb/en/character-sets/)
- [PostgreSQL pg_trgm](https://www.postgresql.org/docs/current/pgtrgm.html)
- [Doctrine DBAL Platforms](https://www.doctrine-project.org/projects/doctrine-dbal/en/latest/reference/platforms.html)
