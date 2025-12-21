<?php

namespace App\Infrastructure\Api\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Domain\Entity\Patient;
use App\Infrastructure\Api\Resource\PatientResource;
use Doctrine\ORM\EntityManagerInterface;

class PatientProcessor implements ProcessorInterface
{
    public function __construct(
        private EntityManagerInterface $entityManager
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        if (!$data instanceof PatientResource) {
            return $data;
        }

        if (isset($uriVariables['id'])) {
            $patient = $this->entityManager->getRepository(Patient::class)->find($uriVariables['id']);
        } else {
            $patient = Patient::create($data->firstName, $data->lastName);
        }

        if (!$patient) {
            return null;
        }

        $patient->firstName = $data->firstName;
        $patient->lastName = $data->lastName;
        $patient->phone = $data->phone;
        $patient->email = $data->email;
        // Map other fields...

        $this->entityManager->persist($patient);
        $this->entityManager->flush();

        $data->id = $patient->id;
        $data->createdAt = $patient->createdAt;

        return $data;
    }
}
