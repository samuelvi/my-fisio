<?php

declare(strict_types=1);

namespace App\Domain\Event\Patient;

use App\Domain\Event\DomainEventInterface;

class PatientUpdatedEvent implements DomainEventInterface
{
    public function __construct(
        private string $patientId,
        private array $payload
    ) {
    }

    public function getAggregateId(): string
    {
        return $this->patientId;
    }

    public function getOccurredOn(): \DateTimeImmutable
    {
        return new \DateTimeImmutable();
    }

    public function getEventName(): string
    {
        return 'PatientUpdated';
    }

    public function getPayload(): array
    {
        return $this->payload;
    }
}
