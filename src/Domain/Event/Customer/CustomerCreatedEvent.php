<?php

declare(strict_types=1);

namespace App\Domain\Event\Customer;

use App\Domain\Event\DomainEventInterface;

class CustomerCreatedEvent implements DomainEventInterface
{
    public function __construct(
        private string $customerId,
        private array $payload
    ) {
    }

    public function getAggregateId(): string
    {
        return $this->customerId;
    }

    public function getOccurredOn(): \DateTimeImmutable
    {
        return new \DateTimeImmutable();
    }

    public function getEventName(): string
    {
        return 'CustomerCreated';
    }

    public function getPayload(): array
    {
        return $this->payload;
    }
}
