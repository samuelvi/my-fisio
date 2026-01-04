<?php

declare(strict_types=1);

namespace App\Domain\Entity;

use DateTimeImmutable;
use DateTimeInterface;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'invoices')]
class Invoice
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(type: Types::INTEGER)]
    public ?int $id = null;

    #[ORM\Column(type: Types::STRING, length: 20, nullable: false)]
    public string $number;

    /**
     * Formatted number with prefix (not stored in database)
     */
    public ?string $formattedNumber = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: false)]
    public DateTimeInterface $date;

    #[ORM\Column(type: Types::FLOAT, nullable: false)]
    public float $amount;

    #[ORM\Column(type: Types::STRING, length: 255, nullable: false, name: 'full_name')]
    public string $fullName;

    #[ORM\Column(type: Types::STRING, length: 50, nullable: true)]
    public ?string $phone = null;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    public ?string $address = null;

    #[ORM\Column(type: Types::STRING, length: 100, nullable: true)]
    public ?string $email = null;

    #[ORM\Column(type: Types::STRING, length: 15, nullable: true)]
    public ?string $taxId = null;

    #[ORM\ManyToOne(targetEntity: Customer::class)]
    #[ORM\JoinColumn(nullable: true)]
    public ?Customer $customer = null;

    /**
     * @var Collection<int, InvoiceLine>
     */
    #[ORM\OneToMany(mappedBy: 'invoice', targetEntity: InvoiceLine::class, cascade: ['persist', 'remove'])]
    public Collection $lines;

    #[ORM\Column(type: Types::DATE_IMMUTABLE, nullable: false)]
    public DateTimeInterface $createdAt;

    private function __construct(
        string $number,
        float $amount,
        string $fullName,
        DateTimeInterface $date,
        ?string $phone = null,
        ?string $address = null,
        ?string $email = null,
        ?string $taxId = null,
        ?Customer $customer = null,
    ) {
        $this->number = $number;
        $this->amount = $amount;
        $this->fullName = $fullName;
        $this->date = $date;
        $this->phone = $phone;
        $this->address = $address;
        $this->email = $email;
        $this->taxId = $taxId;
        $this->customer = $customer;
        $this->createdAt = new DateTimeImmutable();
        $this->lines = new ArrayCollection();
    }

    public static function create(
        string $number,
        float $amount,
        string $fullName,
        DateTimeInterface $date,
        ?string $phone = null,
        ?string $address = null,
        ?string $email = null,
        ?string $taxId = null,
        ?Customer $customer = null,
    ): self {
        return new self($number, $amount, $fullName, $date, $phone, $address, $email, $taxId, $customer);
    }
}