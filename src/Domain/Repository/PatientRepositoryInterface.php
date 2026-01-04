<?php

declare(strict_types=1);

namespace App\Domain\Repository;

interface PatientRepositoryInterface
{
    public function countAll(): int;

    public function get(int $id): \App\Domain\Entity\Patient;

    public function save(\App\Domain\Entity\Patient $patient): void;

    public function delete(\App\Domain\Entity\Patient $patient): void;

    /**
     * Find patient data for invoice pre-fill.
     * Returns array with: fullName, taxId, email, phone, address
     * Returns null if patient not found.
     */
    public function findForInvoicePrefill(int $id): ?array;
}
