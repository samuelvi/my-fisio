<?php

declare(strict_types=1);

namespace App\Tests\Integration\Infrastructure\Persistence\Doctrine\Repository;

use App\Domain\Entity\Appointment;
use App\Domain\Enum\AppointmentType;
use App\Infrastructure\Persistence\Doctrine\Repository\DoctrineAppointmentRepository;
use DateTimeImmutable;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Zenstruck\Foundry\Test\Factories;
use Zenstruck\Foundry\Test\ResetDatabase;

class DoctrineAppointmentRepositoryTest extends KernelTestCase
{
    use ResetDatabase;
    use Factories;

    private DoctrineAppointmentRepository $repository;

    protected function setUp(): void
    {
        self::bootKernel();
        $this->repository = self::getContainer()->get(DoctrineAppointmentRepository::class);
    }

    private function createAppointment(string $start, string $end): void
    {
        $appointment = Appointment::create(
            patient: null,
            userId: 1,
            title: 'Test',
            startsAt: new DateTimeImmutable($start),
            endsAt: new DateTimeImmutable($end),
            type: AppointmentType::APPOINTMENT->value
        );
        $this->repository->save($appointment);
    }

    public function testDetectsExactMatchConflict(): void
    {
        $this->createAppointment('2025-01-01 10:00:00', '2025-01-01 11:00:00');

        $exists = $this->repository->existsAppointmentsInDateRange(
            new DateTimeImmutable('2025-01-01 10:00:00'),
            new DateTimeImmutable('2025-01-01 11:00:00')
        );

        $this->assertTrue($exists, 'Should detect exact match');
    }

    public function testDetectsPartialOverlapStart(): void
    {
        // Existing: 10:00 - 11:00
        $this->createAppointment('2025-01-01 10:00:00', '2025-01-01 11:00:00');

        // New: 09:30 - 10:30 (overlaps first 30 mins of existing)
        $exists = $this->repository->existsAppointmentsInDateRange(
            new DateTimeImmutable('2025-01-01 09:30:00'),
            new DateTimeImmutable('2025-01-01 10:30:00')
        );

        $this->assertTrue($exists, 'Should detect overlap at start');
    }

    public function testDetectsPartialOverlapEnd(): void
    {
        // Existing: 10:00 - 11:00
        $this->createAppointment('2025-01-01 10:00:00', '2025-01-01 11:00:00');

        // New: 10:30 - 11:30 (overlaps last 30 mins of existing)
        $exists = $this->repository->existsAppointmentsInDateRange(
            new DateTimeImmutable('2025-01-01 10:30:00'),
            new DateTimeImmutable('2025-01-01 11:30:00')
        );

        $this->assertTrue($exists, 'Should detect overlap at end');
    }

    public function testDetectsEncapsulationByExisting(): void
    {
        // Existing: 10:00 - 12:00
        $this->createAppointment('2025-01-01 10:00:00', '2025-01-01 12:00:00');

        // New: 10:30 - 11:30 (fully inside existing)
        $exists = $this->repository->existsAppointmentsInDateRange(
            new DateTimeImmutable('2025-01-01 10:30:00'),
            new DateTimeImmutable('2025-01-01 11:30:00')
        );

        $this->assertTrue($exists, 'Should detect when new is inside existing');
    }

    public function testDetectsEncapsulationOfExisting(): void
    {
        // Existing: 10:30 - 11:00
        $this->createAppointment('2025-01-01 10:30:00', '2025-01-01 11:00:00');

        // New: 10:00 - 11:30 (fully covers existing)
        $exists = $this->repository->existsAppointmentsInDateRange(
            new DateTimeImmutable('2025-01-01 10:00:00'),
            new DateTimeImmutable('2025-01-01 11:30:00')
        );

        $this->assertTrue($exists, 'Should detect when new covers existing');
    }

    public function testIgnoresAdjacentAppointments(): void
    {
        // Existing: 10:00 - 11:00
        $this->createAppointment('2025-01-01 10:00:00', '2025-01-01 11:00:00');

        // New: 11:00 - 12:00 (Starts exactly when existing ends)
        $exists = $this->repository->existsAppointmentsInDateRange(
            new DateTimeImmutable('2025-01-01 11:00:00'),
            new DateTimeImmutable('2025-01-01 12:00:00')
        );

        $this->assertFalse($exists, 'Should NOT detect conflict for adjacent slots');
    }
}
