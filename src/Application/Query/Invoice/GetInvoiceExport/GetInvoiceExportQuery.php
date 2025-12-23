<?php

declare(strict_types=1);

namespace App\Application\Query\Invoice\GetInvoiceExport;

final readonly class GetInvoiceExportQuery
{
    public function __construct(
        public int $id
    ) {}
}
