<?php

declare(strict_types=1);

namespace App\Domain\Entity;

use App\Domain\Event\Record\RecordCreatedEvent;
use App\Domain\Event\Record\RecordUpdatedEvent;
use App\Domain\Model\AggregateRoot;
use DateTimeImmutable;
use DateTimeInterface;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'records')]
class Record
{
    use AggregateRoot;

    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(type: Types::INTEGER)]
    public ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Patient::class, inversedBy: 'records')]
    #[ORM\JoinColumn(nullable: true)]
    public ?Patient $patient = null;

    #[ORM\Column(type: Types::DATE_IMMUTABLE, nullable: false)]
    public DateTimeInterface $createdAt;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    public ?string $consultationReason = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    public ?string $onset = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    public ?string $radiologyTests = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    public ?string $evolution = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    public ?string $currentSituation = null;

    #[ORM\Column(type: Types::BOOLEAN, nullable: true)]
    public ?bool $sickLeave = null;

    #[ORM\Column(type: Types::TEXT, nullable: false)]
    public string $physiotherapyTreatment;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    public ?string $medicalTreatment = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    public ?string $homeTreatment = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    public ?string $notes = null;

    private function __construct(
        string $physiotherapyTreatment,
        ?string $consultationReason = null,
        ?string $onset = null,
        ?string $radiologyTests = null,
        ?string $evolution = null,
        ?string $currentSituation = null,
        ?bool $sickLeave = null,
        ?string $medicalTreatment = null,
        ?string $homeTreatment = null,
        ?string $notes = null,
    ) {
        $this->createdAt = new DateTimeImmutable();
        $this->physiotherapyTreatment = $physiotherapyTreatment;
        $this->consultationReason = $consultationReason;
        $this->onset = $onset;
        $this->radiologyTests = $radiologyTests;
        $this->evolution = $evolution;
        $this->currentSituation = $currentSituation;
        $this->sickLeave = $sickLeave;
        $this->medicalTreatment = $medicalTreatment;
        $this->homeTreatment = $homeTreatment;
        $this->notes = $notes;
    }

    public static function create(
        string $physiotherapyTreatment,
        ?string $consultationReason = null,
        ?string $onset = null,
        ?string $radiologyTests = null,
        ?string $evolution = null,
        ?string $currentSituation = null,
        ?bool $sickLeave = null,
        ?string $medicalTreatment = null,
        ?string $homeTreatment = null,
        ?string $notes = null,
    ): self {
        return new self(
            $physiotherapyTreatment,
            $consultationReason,
            $onset,
            $radiologyTests,
            $evolution,
            $currentSituation,
            $sickLeave,
            $medicalTreatment,
            $homeTreatment,
            $notes
        );
    }

    public function update(
        string $physiotherapyTreatment,
        ?string $consultationReason = null,
        ?string $onset = null,
        ?string $radiologyTests = null,
        ?string $evolution = null,
        ?string $currentSituation = null,
        ?bool $sickLeave = null,
        ?string $medicalTreatment = null,
        ?string $homeTreatment = null,
        ?string $notes = null,
        ?Patient $patient = null
    ): void {
        $changes = [];

        $fields = [
            'physiotherapyTreatment' => $physiotherapyTreatment,
            'consultationReason' => $consultationReason,
            'onset' => $onset,
            'radiologyTests' => $radiologyTests,
            'evolution' => $evolution,
            'currentSituation' => $currentSituation,
            'sickLeave' => $sickLeave,
            'medicalTreatment' => $medicalTreatment,
            'homeTreatment' => $homeTreatment,
            'notes' => $notes,
        ];

        foreach ($fields as $field => $newValue) {
            $oldValue = $this->$field;
            if ($oldValue !== $newValue) {
                $changes[$field] = ['before' => $oldValue, 'after' => $newValue];
                $this->$field = $newValue;
            }
        }

        if (null !== $patient && ($this->patient?->id !== $patient->id)) {
            $changes['patient'] = ['before' => $this->patient?->id, 'after' => $patient->id];
            $this->patient = $patient;
        }

        if (!empty($changes)) {
            $this->recordEvent(new RecordUpdatedEvent((string) $this->id, [
                'changes' => $changes,
                'updatedAt' => (new DateTimeImmutable())->format('c'),
            ]));
        }
    }

    public function recordCreatedEvent(): void
    {
        $changes = [
            'patient' => ['before' => null, 'after' => $this->patient?->id],
            'createdAt' => ['before' => null, 'after' => $this->createdAt->format('c')],
            'physiotherapyTreatment' => ['before' => null, 'after' => $this->physiotherapyTreatment],
        ];

        $this->recordEvent(new RecordCreatedEvent((string) $this->id, [
            'changes' => $changes
        ]));
    }
}
