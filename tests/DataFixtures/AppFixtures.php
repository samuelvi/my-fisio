<?php

namespace App\Tests\DataFixtures;

use App\Domain\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AppFixtures extends Fixture
{
    public function __construct(
        private UserPasswordHasherInterface $passwordHasher
    ) {
    }

    public function load(ObjectManager $manager): void
    {
        $user = User::create('admin@example.com');
        $hashedPassword = $this->passwordHasher->hashPassword($user, 'password');
        
        // Reflection to set private property 'password' since we don't have setters (DDD style)
        // Or if we modify User entity to allow setting password during creation.
        // Let's assume for now we can modify the User entity creation logic or use reflection.
        // Actually, User entity has public $password field but it's not set in constructor.
        // Let's check User.php again.
        
        // Wait, User.php has public properties?
        // public string $password;
        // Yes. So I can just set it.
        
        $user->password = $hashedPassword;
        $user->roles = ['ROLE_ADMIN'];

        $manager->persist($user);
        $manager->flush();
    }
}