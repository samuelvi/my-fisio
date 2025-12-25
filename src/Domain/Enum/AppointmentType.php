<?php

declare(strict_types=1);

namespace App\Domain\Enum;

enum AppointmentType: string
{
    case APPOINTMENT = 'appointment';
    case OTHER = 'other';
}
