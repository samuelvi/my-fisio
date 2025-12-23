<?php

namespace App\Tests\Factory;

use App\Domain\Entity\Record;
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
            'createdAt' => \DateTimeImmutable::createFromMutable(self::faker()->dateTimeBetween('-1 year', 'now')),
        ];
    }

    #[Override]
    protected function initialize(): static
    {
        return $this
            ->instantiateWith(function(): Record {
                return Record::create();
            })
        ;
    }
}
