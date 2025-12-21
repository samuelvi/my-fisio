<?php

declare(strict_types=1);

namespace App\Domain\Entity;

use DateTimeImmutable;
use DateTimeInterface;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'appointments')]
#[ORM\HasLifecycleCallbacks]
class Appointment
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(type: 'integer')]
    public ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Patient::class)]
    #[ORM\JoinColumn(nullable: false)]
    public Patient $patient;

    #[ORM\Column(type: 'integer', nullable: false)]
    public int $userId; // The therapist/physio

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    public ?string $title = null;

    #[ORM\Column(type: 'boolean', nullable: true)]
    public ?bool $allDay = null;

    #[ORM\Column(type: 'datetimetz_immutable', nullable: false)]
    public \DateTimeImmutable $startsAt;

    #[ORM\Column(type: 'datetimetz_immutable', nullable: false)]
    public \DateTimeImmutable $endsAt;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    public ?string $url = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    public ?string $className = null;

    #[ORM\Column(type: 'boolean', nullable: true)]
    public ?bool $editable = null;

    #[ORM\Column(type: 'boolean', nullable: true)]
    public ?bool $startEditable = null;

    #[ORM\Column(type: 'boolean', nullable: true)]
    public ?bool $durationEditable = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    public ?string $rendering = null;

    #[ORM\Column(type: 'boolean', nullable: true)]
    public ?bool $overlap = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    public ?int $constraintId = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    public ?string $source = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    public ?string $color = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    public ?string $backgroundColor = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    public ?string $textColor = null;

    #[ORM\Column(type: 'json', nullable: true)]
    public ?array $customFields = null;

    #[ORM\Column(type: 'text', nullable: true)]
    public ?string $notes = null;

    #[ORM\Column(type: 'datetimetz_immutable', nullable: false)]
    public \DateTimeImmutable $createdAt;

    #[ORM\Column(type: 'datetimetz_immutable', nullable: true)]
    public ?\DateTimeImmutable $updatedAt = null;

    private function __construct(
        Patient $patient,
        int $userId,
        \DateTimeImmutable $startsAt,
        \DateTimeImmutable $endsAt
    ) {
        $this->patient = $patient;
        $this->userId = $userId;
        $this->startsAt = $startsAt;
        $this->endsAt = $endsAt;
        $this->createdAt = new \DateTimeImmutable();
    }

    public static function create(
        Patient $patient,
        int $userId,
        \DateTimeImmutable $startsAt,
        \DateTimeImmutable $endsAt
    ): self {
        return new self($patient, $userId, $startsAt, $endsAt);
    }

    #[ORM\PreUpdate]
    public function updateTimestamp(): void
    {
        $this->updatedAt = new DateTimeImmutable();
    }
}
