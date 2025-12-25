<?php

declare(strict_types=1);

namespace App\Tests\Application\Service;

use App\Application\Service\InvoiceNumberValidator;
use PHPUnit\Framework\TestCase;

final class InvoiceNumberValidatorTest extends TestCase
{
    public function testRejectsEmptyNumber(): void
    {
        $this->assertFalse(InvoiceNumberValidator::validate('', []));
    }

    public function testRejectsInvalidFormat(): void
    {
        $this->assertFalse(InvoiceNumberValidator::validate('ABC', []));
        $this->assertFalse(InvoiceNumberValidator::validate('2024001', []));
    }

    public function testAllowsNextNumberAfterLast(): void
    {
        $existing = ['2024000001', '2024000002'];
        $this->assertTrue(InvoiceNumberValidator::validate('2024000003', $existing));
    }

    public function testAllowsGapNumber(): void
    {
        $existing = ['2024000001', '2024000003'];
        $this->assertTrue(InvoiceNumberValidator::validate('2024000002', $existing));
    }

    public function testRejectsDuplicateNumber(): void
    {
        $existing = ['2024000001', '2024000002'];
        $this->assertFalse(InvoiceNumberValidator::validate('2024000002', $existing));
    }

    public function testRejectsNumberBeyondNext(): void
    {
        $existing = ['2024000001', '2024000002'];
        $this->assertFalse(InvoiceNumberValidator::validate('2024000004', $existing));
    }
}
