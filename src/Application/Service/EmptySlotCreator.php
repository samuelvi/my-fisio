<?php

declare(strict_types=1);

namespace App\Application\Service;

use App\Domain\Factory\AppointmentFactory;
use App\Domain\Repository\AppointmentRepositoryInterface;
use App\Domain\Service\EmptySlotGenerator;
use DateTimeImmutable;

class EmptySlotCreator
{
    public function __construct(
        private EmptySlotGenerator $slotGenerator,
        private AppointmentFactory $appointmentFactory,
        private AppointmentRepositoryInterface $appointmentRepository,
    ) {
    }

    /**
     * Create empty appointment slots for a date range if no appointments exist.
     * Returns the number of slots generated.
     */
    public function createEmptySlotsIfNeeded(
        DateTimeImmutable $start,
        DateTimeImmutable $end,
        int $userId = 1
    ): int {
        // Generate all slots for the date range
        $slots = $this->slotGenerator->generateSlotsForDateRange($start, $end);

        // Create and persist empty appointments for each slot
        foreach ($slots as $slot) {
            $appointment = $this->appointmentFactory->createEmptySlot(
                startsAt: $slot['start'],
                endsAt: $slot['end'],
                userId: $userId
            );

            $this->appointmentRepository->save($appointment);
        }

        return count($slots);
    }
}
