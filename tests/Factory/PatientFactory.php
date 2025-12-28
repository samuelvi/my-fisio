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
            ->instantiateWith(function (array $attributes) {
                // Assuming Patient::create() exists or we can use constructor if we change it.
                // Wait, let's check Patient.php again.
                return Patient::create($attributes['firstName'], $attributes['lastName']);
            })
            ->afterInstantiate(function (Patient $patient, array $attributes): void {
                if (isset($attributes['email'])) {
                    $patient->email = $attributes['email'];
                }
                if (isset($attributes['phone'])) {
                    $patient->phone = $attributes['phone'];
                }
                if (isset($attributes['status'])) {
                    $patient->status = $attributes['status'];
                }
            })
        ;
    }
}
