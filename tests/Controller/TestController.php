<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use App\Domain\Entity\Patient;
use App\Domain\Entity\Record;
use App\Tests\Factory\PatientFactory;
use App\Tests\Factory\RecordFactory;
use App\Tests\Factory\UserFactory;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/test')]
class TestController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
    ) {
    }

    #[Route('/stats', name: 'test_stats', methods: ['GET'])]
    public function stats(): JsonResponse
    {
        if ('test' !== $this->getParameter('kernel.environment')) {
            return new JsonResponse(['error' => 'Access denied'], 403);
        }

        return new JsonResponse([
            'patients' => $this->entityManager->getRepository(Patient::class)->count([]),
            'records' => $this->entityManager->getRepository(Record::class)->count([]),
        ]);
    }

    #[Route('/reset-db', name: 'test_reset_db', methods: ['POST'])]
    public function resetDb(): JsonResponse
    {
        // WARNING: ONLY FOR TEST ENVIRONMENT
        if ('test' !== $this->getParameter('kernel.environment')) {
            return new JsonResponse(['error' => 'Access denied'], 403);
        }

        $this->prepareSchema();

        // Load Base Fixtures (using the same logic as AppFixtures)
        UserFactory::createOne([
            'email' => 'tina@tinafisio.com',
            'password' => 'password',
            'roles' => ['ROLE_ADMIN'],
        ]);

        // First patient
        $firstPatient = PatientFactory::createOne(['firstName' => 'AFirst', 'lastName' => 'Patient']);
        RecordFactory::createMany(2, ['patient' => $firstPatient]);

        // Patients with accented names for search testing
        PatientFactory::createOne(['firstName' => 'José', 'lastName' => 'García']);
        PatientFactory::createOne(['firstName' => 'María', 'lastName' => 'López']);
        PatientFactory::createOne(['firstName' => 'Ángel', 'lastName' => 'Martínez']);
        PatientFactory::createOne(['firstName' => 'Inés', 'lastName' => 'Pérez']);

        // 9 middle patients (reduced from 13 to keep total at 15)
        PatientFactory::createMany(9);

        // Last patient
        $lastPatient = PatientFactory::createOne(['firstName' => 'ZLast', 'lastName' => 'Patient']);
        RecordFactory::createMany(2, ['patient' => $lastPatient]);

        return new JsonResponse(['status' => 'Database reset and base fixtures loaded']);
    }

    #[Route('/reset-db-empty', name: 'test_reset_db_empty', methods: ['POST'])]
    public function resetDbEmpty(): Response
    {
        if ('test' !== $this->getParameter('kernel.environment')) {
            return new JsonResponse(['error' => 'Access denied'], 403);
        }

        $this->prepareSchema();

        UserFactory::createOne([
            'email' => 'tina@tinafisio.com',
            'password' => 'password',
            'roles' => ['ROLE_ADMIN'],
        ]);

        return new JsonResponse(['status' => 'Database reset with user only']);
    }

    private function prepareSchema(): void
    {
        $this->entityManager->clear();
        $metadatas = $this->entityManager->getMetadataFactory()->getAllMetadata();
        $schemaTool = new SchemaTool($this->entityManager);

        $schemaTool->dropSchema($metadatas);
        $schemaTool->createSchema($metadatas);
    }
}