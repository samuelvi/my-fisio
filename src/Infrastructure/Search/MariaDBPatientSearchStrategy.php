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
 * MariaDB-optimized patient search strategy.
 *
 * Leverages MariaDB's utf8mb4_unicode_ci collation for:
 * - Case-insensitive matching
 * - Accent-insensitive matching
 *
 * No need for LOWER() or UNACCENT() functions.
 */
final class MariaDBPatientSearchStrategy implements PatientSearchStrategyInterface
{
    public function applySearchConditions(QueryBuilder $qb, string $search, bool $useFuzzy): void
    {
        $searchOr = $qb->expr()->orX();

        // MariaDB with utf8mb4_unicode_ci: case and accent insensitive by default
        // Exact matches (highest priority)
        $searchOr->add('p.fullName = :searchExact');
        $searchOr->add('p.email = :searchExact');
        $searchOr->add('p.phone = :searchExact');

        // Partial matches
        $searchOr->add('p.fullName LIKE :searchFull');
        $searchOr->add('p.phone LIKE :searchFull');
        $searchOr->add('p.email LIKE :searchFull');

        $qb->setParameter('searchFull', '%' . $search . '%');
        $qb->setParameter('searchExact', $search);

        // Multi-token search (e.g., "Juan Garcia")
        $tokens = $this->extractSearchTokens($search);
        if (count($tokens) > 1) {
            $tokenAnd = $qb->expr()->andX();
            foreach ($tokens as $index => $token) {
                $param = 'searchToken' . $index;
                $tokenAnd->add(sprintf('p.fullName LIKE :%s', $param));
                $qb->setParameter($param, '%' . $token . '%');
            }
            $searchOr->add($tokenAnd);
        }

        // Fuzzy search: wildcard between each character
        // Example: "manuel" -> "%m%a%n%u%e%l%"
        // Tolerates typos and missing letters
        if ($useFuzzy && strlen($search) >= 4) {
            foreach ($tokens as $index => $token) {
                if (strlen($token) >= 4) {
                    $chars = str_split($token);
                    $fuzzyPattern = '%' . implode('%', $chars) . '%';

                    $param = 'fuzzyToken' . $index;
                    $searchOr->add(sprintf('p.fullName LIKE :%s', $param));
                    $qb->setParameter($param, $fuzzyPattern);
                }
            }
        }

        $qb->andWhere($searchOr);
    }

    public function applySearchOrdering(QueryBuilder $qb, string $search): void
    {
        // Order by relevance: exact match > partial match > fuzzy match
        $qb->addOrderBy(
            'CASE
                WHEN p.fullName = :searchExact OR p.email = :searchExact OR p.phone = :searchExact THEN 0
                WHEN (p.fullName LIKE :searchFull OR p.email LIKE :searchFull OR p.phone LIKE :searchFull) THEN 1
                ELSE 2
            END',
            'ASC'
        );
    }

    public function getPlatformName(): string
    {
        return 'mariadb';
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
}
