<?php

namespace App\Infrastructure\Api\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Domain\Entity\Patient;
use App\Domain\Enum\PatientStatus;
use App\Infrastructure\Api\Resource\PatientResource;
use Doctrine\ORM\EntityManagerInterface;

class PatientProvider implements ProviderInterface
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private int $itemsPerPage
    ) {
    }

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): object|array|null
    {
        if (isset($uriVariables['id'])) {
            $patient = $this->entityManager->getRepository(Patient::class)->find($uriVariables['id']);
            return $patient ? $this->mapToResource($patient) : null;
        }

        $filters = $context['filters'] ?? [];
        $page = (int) ($filters['page'] ?? 1);
        $limit = (int) ($filters['itemsPerPage'] ?? $this->itemsPerPage);
        $offset = ($page - 1) * $limit;

        $criteria = [];

        if (isset($filters['status'])) {
            $statusEnum = PatientStatus::tryFrom($filters['status']);
            if ($statusEnum) {
                $criteria['status'] = $statusEnum;
            }
        }

        // Default to active if not specified
        if (!isset($criteria['status'])) {
            $criteria['status'] = PatientStatus::ACTIVE;
        }

        // Determine Sort Order
        $orderBy = ['id' => 'DESC']; // Default: latest
        if (isset($filters['order']) && $filters['order'] === 'alpha') {
            $orderBy = ['firstName' => 'ASC', 'lastName' => 'ASC'];
        }

        // Fetch N+1 records to determine if there's a next page without a COUNT query
        $patients = $this->entityManager->getRepository(Patient::class)->findBy(
            $criteria, 
            $orderBy,
            $limit + 1,
            $offset
        );

        return array_map([$this, 'mapToResource'], $patients);
    }

    private function mapToResource(Patient $patient): PatientResource
    {
        $resource = new PatientResource();
        $resource->id = $patient->id;
        $resource->status = $patient->status;
        $resource->firstName = $patient->firstName;
        $resource->lastName = $patient->lastName;
        $resource->dateOfBirth = $patient->dateOfBirth;
        $resource->identityDocument = $patient->identityDocument;
        $resource->phone = $patient->phone;
        $resource->email = $patient->email;
        $resource->address = $patient->address;
        $resource->profession = $patient->profession;
        $resource->sportsActivity = $patient->sportsActivity;
        $resource->notes = $patient->notes;
        $resource->rate = $patient->rate;
        $resource->allergies = $patient->allergies;
        $resource->medication = $patient->medication;
        $resource->systemicDiseases = $patient->systemicDiseases;
        $resource->surgeries = $patient->surgeries;
        $resource->accidents = $patient->accidents;
        $resource->injuries = $patient->injuries;
        $resource->bruxism = $patient->bruxism;
        $resource->insoles = $patient->insoles;
        $resource->others = $patient->others;
        $resource->createdAt = $patient->createdAt;
        
        $resource->records = $patient->records->map(fn($record) => [
            'id' => $record->id,
            'createdAt' => $record->createdAt->format(\DateTimeInterface::ATOM),
            'physiotherapyTreatment' => $record->physiotherapyTreatment,
            'consultationReason' => $record->consultationReason,
            'currentSituation' => $record->currentSituation,
            'evolution' => $record->evolution,
            'radiologyTests' => $record->radiologyTests,
            'medicalTreatment' => $record->medicalTreatment,
            'homeTreatment' => $record->homeTreatment,
            'notes' => $record->notes,
            'sickLeave' => $record->sickLeave ?? false,
            'onset' => $record->onset,
        ])->toArray();
        
        return $resource;
    }
}