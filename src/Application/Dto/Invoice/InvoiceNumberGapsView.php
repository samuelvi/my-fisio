<?php

declare(strict_types=1);

namespace App\Application\Dto\Invoice;

final readonly class InvoiceNumberGapsView
{
    private function __construct(
        public int $year,
        public int $totalInvoices,
        public int $totalGaps,
        /** @var array<int, string> */
        public array $gaps
    ) {}

    /**
     * @param array<int, string> $gaps
     */
    public static function create(int $year, int $totalInvoices, int $totalGaps, array $gaps): self
    {
        return new self($year, $totalInvoices, $totalGaps, $gaps);
    }
}
