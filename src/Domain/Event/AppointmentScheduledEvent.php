<?php

declare(strict_types=1);

namespace App\Domain\Event;

use App\Domain\Entity\Appointment;
use Symfony\Contracts\EventDispatcher\Event;

/**
 * Event dispatched when an appointment is scheduled
 */
class AppointmentScheduledEvent extends Event
{
    public const NAME = 'appointment.scheduled';

    public function __construct(
        private Appointment $appointment,
        private ?array $metadata = null
    ) {
    }

    public function getAppointment(): Appointment
    {
        return $this->appointment;
    }

    public function getMetadata(): ?array
    {
        return $this->metadata;
    }
}
