<?php

declare(strict_types=1);

namespace App\Domain\Event\Invoice;

use App\Domain\Event\DomainEventInterface;
use DateTimeImmutable;

class InvoiceUpdatedEvent implements DomainEventInterface
{
    public function __construct(
        private string $invoiceId,
        private array $payload
    ) {
    }

    public function getAggregateId(): string
    {
        return $this->invoiceId;
    }

    public function getOccurredOn(): DateTimeImmutable
    {
        return new DateTimeImmutable();
    }

    public function getEventName(): string
    {
        return 'InvoiceUpdated';
    }

    public function getPayload(): array
    {
        return $this->payload;
    }
}
