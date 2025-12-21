<?php

namespace App\Tests\DataFixtures;

use App\Domain\Entity\User;
use App\Tests\Factory\PatientFactory;
use App\Tests\Factory\RecordFactory;
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
        
        $user->password = $hashedPassword;
        $user->roles = ['ROLE_ADMIN'];

        $manager->persist($user);
        
        // Create 15 patients for testing pagination (4 per page)
        // 1. Create the one that will appear LAST (ID 1)
        $first = PatientFactory::createOne(['firstName' => 'Patient', 'lastName' => 'First Created']);
        RecordFactory::createMany(2, ['patient' => $first]);

        // 2. Create middle patients (IDs 2-14)
        PatientFactory::createMany(13);

        // 3. Create the one that will appear FIRST (ID 15)
        $last = PatientFactory::createOne(['firstName' => 'Patient', 'lastName' => 'Last Created']);
        RecordFactory::createMany(2, ['patient' => $last]);

        $manager->flush();
    }
}