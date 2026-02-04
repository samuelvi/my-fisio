<?php

declare(strict_types=1);

namespace App\Domain\Entity;

use App\Domain\Event\Invoice\InvoiceCreatedEvent;
use App\Domain\Event\Invoice\InvoiceUpdatedEvent;
use App\Domain\Model\AggregateRoot;
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
    use AggregateRoot;

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

    #[ORM\Column(type: Types::STRING, length: 3, nullable: false)]
    public string $currency = 'EUR';

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
        string $currency = 'EUR',
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
        $this->currency = $currency;
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
        string $currency = 'EUR',
        ?string $phone = null,
        ?string $address = null,
        ?string $email = null,
        ?string $taxId = null,
        ?Customer $customer = null,
    ): self {
        return new self($number, $amount, $fullName, $date, $currency, $phone, $address, $email, $taxId, $customer);
    }

    public function update(
        float $amount,
        string $fullName,
        DateTimeInterface $date,
        string $currency = 'EUR',
        ?string $phone = null,
        ?string $address = null,
        ?string $email = null,
        ?string $taxId = null,
        ?Customer $customer = null,
    ): void {
        $changes = [];

        $fields = [
            'amount' => $amount,
            'fullName' => $fullName,
            'currency' => $currency,
            'phone' => $phone,
            'address' => $address,
            'email' => $email,
            'taxId' => $taxId,
        ];

        foreach ($fields as $field => $newValue) {
            $oldValue = $this->$field;
            if ($oldValue !== $newValue) {
                $changes[$field] = ['before' => $oldValue, 'after' => $newValue];
                $this->$field = $newValue;
            }
        }

        if ($this->date->format('Y-m-d') !== $date->format('Y-m-d')) {
             $changes['date'] = ['before' => $this->date->format('Y-m-d'), 'after' => $date->format('Y-m-d')];
             $this->date = $date;
        }

        if (null !== $customer && ($this->customer?->id !== $customer->id)) {
            $changes['customer'] = ['before' => $this->customer?->id, 'after' => $customer->id];
            $this->customer = $customer;
        }

        if (!empty($changes)) {
            $this->recordEvent(new InvoiceUpdatedEvent((string) $this->id, [
                'changes' => $changes,
                'updatedAt' => (new DateTimeImmutable())->format('c'),
            ]));
        }
    }

    public function recordCreatedEvent(): void
    {
        $changes = [
            'number' => ['before' => null, 'after' => $this->number],
            'amount' => ['before' => null, 'after' => $this->amount],
            'customer' => ['before' => null, 'after' => $this->customer?->id],
            'createdAt' => ['before' => null, 'after' => $this->createdAt->format('c')],
        ];

        $this->recordEvent(new InvoiceCreatedEvent((string) $this->id, [
            'changes' => $changes
        ]));
    }
}