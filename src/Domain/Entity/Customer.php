<?php

declare(strict_types=1);

namespace App\Domain\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;
use DateTimeImmutable;
use DateTimeInterface;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'customers')]
#[ORM\HasLifecycleCallbacks]
#[ApiResource(
    operations: [
        new GetCollection(name: 'api_customers_get_collection'),
        new Get(name: 'api_customers_get'),
        new Post(name: 'api_customers_post'),
        new Put(name: 'api_customers_put'),
        new Delete(name: 'api_customers_delete'),
    ],
    normalizationContext: ['groups' => ['customer:read']],
    denormalizationContext: ['groups' => ['customer:write']],
    order: ['lastName' => 'ASC', 'firstName' => 'ASC'],
    filters: ['app.filter.customer_search']
)]
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

    #[ORM\Column(type: Types::STRING, length: 20, nullable: false)]
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
    ) {
        $this->firstName = $firstName;
        $this->lastName = $lastName;
        $this->taxId = $taxId;
        $this->createdAt = new DateTimeImmutable();
        $this->updateFullName();
    }

    public static function create(
        string $firstName,
        string $lastName,
        string $taxId,
    ): self {
        return new self($firstName, $lastName, $taxId);
    }

    #[ORM\PrePersist]
    #[ORM\PreUpdate]
    public function updateFullName(): void
    {
        $this->fullName = trim($this->firstName . ' ' . $this->lastName);
    }

    #[ORM\PreUpdate]
    public function updateTimestamp(): void
    {
        $this->updatedAt = new DateTimeImmutable();
    }
}
