<?php

declare(strict_types=1);

namespace App\Application\Query\Dashboard\GetDashboardStats;

final readonly class GetDashboardStatsQuery
{
    private function __construct()
    {
    }

    public static function create(): self
    {
        return new self();
    }
}
