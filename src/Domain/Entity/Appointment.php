<?php

declare(strict_types=1);

namespace App\Domain\Entity;

use App\Domain\Event\Appointment\AppointmentCreatedEvent;
use App\Domain\Event\Appointment\AppointmentDeletedEvent;
use App\Domain\Event\Appointment\AppointmentUpdatedEvent;
use App\Domain\Model\AggregateRoot;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'appointments')]
#[ORM\Index(columns: ['starts_at'], name: 'idx_appointments_starts_at')]
#[ORM\Index(columns: ['ends_at'], name: 'idx_appointments_ends_at')]
class Appointment
{
    use AggregateRoot;

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

    public function update(
        ?Patient $patient,
        DateTimeImmutable $startsAt,
        DateTimeImmutable $endsAt,
        ?string $title = null,
        ?bool $allDay = null,
        ?string $type = null,
        ?string $notes = null,
    ): void {
        $changes = [];
        
        $fields = [
            'title' => $title,
            'allDay' => $allDay,
            'type' => $type,
            'notes' => $notes,
        ];

        foreach ($fields as $field => $newValue) {
            $oldValue = $this->$field;
            if ($oldValue !== $newValue) {
                $changes[$field] = ['before' => $oldValue, 'after' => $newValue];
                $this->$field = $newValue;
            }
        }

        // Handle Patient
        if (($this->patient?->id) !== ($patient?->id)) {
             $changes['patient'] = [
                 'before' => $this->patient?->id,
                 'after' => $patient?->id
             ];
             $this->patient = $patient;
        }

        // Handle Dates
        if ($this->startsAt->format('c') !== $startsAt->format('c')) {
             $changes['startsAt'] = [
                 'before' => $this->startsAt->format('c'),
                 'after' => $startsAt->format('c')
             ];
             $this->startsAt = $startsAt;
        }
        
        if ($this->endsAt->format('c') !== $endsAt->format('c')) {
             $changes['endsAt'] = [
                 'before' => $this->endsAt->format('c'),
                 'after' => $endsAt->format('c')
             ];
             $this->endsAt = $endsAt;
        }

        $this->updatedAt = new DateTimeImmutable();

        if (!empty($changes)) {
            $this->recordEvent(new AppointmentUpdatedEvent((string) $this->id, [
                'changes' => $changes,
                'updatedAt' => $this->updatedAt->format('c'),
            ]));
        }
    }

    public function recordCreatedEvent(): void
    {
        $changes = [
            'patient' => ['before' => null, 'after' => $this->patient?->id],
            'userId' => ['before' => null, 'after' => $this->userId],
            'title' => ['before' => null, 'after' => $this->title],
            'startsAt' => ['before' => null, 'after' => $this->startsAt->format('c')],
            'endsAt' => ['before' => null, 'after' => $this->endsAt->format('c')],
            'type' => ['before' => null, 'after' => $this->type],
            'createdAt' => ['before' => null, 'after' => $this->createdAt->format('c')],
        ];
        
        $this->recordEvent(new AppointmentCreatedEvent((string) $this->id, [
            'changes' => $changes
        ]));
    }

    public function recordDeletedEvent(): void
    {
        $this->recordEvent(new AppointmentDeletedEvent((string) $this->id, [
            'deletedAt' => (new DateTimeImmutable())->format('c')
        ]));
    }

    public function updateTimestamp(): void
    {
        $this->updatedAt = new DateTimeImmutable();
    }
}
