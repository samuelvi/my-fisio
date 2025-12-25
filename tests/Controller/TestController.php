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

        // Load Base Fixtures (using the same logic as AppFixtures)
        UserFactory::createOne([
            'email' => 'tina@tinafisio.com',
            'password' => 'password',
            'roles' => ['ROLE_ADMIN']
        ]);

        $firstPatient = PatientFactory::createOne(['firstName' => 'AFirst', 'lastName' => 'Patient']);
        RecordFactory::createMany(2, ['patient' => $firstPatient]);

        PatientFactory::createMany(13);

        $lastPatient = PatientFactory::createOne(['firstName' => 'ZLast', 'lastName' => 'Patient']);
        RecordFactory::createMany(2, ['patient' => $lastPatient]);

        return new JsonResponse(['status' => 'Database reset and base fixtures loaded']);
    }

    #[Route('/reset-db-empty', name: 'test_reset_db_empty', methods: ['POST'])]
    public function resetDbEmpty(): JsonResponse
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

        UserFactory::createOne([
            'email' => 'tina@tinafisio.com',
            'password' => 'password',
            'roles' => ['ROLE_ADMIN']
        ]);

        return new JsonResponse(['status' => 'Database reset with user only']);
    }
}
