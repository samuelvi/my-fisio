<?php

declare(strict_types=1);

namespace App\Tests\Factory;

use App\Domain\Entity\Record;
use DateTimeImmutable;
use Zenstruck\Foundry\Persistence\PersistentObjectFactory;

/**
 * @extends PersistentObjectFactory<Record>
 */
final class RecordFactory extends PersistentObjectFactory
{
    /**
     * @see https://symfony.com/bundles/ZenstruckFoundryBundle/current/index.html#factories-as-services
     *
     * @todo inject services if required
     */
    public function __construct()
    {
    }

    #[Override]
    public static function class(): string
    {
        return Record::class;
    }

    /**
     * @see https://symfony.com/bundles/ZenstruckFoundryBundle/current/index.html#model-factories
     *
     * @todo add your default values here
     */
    protected function defaults(): array|callable
    {
        return [
            'patient' => PatientFactory::new(),
            'physiotherapyTreatment' => self::faker()->paragraphs(3, true),
            'consultationReason' => self::faker()->sentence(),
            'onset' => self::faker()->sentence(),
            'radiologyTests' => self::faker()->sentence(),
            'evolution' => self::faker()->paragraphs(2, true),
            'currentSituation' => self::faker()->sentence(),
            'sickLeave' => self::faker()->boolean(),
            'medicalTreatment' => self::faker()->sentence(),
            'homeTreatment' => self::faker()->sentence(),
            'notes' => self::faker()->paragraph(),
            'createdAt' => DateTimeImmutable::createFromMutable(self::faker()->dateTimeBetween('-1 year', 'now')),
        ];
    }

    #[Override]
    protected function initialize(): static
    {
        return $this
            ->instantiateWith(function (array $attributes): Record {
                return Record::create(
                    $attributes['physiotherapyTreatment'],
                    $attributes['consultationReason'] ?? null,
                    $attributes['onset'] ?? null,
                    $attributes['radiologyTests'] ?? null,
                    $attributes['evolution'] ?? null,
                    $attributes['currentSituation'] ?? null,
                    $attributes['sickLeave'] ?? null,
                    $attributes['medicalTreatment'] ?? null,
                    $attributes['homeTreatment'] ?? null,
                    $attributes['notes'] ?? null
                );
            })
            ->afterInstantiate(function (Record $record, array $attributes): void {
                if (isset($attributes['patient'])) {
                    $record->patient = $attributes['patient'];
                }
                // createdAt is set in constructor but can be overridden
                if (isset($attributes['createdAt'])) {
                    $record->createdAt = $attributes['createdAt'];
                }
            })
        ;
    }
}
