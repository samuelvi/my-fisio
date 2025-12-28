<?php

declare(strict_types=1);

namespace App\Domain\Factory;

use App\Domain\Entity\Appointment;
use App\Domain\Entity\Patient;
use DateTimeImmutable;

class AppointmentFactory
{
    /**
     * Create an empty appointment slot.
     */
    public function createEmptySlot(
        DateTimeImmutable $startsAt,
        DateTimeImmutable $endsAt,
        int $userId
    ): Appointment {
        $appointment = Appointment::create(
            patient: null,
            userId: $userId,
            startsAt: $startsAt,
            endsAt: $endsAt
        );

        $appointment->type = null;
        $appointment->title = null;
        $appointment->notes = null;
        $appointment->allDay = false;

        return $appointment;
    }
}
