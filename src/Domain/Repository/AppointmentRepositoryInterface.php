<?php

declare(strict_types=1);

namespace App\Domain\Repository;

use App\Domain\Entity\Appointment;
use App\Domain\Enum\AppointmentType;
use DateTimeInterface;

interface AppointmentRepositoryInterface
{
    public function countByDateAndType(DateTimeInterface $date, AppointmentType $type): int;

    public function save(Appointment $appointment): void;
}
