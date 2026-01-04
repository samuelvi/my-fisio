<?php

declare(strict_types=1);

namespace App\Domain\Event;

use App\Domain\Entity\Invoice;
use Symfony\Contracts\EventDispatcher\Event;

/**
 * Event dispatched when an invoice is cancelled
 */
class InvoiceCancelledEvent extends Event
{
    public const NAME = 'invoice.cancelled';

    public function __construct(
        private Invoice $invoice,
        private string $reason,
        private ?array $metadata = null
    ) {
    }

    public function getInvoice(): Invoice
    {
        return $this->invoice;
    }

    public function getReason(): string
    {
        return $this->reason;
    }

    public function getMetadata(): ?array
    {
        return $this->metadata;
    }
}
