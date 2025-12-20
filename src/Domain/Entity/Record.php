<?php

declare(strict_types=1);

namespace App\Domain\Entity;

use DateTimeImmutable;
use DateTimeInterface;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'records')]
class Record
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(type: Types::INTEGER)]
    public ?int $id = null;

    #[ORM\Column(type: Types::INTEGER, nullable: false)]
    public int $patientId;

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: false)]
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
        int $patientId,
        string $physiotherapyTreatment
    ) {
        $this->patientId = $patientId;
        $this->physiotherapyTreatment = $physiotherapyTreatment;
        $this->createdAt = new DateTimeImmutable();
    }

    public static function create(
        int $patientId,
        string $physiotherapyTreatment
    ): self {
        return new self($patientId, $physiotherapyTreatment);
    }
}