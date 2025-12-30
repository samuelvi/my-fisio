<?php

declare(strict_types=1);

namespace App\Domain\Entity;

use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;
use DateTimeImmutable;
use DateTimeInterface;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'customers')]
#[UniqueEntity('taxId', message: 'error_customer_tax_id_duplicate')]
class Customer
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(type: Types::INTEGER)]
    #[Groups(['customer:read', 'invoice:read'])]
    public ?int $id = null;

    #[ORM\Column(type: Types::STRING, length: 100, nullable: false)]
    #[Groups(['customer:read', 'customer:write', 'invoice:read'])]
    #[Assert\NotBlank]
    public string $firstName;

    #[ORM\Column(type: Types::STRING, length: 100, nullable: false)]
    #[Groups(['customer:read', 'customer:write', 'invoice:read'])]
    #[Assert\NotBlank]
    public string $lastName;

    #[ORM\Column(type: Types::STRING, length: 255, nullable: true)]
    #[Groups(['customer:read', 'customer:write', 'invoice:read'])]
    public ?string $fullName = null;

    #[ORM\Column(type: Types::STRING, length: 20, nullable: false, unique: true)]
    #[Groups(['customer:read', 'customer:write', 'invoice:read'])]
    #[Assert\NotBlank]
    public string $taxId; // DNI/NIF/CIF for billing

    #[ORM\Column(type: Types::STRING, length: 180, nullable: true)]
    #[Groups(['customer:read', 'customer:write', 'invoice:read'])]
    public ?string $email = null;

    #[ORM\Column(type: Types::STRING, length: 50, nullable: true)]
    #[Groups(['customer:read', 'customer:write', 'invoice:read'])]
    public ?string $phone = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['customer:read', 'customer:write', 'invoice:read'])]
    #[Assert\NotBlank]
    public ?string $billingAddress = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: false)]
    #[Groups(['customer:read'])]
    public DateTimeInterface $createdAt;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    #[Groups(['customer:read'])]
    public ?DateTimeInterface $updatedAt = null;

    private function __construct(
        string $firstName,
        string $lastName,
        string $taxId,
        ?string $email = null,
        ?string $phone = null,
        ?string $billingAddress = null,
    ) {
        $this->firstName = $firstName;
        $this->lastName = $lastName;
        $this->taxId = $taxId;
        $this->email = $email;
        $this->phone = $phone;
        $this->billingAddress = $billingAddress;
        $this->createdAt = new DateTimeImmutable();
        $this->updateFullName();
    }

    public static function create(
        string $firstName,
        string $lastName,
        string $taxId,
        ?string $email = null,
        ?string $phone = null,
        ?string $billingAddress = null,
    ): self {
        return new self(
            firstName: $firstName, 
            lastName: $lastName, 
            taxId: $taxId, 
            email: $email, 
            phone: $phone, 
            billingAddress: $billingAddress
        );
    }

    public static function createFromFullName(
        string $fullName,
        string $taxId,
        ?string $email = null,
        ?string $phone = null,
        ?string $billingAddress = null,
    ): self {
        $fullName = trim($fullName);
        $parts = explode(' ', $fullName);
        if (count($parts) === 1) {
            $firstName = $parts[0];
            $lastName = '';
        } else {
            $firstName = array_shift($parts);
            $lastName = implode(' ', $parts);
        }

        return self::create(
            firstName: $firstName,
            lastName: $lastName,
            taxId: $taxId,
            email: $email,
            phone: $phone,
            billingAddress: $billingAddress
        );
    }

    public function updateFullName(): void
    {
        $this->fullName = trim($this->firstName . ' ' . $this->lastName);
    }

    public function updateTimestamp(): void
    {
        $this->updatedAt = new DateTimeImmutable();
    }
}
