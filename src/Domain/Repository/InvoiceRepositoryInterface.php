<?php

declare(strict_types=1);

namespace App\Domain\Repository;

use App\Application\Dto\Invoice\InvoiceExportView;
use App\Domain\Entity\Invoice;

interface InvoiceRepositoryInterface
{
    public function get(int $id): Invoice;

    public function findLatestNumberForYear(int $year): ?string;
    public function getInvoiceExportView(int $id): ?InvoiceExportView;

    public function countByYear(int $year): int;

    /**
     * @return array<int, string>
     */
    public function getNumbersByYear(int $year): array;

    /**
     * @return array<int, string>
     */
    public function getNumbersByYearExcluding(int $year, int $excludeId): array;

    public function getByIdAsArray(int $id): ?array;

    public function searchAsArray(array $filters, int $page, int $limit): array;
}
