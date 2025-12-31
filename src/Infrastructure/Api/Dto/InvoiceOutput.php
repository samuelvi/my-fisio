<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\Dto;

/**
 * Output DTO for Invoice API responses with formatted number
 */
final class InvoiceOutput
{
    public int $id;
    public string $number;
    public string $formattedNumber;
    public string $date;
    public string $fullName;
    public string $taxId;
    public ?string $address = null;
    public ?string $phone = null;
    public ?string $email = null;
    public float $amount;
    public ?string $createdAt = null;
    public array $lines = [];
}
