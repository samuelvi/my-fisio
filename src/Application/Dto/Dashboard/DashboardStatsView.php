<?php

declare(strict_types=1);

namespace App\Application\Dto\Dashboard;

final readonly class DashboardStatsView
{
    private function __construct(
        public int $totalPatients,
        public int $appointmentsToday,
        public int $invoicesThisYear
    ) {}

    public static function create(
        int $totalPatients,
        int $appointmentsToday,
        int $invoicesThisYear
    ): self {
        return new self($totalPatients, $appointmentsToday, $invoicesThisYear);
    }
}
