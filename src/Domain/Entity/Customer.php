<?php

declare(strict_types=1);

namespace App\Domain\Entity;

use DateTimeImmutable;
use DateTimeInterface;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'customers')]
#[ORM\HasLifecycleCallbacks]
class Customer
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(type: Types::INTEGER)]
    public ?int $id = null;

    #[ORM\Column(type: Types::STRING, length: 100, nullable: false)]
    public string $firstName;

    #[ORM\Column(type: Types::STRING, length: 100, nullable: false)]
    public string $lastName;

    #[ORM\Column(type: Types::STRING, length: 255, nullable: true)]
    public ?string $fullName = null;

    #[ORM\Column(type: Types::STRING, length: 20, nullable: false)]
    public string $taxId; // DNI/NIF/CIF for billing

    #[ORM\Column(type: Types::STRING, length: 180, nullable: true)]
    public ?string $email = null;

    #[ORM\Column(type: Types::STRING, length: 50, nullable: true)]
    public ?string $phone = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    public ?string $billingAddress = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: false)]
    public DateTimeInterface $createdAt;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    public ?DateTimeInterface $updatedAt = null;

    private function __construct(
        string $firstName,
        string $lastName,
        string $taxId,
    ) {
        $this->firstName = $firstName;
        $this->lastName = $lastName;
        $this->taxId = $taxId;
        $this->createdAt = new DateTimeImmutable();
    }

    public static function create(
        string $firstName,
        string $lastName,
        string $taxId,
    ): self {
        return new self($firstName, $lastName, $taxId);
    }

    #[ORM\PreUpdate]
    public function updateTimestamp(): void
    {
        $this->updatedAt = new DateTimeImmutable();
    }
}
