<?php

declare(strict_types=1);

namespace App\Infrastructure\Search;

use Doctrine\ORM\QueryBuilder;

/**
 * Strategy interface for patient search implementations.
 * Different database systems can have their own optimized search strategies.
 */
interface PatientSearchStrategyInterface
{
    /**
     * Apply search conditions to the query builder.
     *
     * @param QueryBuilder $qb The query builder to modify
     * @param string $search The search term
     * @param bool $useFuzzy Whether to use fuzzy matching
     * @return void
     */
    public function applySearchConditions(QueryBuilder $qb, string $search, bool $useFuzzy): void;

    /**
     * Apply search ordering to the query builder.
     *
     * @param QueryBuilder $qb The query builder to modify
     * @param string $search The search term
     * @return void
     */
    public function applySearchOrdering(QueryBuilder $qb, string $search): void;

    /**
     * Get the name of the database platform this strategy is for.
     *
     * @return string Platform name (e.g., 'mariadb', 'postgresql', 'oracle')
     */
    public function getPlatformName(): string;
}
