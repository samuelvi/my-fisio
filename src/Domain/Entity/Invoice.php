<?php

declare(strict_types=1);

namespace App\Domain\Entity;

use DateTimeImmutable;
use DateTimeInterface;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Doctrine\Orm\Filter\DateFilter;
use ApiPlatform\Doctrine\Orm\Filter\OrderFilter;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use App\Infrastructure\Api\State\Processor\InvoiceCreateProcessor;
use App\Infrastructure\Api\Resource\InvoiceInput;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity]
#[ORM\Table(name: 'invoices')]
#[ApiResource(
    operations: [
        new GetCollection(),
        new Get(),
        new Post(processor: InvoiceCreateProcessor::class, input: InvoiceInput::class)
    ],
    normalizationContext: ['groups' => ['invoice:read']],
    denormalizationContext: ['groups' => ['invoice:write']],
    order: ['date' => 'DESC', 'number' => 'DESC']
)]
#[ApiFilter(SearchFilter::class, properties: [
    'name' => 'partial',
    'taxId' => 'exact',
    'customer.firstName' => 'partial',
    'customer.lastName' => 'partial'
])]
#[ApiFilter(DateFilter::class, properties: ['date'])]
#[ApiFilter(OrderFilter::class, properties: ['date', 'createdAt', 'amount'], arguments: ['orderParameterName' => 'order'])]
class Invoice
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(type: Types::INTEGER)]
    #[Groups(['invoice:read'])]
    public ?int $id = null;

    #[ORM\Column(type: Types::STRING, length: 20, nullable: false)]
    #[Groups(['invoice:read', 'invoice:write'])]
    public string $number;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: false)]
    #[Groups(['invoice:read', 'invoice:write'])]
    public DateTimeInterface $date;

    #[ORM\Column(type: Types::FLOAT, nullable: false)]
    #[Groups(['invoice:read', 'invoice:write'])]
    public float $amount;

    #[ORM\Column(type: Types::STRING, length: 50, nullable: false)]
    #[Groups(['invoice:read', 'invoice:write'])]
    public string $name;

    #[ORM\Column(type: Types::STRING, length: 50, nullable: true)]
    #[Groups(['invoice:read', 'invoice:write'])]
    public ?string $phone = null;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    #[Groups(['invoice:read', 'invoice:write'])]
    public ?string $address = null;

    #[ORM\Column(type: Types::STRING, length: 100, nullable: true)]
    #[Groups(['invoice:read', 'invoice:write'])]
    public ?string $email = null;

    #[ORM\Column(type: Types::STRING, length: 15, nullable: true)]
    #[Groups(['invoice:read', 'invoice:write'])]
    public ?string $taxId = null;

    #[ORM\ManyToOne(targetEntity: Customer::class)]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['invoice:read', 'invoice:write'])]
    public ?Customer $customer = null;

    /**
     * @var Collection<int, InvoiceLine>
     */
    #[ORM\OneToMany(mappedBy: 'invoice', targetEntity: InvoiceLine::class, cascade: ['persist', 'remove'])]
    #[Groups(['invoice:read'])]
    public Collection $lines;

    #[ORM\Column(type: Types::DATE_IMMUTABLE, nullable: false)]
    #[Groups(['invoice:read'])]
    public DateTimeInterface $createdAt;

    private function __construct()
    {
        $this->number = '';
        $this->amount = 0.0;
        $this->name = '';
        $this->date = new DateTimeImmutable();
        $this->createdAt = new DateTimeImmutable();
        $this->lines = new ArrayCollection();
    }

    public static function create(string $name): self
    {
        $invoice = new self();
        $invoice->name = $name;
        return $invoice;
    }
}
