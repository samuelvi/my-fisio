<?php

declare(strict_types=1);

namespace App\Domain\Entity;

use DateTimeImmutable;
use DateTimeInterface;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'patients')]
class Patient
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(type: Types::INTEGER)]
    public ?int $id = null;

    #[ORM\Column(type: Types::STRING, length: 50, nullable: false)]
    public string $firstName;

    #[ORM\Column(type: Types::STRING, length: 100, nullable: false)]
    public string $lastName;

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: true)]
    public ?DateTimeInterface $dateOfBirth = null;

    #[ORM\Column(type: Types::STRING, length: 15, nullable: true)]
    public ?string $identityDocument = null;

    #[ORM\Column(type: Types::STRING, length: 50, nullable: true)]
    public ?string $phone = null;

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: false)]
    public DateTimeInterface $createdAt;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    public ?string $address = null;

    #[ORM\Column(type: Types::STRING, length: 100, nullable: true)]
    public ?string $email = null;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    public ?string $profession = null;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    public ?string $sportsActivity = null;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    public ?string $notes = null;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    public ?string $rate = null;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    public ?string $allergies = null;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    public ?string $medication = null;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    public ?string $systemicDiseases = null;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    public ?string $surgeries = null;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    public ?string $accidents = null;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    public ?string $injuries = null;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    public ?string $bruxism = null;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    public ?string $insoles = null;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    public ?string $others = null;

    private function __construct(
        string $firstName,
        string $lastName
    ) {
        $this->firstName = $firstName;
        $this->lastName = $lastName;
        $this->createdAt = new DateTimeImmutable();
    }

    public static function create(
        string $firstName,
        string $lastName
    ): self {
        return new self($firstName, $lastName);
    }
}
