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

    public function __construct()
    {
        $this->createdAt = new DateTimeImmutable();
    }
}
