<?php

declare(strict_types=1);

namespace App\Domain\Event\Record;

use App\Domain\Event\DomainEventInterface;
use DateTimeImmutable;

class RecordUpdatedEvent implements DomainEventInterface
{
    public function __construct(
        private string $recordId,
        private array $payload
    ) {
    }

    public function getAggregateId(): string
    {
        return $this->recordId;
    }

    public function getOccurredOn(): DateTimeImmutable
    {
        return new DateTimeImmutable();
    }

    public function getEventName(): string
    {
        return 'RecordUpdated';
    }

    public function getPayload(): array
    {
        return $this->payload;
    }
}
