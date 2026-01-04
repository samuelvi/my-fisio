<?php

declare(strict_types=1);

namespace App\Domain\Repository;

use App\Domain\Entity\Customer;

interface CustomerRepositoryInterface
{
    public function get(int $id): Customer;

    public function findOneByTaxId(string $taxId): ?Customer;

    public function save(Customer $customer): void;

    public function delete(Customer $customer): void;
}
