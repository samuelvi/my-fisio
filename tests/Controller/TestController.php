<?php

namespace App\Tests\Controller;

use App\Tests\Factory\UserFactory;
use App\Tests\Factory\PatientFactory;
use App\Tests\Factory\RecordFactory;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/test')]
class TestController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager
    ) {
    }

    #[Route('/reset-db', name: 'test_reset_db', methods: ['POST'])]
    public function resetDb(): JsonResponse
    {
        // WARNING: ONLY FOR TEST ENVIRONMENT
        if ($this->getParameter('kernel.environment') !== 'test') {
            return new JsonResponse(['error' => 'Access denied'], 403);
        }

        $connection = $this->entityManager->getConnection();
        $connection->executeStatement('DROP SCHEMA public CASCADE');
        $connection->executeStatement('CREATE SCHEMA public');
        $connection->executeStatement('GRANT ALL ON SCHEMA public TO public');
        $connection->executeStatement('GRANT ALL ON SCHEMA public TO ' . $connection->getParams()['user']);

        $metadatas = $this->entityManager->getMetadataFactory()->getAllMetadata();
        $schemaTool = new SchemaTool($this->entityManager);
        $schemaTool->createSchema($metadatas);

        // Load Base Fixtures (Admin User)
        UserFactory::createOne([
            'email' => 'admin@example.com',
            'password' => 'password',
            'roles' => ['ROLE_ADMIN']
        ]);

        // Create 15 patients in total
        // 1. Create the one that will appear LAST (ID 1)
        $firstCreated = PatientFactory::createOne(['firstName' => 'Patient', 'lastName' => 'First Created']);
        RecordFactory::createMany(2, ['patient' => $firstCreated]);

        // 2. Create middle patients (IDs 2-14)
        PatientFactory::createMany(13);

        // 3. Create the one that will appear FIRST (ID 15)
        $lastCreated = PatientFactory::createOne(['firstName' => 'Patient', 'lastName' => 'Last Created']);
        RecordFactory::createMany(2, ['patient' => $lastCreated]);

        return new JsonResponse(['status' => 'Database reset and base fixtures loaded']);
    }
}
