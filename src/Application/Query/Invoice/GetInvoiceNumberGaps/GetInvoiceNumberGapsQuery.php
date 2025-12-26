<?php

declare(strict_types=1);

namespace App\Application\Query\Invoice\GetInvoiceNumberGaps;

final readonly class GetInvoiceNumberGapsQuery
{
    private function __construct(
        public int $year,
    ) {
    }

    public static function create(int $year): self
    {
        return new self($year);
    }
}
