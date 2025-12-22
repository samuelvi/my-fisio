<?php

namespace App\Tests\Factory;

use App\Domain\Entity\Appointment;
use Zenstruck\Foundry\Persistence\PersistentProxyObjectFactory;

/**
 * @extends PersistentProxyObjectFactory<Appointment>
 */
final class AppointmentFactory extends PersistentProxyObjectFactory
{
    public function __construct()
    {
    }

    public static function class(): string
    {
        return Appointment::class;
    }

    protected function defaults(): array|callable
    {
        return [
            'patient' => PatientFactory::new(),
            'userId' => 1,
            'startsAt' => \DateTimeImmutable::createFromMutable(self::faker()->dateTimeBetween('now', '+1 month')),
            'endsAt' => \DateTimeImmutable::createFromMutable(self::faker()->dateTimeBetween('+1 month', '+2 months')),
            'createdAt' => \DateTimeImmutable::createFromMutable(self::faker()->dateTime()),
            'title' => self::faker()->sentence(),
            'type' => self::faker()->randomElement(['appointment', 'other']),
        ];
    }

    protected function initialize(): static
    {
        return $this->instantiateWith(function(array $attributes): Appointment {
            return Appointment::create(
                $attributes['patient'],
                $attributes['userId'],
                $attributes['startsAt'],
                $attributes['endsAt']
            );
        });
    }
}
