<?php

declare(strict_types=1);

namespace App\Tests\Factory;

use App\Domain\Entity\Customer;
use Zenstruck\Foundry\Persistence\PersistentProxyObjectFactory;

/**
 * @extends PersistentProxyObjectFactory<Customer>
 */
final class CustomerFactory extends PersistentProxyObjectFactory
{
    public static function class(): string
    {
        return Customer::class;
    }

    protected function defaults(): array
    {
        return [
            'firstName' => self::faker()->firstName(),
            'lastName' => self::faker()->lastName(),
            'taxId' => self::faker()->bothify('??########'),
            'billingAddress' => self::faker()->address(),
            'createdAt' => \DateTimeImmutable::createFromMutable(self::faker()->dateTime()),
        ];
    }

    protected function initialize(): static
    {
        return $this
            ->instantiateWith(function(array $attributes): Customer {
                return Customer::create(
                    $attributes['firstName'],
                    $attributes['lastName'],
                    $attributes['taxId']
                );
            });
    }
}
