<?php

declare(strict_types=1);

namespace App\Tests\Factory;

use App\Domain\Entity\User;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Zenstruck\Foundry\Persistence\PersistentObjectFactory;

/**
 * @extends PersistentObjectFactory<User>
 */
final class UserFactory extends PersistentObjectFactory
{
    public function __construct(
        private UserPasswordHasherInterface $passwordHasher,
    ) {
    }

    #[Override]
    public static function class(): string
    {
        return User::class;
    }

    #[Override]
    protected function defaults(): array|callable
    {
        return [
            'email' => self::faker()->unique()->safeEmail(),
            'password' => 'password', // Default raw password
            'roles' => ['ROLE_USER'],
            'application' => ApplicationFactory::new(),
        ];
    }

    #[Override]
    protected function initialize(): static
    {
        return $this
            ->instantiateWith(function (array $attributes) {
                return User::create($attributes['email'], $attributes['password'], $attributes['application']);
            })
            ->afterInstantiate(function (User $user, array $attributes): void {
                $user->roles = $attributes['roles'];
                // Re-hash if needed, but create already sets raw password
                $user->password = $this->passwordHasher->hashPassword(
                    $user,
                    $attributes['password'],
                );
            })
        ;
    }
}
