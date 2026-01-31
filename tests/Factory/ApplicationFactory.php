<?php

declare(strict_types=1);

namespace App\Tests\Factory;

use App\Domain\Entity\Application;
use Zenstruck\Foundry\Persistence\PersistentObjectFactory;

/**
 * @extends PersistentObjectFactory<Application>
 */
final class ApplicationFactory extends PersistentObjectFactory
{
    #[Override]
    public static function class(): string
    {
        return Application::class;
    }

    #[Override]
    protected function defaults(): array|callable
    {
        return [
            'name' => self::faker()->company(),
        ];
    }

    #[Override]
    protected function initialize(): static
    {
        return $this
            ->instantiateWith(function (array $attributes) {
                return Application::create($attributes['name']);
            })
        ;
    }
}
