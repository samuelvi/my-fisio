<?php

declare(strict_types=1);

namespace App\Domain\Service;

use DateInterval;
use DatePeriod;
use DateTimeImmutable;

class EmptySlotGenerator
{
    public function __construct(
        private WeekGridBuilder $weekGridBuilder,
    ) {
    }

    /**
     * Generate empty slot data for a date range based on the week grid configuration.
     *
     * @return array<int, array{start: DateTimeImmutable, end: DateTimeImmutable}>
     */
    public function generateSlotsForDateRange(DateTimeImmutable $start, DateTimeImmutable $end): array
    {
        $weekGrid = $this->weekGridBuilder->buildWeekGrid();
        $slots = [];

        // Create a date period covering all days in the range
        $period = new DatePeriod(
            $start->setTime(0, 0, 0),
            new DateInterval('P1D'),
            $end->setTime(23, 59, 59)
        );

        foreach ($period as $date) {
            // Get ISO-8601 day of week (1=Monday, 7=Sunday), convert to 0-based (0=Monday)
            $dayOfWeek = ((int) $date->format('N')) - 1;

            // Skip if not a working day (Saturday=5, Sunday=6)
            if (!isset($weekGrid[$dayOfWeek])) {
                continue;
            }

            // Get slots for this day
            $daySlots = $weekGrid[$dayOfWeek];

            foreach ($daySlots as $startTime => $endTime) {
                [$startHour, $startMinute] = explode(':', $startTime);
                [$endHour, $endMinute] = explode(':', $endTime);

                $slotStart = $date->setTime((int) $startHour, (int) $startMinute, 0);
                $slotEnd = $date->setTime((int) $endHour, (int) $endMinute, 0);

                $slots[] = [
                    'start' => $slotStart,
                    'end' => $slotEnd,
                ];
            }
        }

        return $slots;
    }
}
