<?php

declare(strict_types=1);

namespace App\Domain\Entity;

use App\Domain\Enum\PatientStatus;
use DateTimeImmutable;
use DateTimeInterface;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity]
#[ORM\Table(name: 'patients')]
class Patient
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(type: Types::INTEGER)]
    #[Groups(['patient:read', 'record:read'])]
    public ?int $id = null;

    #[ORM\Column(type: Types::STRING, length: 150, nullable: false)]
    #[Groups(['patient:read'])]
    public string $fullName;

    #[ORM\Column(type: Types::STRING, length: 50, nullable: false)]
    #[Groups(['patient:read', 'patient:write', 'record:read'])]
    public string $firstName {
        set {
            $this->firstName = $value;
            $this->updateFullName();
        }
    }

    #[ORM\Column(type: Types::STRING, length: 100, nullable: false)]
    #[Groups(['patient:read', 'patient:write', 'record:read'])]
    public string $lastName {
        set {
            $this->lastName = $value;
            $this->updateFullName();
        }
    }

    #[ORM\Column(type: Types::DATE_IMMUTABLE, nullable: true)]
    #[Groups(['patient:read', 'patient:write'])]
    public ?DateTimeInterface $dateOfBirth = null;

    #[ORM\Column(type: Types::STRING, length: 15, nullable: true)]
    #[Groups(['patient:read', 'patient:write'])]
    public ?string $identityDocument = null;

    #[ORM\Column(type: Types::STRING, length: 50, nullable: true)]
    #[Groups(['patient:read', 'patient:write'])]
    public ?string $phone = null;

    #[ORM\Column(type: Types::DATE_IMMUTABLE, nullable: false)]
    #[Groups(['patient:read'])]
    public DateTimeInterface $createdAt;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    #[Groups(['patient:read', 'patient:write'])]
    public ?string $address = null;

    #[ORM\Column(type: Types::STRING, length: 100, nullable: true)]
    #[Groups(['patient:read', 'patient:write'])]
    public ?string $email = null;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    #[Groups(['patient:read', 'patient:write'])]
    public ?string $profession = null;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    #[Groups(['patient:read', 'patient:write'])]
    public ?string $sportsActivity = null;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    #[Groups(['patient:read', 'patient:write'])]
    public ?string $notes = null;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    #[Groups(['patient:read', 'patient:write'])]
    public ?string $rate = null;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    #[Groups(['patient:read', 'patient:write'])]
    public ?string $allergies = null;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    #[Groups(['patient:read', 'patient:write'])]
    public ?string $medication = null;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    #[Groups(['patient:read', 'patient:write'])]
    public ?string $systemicDiseases = null;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    #[Groups(['patient:read', 'patient:write'])]
    public ?string $surgeries = null;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    #[Groups(['patient:read', 'patient:write'])]
    public ?string $accidents = null;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    #[Groups(['patient:read', 'patient:write'])]
    public ?string $injuries = null;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    #[Groups(['patient:read', 'patient:write'])]
    public ?string $bruxism = null;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    #[Groups(['patient:read', 'patient:write'])]
    public ?string $insoles = null;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    #[Groups(['patient:read', 'patient:write'])]
    public ?string $others = null;

    #[ORM\Column(type: Types::STRING, length: 20, options: ['default' => 'active'], enumType: PatientStatus::class)]
    #[Groups(['patient:read', 'patient:write'])]
    public PatientStatus $status = PatientStatus::ACTIVE;

    /**
     * @var Collection<int, Record>
     */
    #[ORM\OneToMany(mappedBy: 'patient', targetEntity: Record::class, cascade: ['persist', 'remove'])]
    #[Groups(['patient:read'])]
    public Collection $records;

    private function __construct(string $firstName, string $lastName)
    {
        $this->firstName = $firstName;
        $this->lastName = $lastName;
        $this->updateFullName();
        $this->createdAt = new DateTimeImmutable();
        $this->records = new ArrayCollection();
    }

    public static function create(string $firstName, string $lastName): self
    {
        return new self($firstName, $lastName);
    }

    private function updateFullName(): void
    {
        $firstName = isset($this->firstName) ? $this->firstName : '';
        $lastName = isset($this->lastName) ? $this->lastName : '';
        $this->fullName = trim(sprintf('%s %s', $firstName, $lastName));
    }
}
