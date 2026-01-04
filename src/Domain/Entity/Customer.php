<?php

declare(strict_types=1);

namespace App\Domain\Entity;

use App\Domain\Event\Customer\CustomerCreatedEvent;
use App\Domain\Event\Customer\CustomerUpdatedEvent;
use App\Domain\Model\AggregateRoot;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
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
    use AggregateRoot;

    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(type: Types::INTEGER)]
    public ?int $id = null;

    #[ORM\Column(type: Types::STRING, length: 100, nullable: false)]
    #[Assert\NotBlank]
    public string $firstName;

    #[ORM\Column(type: Types::STRING, length: 100, nullable: false)]
    #[Assert\NotBlank]
    public string $lastName;

    #[ORM\Column(type: Types::STRING, length: 255, nullable: true)]
    public ?string $fullName = null;

    #[ORM\Column(type: Types::STRING, length: 20, nullable: false, unique: true)]
    #[Assert\NotBlank]
    public string $taxId; // DNI/NIF/CIF for billing

    #[ORM\Column(type: Types::STRING, length: 180, nullable: true)]
    public ?string $email = null;

    #[ORM\Column(type: Types::STRING, length: 50, nullable: true)]
    public ?string $phone = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Assert\NotBlank]
    public ?string $billingAddress = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: false)]
    public DateTimeInterface $createdAt;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
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

    public function update(
        string $firstName,
        string $lastName,
        string $taxId,
        ?string $email = null,
        ?string $phone = null,
        ?string $billingAddress = null,
    ): void {
        $changes = [];
        $fields = [
            'firstName' => $firstName,
            'lastName' => $lastName,
            'taxId' => $taxId,
            'email' => $email,
            'phone' => $phone,
            'billingAddress' => $billingAddress,
        ];

        foreach ($fields as $field => $newValue) {
            $oldValue = $this->$field;
            if ($oldValue !== $newValue) {
                $changes[$field] = ['before' => $oldValue, 'after' => $newValue];
                $this->$field = $newValue;
            }
        }

        $this->updateFullName();
        $this->updateTimestamp();

        if (!empty($changes)) {
            $this->recordEvent(new CustomerUpdatedEvent((string) $this->id, [
                'changes' => $changes,
                'updatedAt' => (new \DateTimeImmutable())->format('Y-m-d H:i:s'),
            ]));
        }
    }

    public function recordCreatedEvent(): void
    {
        $changes = [
            'firstName' => ['before' => null, 'after' => $this->firstName],
            'lastName' => ['before' => null, 'after' => $this->lastName],
            'taxId' => ['before' => null, 'after' => $this->taxId],
            'email' => ['before' => null, 'after' => $this->email],
            'phone' => ['before' => null, 'after' => $this->phone],
            'billingAddress' => ['before' => null, 'after' => $this->billingAddress],
            'createdAt' => ['before' => null, 'after' => $this->createdAt->format('Y-m-d H:i:s')],
        ];

        $this->recordEvent(new CustomerCreatedEvent((string) $this->id, [
            'changes' => $changes
        ]));
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
