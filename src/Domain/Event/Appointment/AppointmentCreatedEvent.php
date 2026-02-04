<?php

declare(strict_types=1);

namespace App\Domain\Event\Appointment;

use App\Domain\Event\DomainEventInterface;
use DateTimeImmutable;

class AppointmentCreatedEvent implements DomainEventInterface
{
    public function __construct(
        private string $appointmentId,
        private array $payload
    ) {
    }

    public function getAggregateId(): string
    {
        return $this->appointmentId;
    }

    public function getOccurredOn(): DateTimeImmutable
    {
        return new DateTimeImmutable();
    }

    public function getEventName(): string
    {
        return 'AppointmentCreated';
    }

    public function getPayload(): array
    {
        return $this->payload;
    }
}
