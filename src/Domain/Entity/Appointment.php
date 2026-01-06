<?php

declare(strict_types=1);

namespace App\Domain\Entity;

use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'appointments')]
#[ORM\Index(columns: ['starts_at'], name: 'idx_appointments_starts_at')]
#[ORM\Index(columns: ['ends_at'], name: 'idx_appointments_ends_at')]
class Appointment
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(type: 'integer')]
    public ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Patient::class)]
    #[ORM\JoinColumn(nullable: true)]
    public ?Patient $patient = null;

    #[ORM\Column(type: 'integer', nullable: false)]
    public int $userId; // The therapist/physio

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    public ?string $title = null;

    #[ORM\Column(type: 'boolean', nullable: true)]
    public ?bool $allDay = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: false)]
    public DateTimeImmutable $startsAt;

    #[ORM\Column(type: 'datetime_immutable', nullable: false)]
    public DateTimeImmutable $endsAt;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    public ?string $type = null;

    #[ORM\Column(type: 'text', nullable: true)]
    public ?string $notes = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: false)]
    public DateTimeImmutable $createdAt;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    public ?DateTimeImmutable $updatedAt = null;

    private function __construct(
        ?Patient $patient,
        int $userId,
        DateTimeImmutable $startsAt,
        DateTimeImmutable $endsAt,
        ?string $title = null,
        ?bool $allDay = null,
        ?string $type = null,
        ?string $notes = null,
    ) {
        $this->patient = $patient;
        $this->userId = $userId;
        $this->startsAt = $startsAt;
        $this->endsAt = $endsAt;
        $this->title = $title;
        $this->allDay = $allDay;
        $this->type = $type;
        $this->notes = $notes;
        $this->createdAt = new DateTimeImmutable();
    }

    public static function create(
        ?Patient $patient,
        int $userId,
        DateTimeImmutable $startsAt,
        DateTimeImmutable $endsAt,
        ?string $title = null,
        ?bool $allDay = null,
        ?string $type = null,
        ?string $notes = null,
    ): self {
        return new self($patient, $userId, $startsAt, $endsAt, $title, $allDay, $type, $notes);
    }

    public function updateTimestamp(): void
    {
        $this->updatedAt = new DateTimeImmutable();
    }
}
