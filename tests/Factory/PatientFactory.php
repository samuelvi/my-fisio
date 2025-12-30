<?php

declare(strict_types=1);

namespace App\Tests\Factory;

use App\Domain\Entity\Patient;
use App\Domain\Enum\PatientStatus;
use Zenstruck\Foundry\Persistence\PersistentObjectFactory;

/**
 * @extends PersistentObjectFactory<Patient>
 */
final class PatientFactory extends PersistentObjectFactory
{
    public function __construct()
    {
    }

    #[Override]
    public static function class(): string
    {
        return Patient::class;
    }

    #[Override]
    protected function defaults(): array|callable
    {
        return [
            'firstName' => self::faker()->firstName(),
            'lastName' => self::faker()->lastName(),
            'email' => self::faker()->unique()->safeEmail(),
            'phone' => self::faker()->phoneNumber(),
            'taxId' => self::faker()->regexify('[0-9]{8}[A-Z]'),
            'address' => self::faker()->address(),
            'status' => PatientStatus::ACTIVE,
        ];
    }

    #[Override]
    protected function initialize(): static
    {
        return $this
            ->instantiateWith(function (array $attributes): Patient {
                return Patient::create(
                    $attributes['firstName'],
                    $attributes['lastName'],
                    $attributes['dateOfBirth'] ?? null,
                    $attributes['taxId'] ?? null,
                    $attributes['phone'] ?? null,
                    $attributes['address'] ?? null,
                    $attributes['email'] ?? null,
                    $attributes['profession'] ?? null,
                    $attributes['sportsActivity'] ?? null,
                    $attributes['notes'] ?? null,
                    $attributes['rate'] ?? null,
                    $attributes['allergies'] ?? null,
                    $attributes['medication'] ?? null,
                    $attributes['systemicDiseases'] ?? null,
                    $attributes['surgeries'] ?? null,
                    $attributes['accidents'] ?? null,
                    $attributes['injuries'] ?? null,
                    $attributes['bruxism'] ?? null,
                    $attributes['insoles'] ?? null,
                    $attributes['others'] ?? null,
                    $attributes['status'] ?? PatientStatus::ACTIVE
                );
            })
            ->afterInstantiate(function (Patient $patient, array $attributes): void {
                if (isset($attributes['customer'])) {
                    $patient->customer = $attributes['customer'];
                }
                // createdAt is set in constructor but can be overridden
                if (isset($attributes['createdAt'])) {
                    $patient->createdAt = $attributes['createdAt'];
                }
            })
        ;
    }
}
