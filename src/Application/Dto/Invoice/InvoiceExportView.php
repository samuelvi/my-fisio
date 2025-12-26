<?php

declare(strict_types=1);

namespace App\Application\Dto\Invoice;

use DateTimeInterface;

final readonly class InvoiceExportView
{
    /**
     * @param InvoiceLineView[] $lines
     */
    private function __construct(
        public int $id,
        public string $number,
        public DateTimeInterface $date,
        public float $amount,
        public string $name,
        public ?string $taxId,
        public ?string $address,
        public ?string $phone,
        public ?string $email,
        public array $lines,
    ) {
    }

    public static function create(
        int $id,
        string $number,
        DateTimeInterface $date,
        float $amount,
        string $name,
        ?string $taxId,
        ?string $address,
        ?string $phone,
        ?string $email,
        array $lines,
    ): self {
        return new self($id, $number, $date, $amount, $name, $taxId, $address, $phone, $email, $lines);
    }
}
