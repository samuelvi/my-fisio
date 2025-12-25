<?php

declare(strict_types=1);

namespace App\Application\Service;

final class InvoiceNumberValidator
{
    private function __construct() {}

    /**
     * @param array<int, string> $existingNumbers
     */
    public static function validate(string $number, array $existingNumbers): bool
    {
        return self::validateWithReason($number, $existingNumbers)->isValid;
    }

    /**
     * @param array<int, string> $existingNumbers
     */
    public static function validateWithReason(string $number, array $existingNumbers): InvoiceNumberValidationResult
    {
        if (trim($number) === '') {
            return InvoiceNumberValidationResult::invalid('invoice_number_required');
        }

        if (!preg_match('/^\d{10}$/', $number)) {
            return InvoiceNumberValidationResult::invalid('invoice_number_invalid_format');
        }

        $sequence = (int) substr($number, 4);
        if ($sequence <= 0) {
            return InvoiceNumberValidationResult::invalid('invoice_number_invalid_format');
        }

        $sequences = self::extractSequences($existingNumbers);
        if (in_array($sequence, $sequences, true)) {
            return InvoiceNumberValidationResult::invalid('invoice_number_duplicate');
        }

        $maxSequence = empty($sequences) ? 0 : max($sequences);
        if ($sequence === $maxSequence + 1) {
            return InvoiceNumberValidationResult::valid();
        }

        if ($sequence <= $maxSequence) {
            return InvoiceNumberValidationResult::valid();
        }

        return InvoiceNumberValidationResult::invalid('invoice_number_out_of_sequence');
    }

    /**
     * @param array<int, string> $existingNumbers
     * @return array<int, int>
     */
    private static function extractSequences(array $existingNumbers): array
    {
        $sequences = [];
        foreach ($existingNumbers as $existingNumber) {
            $existingNumber = trim($existingNumber);
            if ($existingNumber === '') {
                continue;
            }
            if (!preg_match('/^\d{10}$/', $existingNumber)) {
                continue;
            }
            $sequence = (int) substr($existingNumber, 4);
            if ($sequence > 0) {
                $sequences[] = $sequence;
            }
        }

        return array_values(array_unique($sequences));
    }
}
