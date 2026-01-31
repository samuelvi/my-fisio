<?php

declare(strict_types=1);

namespace App\Tests\DataFixtures;

use App\Domain\Entity\Application;
use App\Domain\Entity\User;
use App\Tests\Factory\ApplicationFactory;
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
        // 0. Create default application
        $application = Application::create('Default');
        $manager->persist($application);

        // 1. Create the main user
        $user = User::create(email: 'tina@tinafisio.com', password: 'password', application: $application);
        $user->password = $this->passwordHasher->hashPassword($user, 'password');
        $user->roles = ['ROLE_ADMIN'];
        $manager->persist($user);

        // 2. Create 15 patients for testing pagination (4 per page)

        // First patient (will be at the end of the list if sorted by ID DESC)
        $firstPatient = PatientFactory::createOne(attributes: ['firstName' => 'AFirst', 'lastName' => 'Patient']);
        RecordFactory::createMany(number: 2, attributes: [
            'patient' => $firstPatient,
            'physiotherapyTreatment' => 'Initial physiotherapy treatment notes.',
        ]);

        // Patients with accented names for search testing
        PatientFactory::createOne(attributes: ['firstName' => 'José', 'lastName' => 'García']);
        PatientFactory::createOne(attributes: ['firstName' => 'María', 'lastName' => 'López']);
        PatientFactory::createOne(attributes: ['firstName' => 'Ángel', 'lastName' => 'Martínez']);
        PatientFactory::createOne(attributes: ['firstName' => 'Inés', 'lastName' => 'Pérez']);

        // 9 middle patients (reduced from 13 to keep total at 15)
        PatientFactory::createMany(number: 9);

        // Last patient (will be at the beginning of the list if sorted by ID DESC)
        $lastPatient = PatientFactory::createOne(attributes: ['firstName' => 'ZLast', 'lastName' => 'Patient']);
        RecordFactory::createMany(number: 2, attributes: [
            'patient' => $lastPatient,
            'physiotherapyTreatment' => 'Initial physiotherapy treatment notes.',
        ]);

        $manager->flush();
    }
}
