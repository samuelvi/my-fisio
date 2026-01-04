<?php

declare(strict_types=1);

namespace App\Application\Command\Customer;

class UpdateCustomerCommand
{
    public function __construct(
        public int $id,
        public string $firstName,
        public string $lastName,
        public string $taxId,
        public ?string $email = null,
        public ?string $phone = null,
        public ?string $billingAddress = null
    ) {
    }
}
