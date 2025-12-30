<?php

declare(strict_types=1);

namespace App\Domain\Entity;

use DateTimeImmutable;
use DateTimeInterface;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity]
#[ORM\Table(name: 'records')]
class Record
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(type: Types::INTEGER)]
    #[Groups(['record:read', 'patient:read'])]
    public ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Patient::class, inversedBy: 'records')]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['record:read', 'record:write'])]
    public ?Patient $patient = null;

    #[ORM\Column(type: Types::DATE_IMMUTABLE, nullable: false)]
    #[Groups(['record:read'])]
    public DateTimeInterface $createdAt;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['record:read', 'record:write', 'patient:read'])]
    public ?string $consultationReason = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['record:read', 'record:write'])]
    public ?string $onset = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['record:read', 'record:write'])]
    public ?string $radiologyTests = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['record:read', 'record:write'])]
    public ?string $evolution = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['record:read', 'record:write'])]
    public ?string $currentSituation = null;

    #[ORM\Column(type: Types::BOOLEAN, nullable: true)]
    #[Groups(['record:read', 'record:write'])]
    public ?bool $sickLeave = null;

    #[ORM\Column(type: Types::TEXT, nullable: false)]
    #[Groups(['record:read', 'record:write', 'patient:read'])]
    public string $physiotherapyTreatment;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['record:read', 'record:write'])]
    public ?string $medicalTreatment = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['record:read', 'record:write'])]
    public ?string $homeTreatment = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['record:read', 'record:write'])]
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
}
