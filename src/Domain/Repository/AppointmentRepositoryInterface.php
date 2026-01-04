<?php

declare(strict_types=1);

namespace App\Domain\Repository;

use App\Domain\Entity\Appointment;
use App\Domain\Enum\AppointmentType;
use DateTimeInterface;

interface AppointmentRepositoryInterface
{
    public function get(int $id): Appointment;

    public function delete(Appointment $appointment): void;

    public function countByDateAndType(DateTimeInterface $date, AppointmentType $type): int;

    public function save(Appointment $appointment): void;

    public function countAppointmentsInDateRange(DateTimeInterface $start, DateTimeInterface $end): int;

    public function deleteEmptyGapsInDateRange(DateTimeInterface $start, DateTimeInterface $end): int;
}
