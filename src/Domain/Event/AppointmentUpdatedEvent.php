<?php

declare(strict_types=1);

namespace App\Domain\Event;

use App\Domain\Entity\Appointment;
use Symfony\Contracts\EventDispatcher\Event;

/**
 * Event dispatched when an appointment is updated
 * (content or dates modified)
 */
class AppointmentUpdatedEvent extends Event
{
    public const NAME = 'appointment.updated';

    public function __construct(
        private Appointment $appointment,
        private array $changes,
        private ?array $metadata = null
    ) {
    }

    public function getAppointment(): Appointment
    {
        return $this->appointment;
    }

    public function getChanges(): array
    {
        return $this->changes;
    }

    public function getMetadata(): ?array
    {
        return $this->metadata;
    }
}
