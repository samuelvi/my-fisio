<?php

declare(strict_types=1);

namespace App\Domain\Repository;

use DateTimeInterface;

interface AppointmentRepositoryInterface
{
    public function countByDate(DateTimeInterface $date): int;
}
