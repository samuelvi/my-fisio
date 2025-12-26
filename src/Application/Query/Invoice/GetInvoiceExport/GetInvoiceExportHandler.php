<?php

declare(strict_types=1);

namespace App\Application\Query\Invoice\GetInvoiceExport;

use App\Application\Dto\Invoice\InvoiceExportView;
use App\Domain\Repository\InvoiceRepositoryInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'query.bus')]
final readonly class GetInvoiceExportHandler
{
    public function __construct(
        private InvoiceRepositoryInterface $invoiceRepository,
    ) {
    }

    public function __invoke(GetInvoiceExportQuery $query): ?InvoiceExportView
    {
        return $this->invoiceRepository->getInvoiceExportView($query->id);
    }
}
