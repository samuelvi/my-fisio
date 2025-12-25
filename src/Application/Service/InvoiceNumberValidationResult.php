<?php

declare(strict_types=1);

namespace App\Application\Service;

final readonly class InvoiceNumberValidationResult
{
    private function __construct(
        public bool $isValid,
        public ?string $reason
    ) {}

    public static function valid(): self
    {
        return new self(true, null);
    }

    public static function invalid(string $reason): self
    {
        return new self(false, $reason);
    }
}
