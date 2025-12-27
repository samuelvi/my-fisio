<?php

declare(strict_types=1);

namespace App\Infrastructure\Search;

use Doctrine\ORM\QueryBuilder;

use function count;
use function implode;
use function sprintf;
use function str_split;
use function strlen;

/**
 * PostgreSQL-optimized patient search strategy.
 *
 * Can leverage PostgreSQL-specific features like:
 * - pg_trgm extension for similarity search
 * - unaccent() for accent removal
 * - levenshtein() for fuzzy matching
 *
 * This is a basic implementation. For production, consider enabling
 * pg_trgm and using more advanced PostgreSQL features.
 */
final class PostgreSQLPatientSearchStrategy implements PatientSearchStrategyInterface
{
    public function applySearchConditions(QueryBuilder $qb, string $search, bool $useFuzzy): void
    {
        $searchOr = $qb->expr()->orX();

        // PostgreSQL: Use LOWER() for case-insensitive
        // Note: If using pg_trgm extension, you could use similarity operators (%, <->, etc.)
        $searchOr->add('LOWER(p.fullName) = LOWER(:searchExact)');
        $searchOr->add('LOWER(p.email) = LOWER(:searchExact)');
        $searchOr->add('LOWER(p.phone) = LOWER(:searchExact)');

        $searchOr->add('LOWER(p.fullName) LIKE LOWER(:searchFull)');
        $searchOr->add('LOWER(p.phone) LIKE LOWER(:searchFull)');
        $searchOr->add('LOWER(p.email) LIKE LOWER(:searchFull)');

        $qb->setParameter('searchFull', '%' . $search . '%');
        $qb->setParameter('searchExact', $search);

        // Multi-token search
        $tokens = $this->extractSearchTokens($search);
        if (count($tokens) > 1) {
            $tokenAnd = $qb->expr()->andX();
            foreach ($tokens as $index => $token) {
                $param = 'searchToken' . $index;
                $tokenAnd->add(sprintf('LOWER(p.fullName) LIKE LOWER(:%s)', $param));
                $qb->setParameter($param, '%' . $token . '%');
            }
            $searchOr->add($tokenAnd);
        }

        // Fuzzy search using wildcard pattern
        if ($useFuzzy && strlen($search) >= 4) {
            foreach ($tokens as $index => $token) {
                if (strlen($token) >= 4) {
                    $patterns = $this->buildFuzzyPatterns($token);
                    foreach ($patterns as $patternIndex => $pattern) {
                        $param = sprintf('fuzzyToken%s_%s', $index, $patternIndex);
                        $searchOr->add(sprintf('LOWER(p.fullName) LIKE LOWER(:%s)', $param));
                        $qb->setParameter($param, $pattern);
                    }
                }
            }
        }

        $qb->andWhere($searchOr);
    }

    public function applySearchOrdering(QueryBuilder $qb, string $search): void
    {
        $qb->addOrderBy(
            'CASE
                WHEN LOWER(p.fullName) = LOWER(:searchExact) OR LOWER(p.email) = LOWER(:searchExact) OR LOWER(p.phone) = LOWER(:searchExact) THEN 0
                WHEN (LOWER(p.fullName) LIKE LOWER(:searchFull) OR LOWER(p.email) LIKE LOWER(:searchFull) OR LOWER(p.phone) LIKE LOWER(:searchFull)) THEN 1
                ELSE 2
            END',
            'ASC'
        );
    }

    public function getPlatformName(): string
    {
        return 'postgresql';
    }

    /**
     * @return string[]
     */
    private function extractSearchTokens(string $search): array
    {
        $tokens = preg_split('/\s+/', $search) ?: [];
        $tokens = array_filter(array_map('trim', $tokens), static fn(string $token) => '' !== $token);

        return array_values(array_unique($tokens));
    }

    /**
     * @return string[]
     */
    private function buildFuzzyPatterns(string $token): array
    {
        $chars = str_split($token);
        $patterns = [];
        $patterns[] = '%' . implode('%', $chars) . '%';

        if (count($chars) >= 5) {
            foreach ($chars as $index => $_char) {
                $reduced = $chars;
                unset($reduced[$index]);
                $reduced = array_values($reduced);
                $patterns[] = '%' . implode('%', $reduced) . '%';
            }
        }

        return array_values(array_unique($patterns));
    }
}
