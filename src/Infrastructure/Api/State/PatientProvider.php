<?php

namespace App\Infrastructure\Api\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Domain\Entity\Patient;
use App\Infrastructure\Api\Resource\PatientResource;
use Doctrine\ORM\EntityManagerInterface;

class PatientProvider implements ProviderInterface
{
    public function __construct(
        private EntityManagerInterface $entityManager
    ) {
    }

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): object|array|null
    {
        if (isset($uriVariables['id'])) {
            $patient = $this->entityManager->getRepository(Patient::class)->find($uriVariables['id']);
            return $patient ? $this->mapToResource($patient) : null;
        }

        $patients = $this->entityManager->getRepository(Patient::class)->findAll();
        return array_map([$this, 'mapToResource'], $patients);
    }

    private function mapToResource(Patient $patient): PatientResource
    {
        $resource = new PatientResource();
        $resource->id = $patient->id;
        $resource->firstName = $patient->firstName;
        $resource->lastName = $patient->lastName;
        $resource->phone = $patient->phone;
        $resource->email = $patient->email;
        $resource->createdAt = $patient->createdAt;
        
        return $resource;
    }
}
