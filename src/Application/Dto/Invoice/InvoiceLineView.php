<?php

declare(strict_types=1);

namespace App\Application\Dto\Invoice;

final readonly class InvoiceLineView
{
    private function __construct(
        public int $id,
        public ?string $concept,
        public ?string $description,
        public int $quantity,
        public float $price,
        public float $amount
    ) {}

    public static function create(
        int $id,
        ?string $concept,
        ?string $description,
        int $quantity,
        float $price,
        float $amount
    ): self {
        return new self($id, $concept, $description, $quantity, $price, $amount);
    }
}
