<?php

declare(strict_types=1);

namespace App\Domain\Event;

use App\Domain\Entity\Appointment;
use Symfony\Contracts\EventDispatcher\Event;

/**
 * Event dispatched when an appointment is cancelled
 */
class AppointmentCancelledEvent extends Event
{
    public const NAME = 'appointment.cancelled';

    public function __construct(
        private Appointment $appointment,
        private string $reason,
        private ?array $metadata = null
    ) {
    }

    public function getAppointment(): Appointment
    {
        return $this->appointment;
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
