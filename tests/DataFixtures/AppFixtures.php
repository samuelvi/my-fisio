<?php

declare(strict_types=1);

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
        private UserPasswordHasherInterface $passwordHasher,
    ) {
    }

    public function load(ObjectManager $manager): void
    {
        // 1. Create the main user
        $user = User::create('tina@tinafisio.com');
        $user->password = $this->passwordHasher->hashPassword($user, 'password');
        $user->roles = ['ROLE_ADMIN'];
        $manager->persist($user);

        // 2. Create 15 patients for testing pagination (4 per page)

        // First patient (will be at the end of the list if sorted by ID DESC)
        $firstPatient = PatientFactory::createOne(['firstName' => 'AFirst', 'lastName' => 'Patient']);
        RecordFactory::createMany(2, [
            'patient' => $firstPatient,
            'physiotherapyTreatment' => 'Initial physiotherapy treatment notes.',
        ]);

        // 13 middle patients
        PatientFactory::createMany(13);

        // Last patient (will be at the beginning of the list if sorted by ID DESC)
        $lastPatient = PatientFactory::createOne(['firstName' => 'ZLast', 'lastName' => 'Patient']);
        RecordFactory::createMany(2, [
            'patient' => $lastPatient,
            'physiotherapyTreatment' => 'Initial physiotherapy treatment notes.',
        ]);

        $manager->flush();
    }
}
