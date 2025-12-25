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
            ->afterInstantiate(function(Record $record, array $attributes): void {
                if (isset($attributes['patient'])) $record->patient = $attributes['patient'];
                if (isset($attributes['physiotherapyTreatment'])) $record->physiotherapyTreatment = $attributes['physiotherapyTreatment'];
                if (isset($attributes['consultationReason'])) $record->consultationReason = $attributes['consultationReason'];
                if (isset($attributes['onset'])) $record->onset = $attributes['onset'];
                if (isset($attributes['radiologyTests'])) $record->radiologyTests = $attributes['radiologyTests'];
                if (isset($attributes['evolution'])) $record->evolution = $attributes['evolution'];
                if (isset($attributes['currentSituation'])) $record->currentSituation = $attributes['currentSituation'];
                if (isset($attributes['sickLeave'])) $record->sickLeave = $attributes['sickLeave'];
                if (isset($attributes['medicalTreatment'])) $record->medicalTreatment = $attributes['medicalTreatment'];
                if (isset($attributes['homeTreatment'])) $record->homeTreatment = $attributes['homeTreatment'];
                if (isset($attributes['notes'])) $record->notes = $attributes['notes'];
                if (isset($attributes['createdAt'])) $record->createdAt = $attributes['createdAt'];
            })
        ;
    }
}
