<?php

declare(strict_types=1);

namespace App\Application\Dto\Invoice;

use DateTimeInterface;

final readonly class InvoiceExportView
{
    /**
     * @param InvoiceLineView[] $lines
     */
    public function __construct(
        public int $id,
        public string $number,
        public DateTimeInterface $date,
        public float $amount,
        public string $name,
        public ?string $taxId,
        public ?string $address,
        public ?string $phone,
        public ?string $email,
        public array $lines
    ) {}
}

final readonly class InvoiceLineView
{
    public function __construct(
        public int $id,
        public ?string $concept,
        public ?string $description,
        public int $quantity,
        public float $price,
        public float $amount
    ) {}
}
