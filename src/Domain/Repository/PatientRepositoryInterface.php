<?php

declare(strict_types=1);

namespace App\Domain\Repository;

interface PatientRepositoryInterface
{
    public function countAll(): int;

    /**
     * Find patient data for invoice pre-fill.
     * Returns array with: fullName, taxId, email, phone, address
     * Returns null if patient not found.
     */
    public function findForInvoicePrefill(int $id): ?array;
}
