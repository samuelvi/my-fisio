<?php

declare(strict_types=1);

namespace App\Domain\Repository;

use App\Application\Dto\Invoice\InvoiceExportView;

interface InvoiceRepositoryInterface
{
    public function getInvoiceExportView(int $id): ?InvoiceExportView;

    public function countByYear(int $year): int;
}
