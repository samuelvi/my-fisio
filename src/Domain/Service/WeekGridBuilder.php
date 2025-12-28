<?php

declare(strict_types=1);

namespace App\Domain\Service;

class WeekGridBuilder
{
    /**
     * Build default weekly time slots for each working day.
     * Keys are day numbers (0=Monday, 1=Tuesday, ..., 4=Friday).
     * Values are arrays of start_time => end_time pairs.
     *
     * @return array<int, array<string, string>>
     */
    public static function buildWeekGrid(): array
    {
        return [
            0 => [ // Monday
                '09:00' => '10:00',
                '10:00' => '11:00',
                '11:00' => '12:00',
                '12:00' => '13:00',
                '14:00' => '15:00',
                '15:00' => '16:00',
            ],
            1 => [ // Tuesday
                '09:00' => '10:00',
                '10:00' => '11:00',
                '11:00' => '12:00',
                '15:00' => '16:00',
                '16:00' => '17:00',
            ],
            2 => [ // Wednesday
                '09:00' => '10:00',
                '10:00' => '11:00',
                '11:00' => '12:00',
                '12:00' => '13:00',
                '14:00' => '15:00',
                '15:00' => '16:00',
                '16:00' => '17:00',
            ],
            3 => [ // Thursday
                '09:00' => '10:00',
                '10:00' => '11:00',
                '11:00' => '12:00',
                '15:00' => '16:00',
            ],
            4 => [ // Friday
                '09:00' => '10:00',
                '10:00' => '11:00',
                '11:00' => '12:00',
                '12:00' => '13:00',
                '14:00' => '15:00',
                '15:00' => '16:00',
                '16:00' => '17:00',
            ],
        ];
    }
}
