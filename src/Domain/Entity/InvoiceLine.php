<?php

declare(strict_types=1);

namespace App\Domain\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'invoice_lines')]
class InvoiceLine
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(type: Types::INTEGER)]
    public ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Invoice::class, inversedBy: 'lines')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    public ?Invoice $invoice = null;

    #[ORM\Column(type: Types::STRING, length: 255, nullable: true)]
    public ?string $concept = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    public ?string $description = null;

    #[ORM\Column(type: Types::INTEGER, nullable: false)]
    public int $quantity;

    #[ORM\Column(type: Types::FLOAT, nullable: false)]
    public float $price;

    #[ORM\Column(type: Types::FLOAT, nullable: false)]
    public float $amount; // Total for this line (price * quantity)

    private function __construct(Invoice $invoice, int $quantity, float $price, float $amount)
    {
        $this->invoice = $invoice;
        $this->quantity = $quantity;
        $this->price = $price;
        $this->amount = $amount;
    }

    public static function create(Invoice $invoice, int $quantity, float $price, float $amount): self
    {
        return new self($invoice, $quantity, $price, $amount);
    }
}
