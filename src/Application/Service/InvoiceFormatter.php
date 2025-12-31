<?php

declare(strict_types=1);

namespace App\Application\Service;

/**
 * Service to format invoice numbers with prefix
 */
final class InvoiceFormatter
{
    public function __construct(
        private readonly string $invoicePrefix
    ) {
    }

    /**
     * Format invoice number with prefix (e.g., "2025000001" -> "F2025000001")
     */
    public function formatNumber(string $number): string
    {
        return $this->invoicePrefix . $number;
    }

    /**
     * Remove prefix from invoice number (e.g., "F2025000001" -> "2025000001")
     */
    public function stripPrefix(string $formattedNumber): string
    {
        if (str_starts_with($formattedNumber, $this->invoicePrefix)) {
            return substr($formattedNumber, strlen($this->invoicePrefix));
        }

        return $formattedNumber;
    }

    /**
     * Get the invoice prefix
     */
    public function getPrefix(): string
    {
        return $this->invoicePrefix;
    }
}
