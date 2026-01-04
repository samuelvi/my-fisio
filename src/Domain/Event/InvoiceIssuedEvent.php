<?php

declare(strict_types=1);

namespace App\Domain\Event;

use App\Domain\Entity\Invoice;
use Symfony\Contracts\EventDispatcher\Event;

/**
 * Event dispatched when an invoice is issued
 */
class InvoiceIssuedEvent extends Event
{
    public const NAME = 'invoice.issued';

    public function __construct(
        private Invoice $invoice,
        private ?array $metadata = null
    ) {
    }

    public function getInvoice(): Invoice
    {
        return $this->invoice;
    }

    public function getMetadata(): ?array
    {
        return $this->metadata;
    }
}
