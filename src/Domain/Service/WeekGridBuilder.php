<?php

declare(strict_types=1);

namespace App\Domain\Service;

class WeekGridBuilder
{
    public function __construct(
        private string $slotsMonday,
        private string $slotsTuesday,
        private string $slotsWednesday,
        private string $slotsThursday,
        private string $slotsFriday,
    ) {
    }

    /**
     * Build default weekly time slots for each working day.
     * Keys are day numbers (0=Monday, 1=Tuesday, ..., 4=Friday).
     * Values are arrays of start_time => end_time pairs.
     *
     * @return array<int, array<string, string>>
     */
    public function buildWeekGrid(): array
    {
        return [
            0 => $this->parseSlots($this->slotsMonday),    // Monday
            1 => $this->parseSlots($this->slotsTuesday),   // Tuesday
            2 => $this->parseSlots($this->slotsWednesday), // Wednesday
            3 => $this->parseSlots($this->slotsThursday),  // Thursday
            4 => $this->parseSlots($this->slotsFriday),    // Friday
        ];
    }

    /**
     * Parse slot configuration string into array.
     * Format: "09:00-10:00,10:00-11:00,11:00-12:00"
     *
     * @return array<string, string>
     */
    private function parseSlots(string $slotsConfig): array
    {
        if (empty($slotsConfig)) {
            return [];
        }

        $slots = [];
        $slotPairs = explode(',', $slotsConfig);

        foreach ($slotPairs as $slotPair) {
            $times = explode('-', trim($slotPair));
            if (count($times) === 2) {
                $slots[trim($times[0])] = trim($times[1]);
            }
        }

        return $slots;
    }
}
