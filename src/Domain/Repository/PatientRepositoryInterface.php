<?php

declare(strict_types=1);

namespace App\Domain\Repository;

interface PatientRepositoryInterface
{
    public function countAll(): int;
}
