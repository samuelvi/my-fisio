<?php

declare(strict_types=1);

namespace App\Domain\Event;

use App\Domain\Entity\Customer;
use Symfony\Contracts\EventDispatcher\Event;

/**
 * Event dispatched when a customer is updated
 */
class CustomerUpdatedEvent extends Event
{
    public const NAME = 'customer.updated';

    public function __construct(
        private Customer $customer,
        private array $changes,
        private ?array $metadata = null
    ) {
    }

    public function getCustomer(): Customer
    {
        return $this->customer;
    }

    public function getChanges(): array
    {
        return $this->changes;
    }

    public function getMetadata(): ?array
    {
        return $this->metadata;
    }
}
