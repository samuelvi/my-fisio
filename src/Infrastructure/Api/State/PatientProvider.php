<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Domain\Enum\PatientStatus;
use App\Infrastructure\Api\Resource\PatientResource;
use App\Infrastructure\Persistence\Doctrine\Repository\DoctrinePatientRepository;
use DateTimeImmutable;
use DateTimeInterface;

class PatientProvider implements ProviderInterface
{
    public function __construct(
        private readonly DoctrinePatientRepository $repository,
        private readonly int $itemsPerPage,
    ) {
    }

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): object|array|null
    {
        if (isset($uriVariables['id'])) {
            $result = $this->repository->getByIdAsArray((int) $uriVariables['id']);
            return $result ? $this->mapToResource($result) : null;
        }

        $filters = $context['filters'] ?? [];
        $page = (int) ($filters['page'] ?? 1);
        $limit = (int) ($filters['itemsPerPage'] ?? $this->itemsPerPage);

        $patients = $this->repository->searchAsArray($filters, $page, $limit);

        return array_map([$this, 'mapToResource'], $patients);
    }

    private function mapToResource(array $data): PatientResource
    {
        $resource = new PatientResource();
        $resource->id = $data['id'];
        $resource->status = $data['status'] instanceof PatientStatus
            ? $data['status']
            : PatientStatus::from($data['status']);

        $resource->firstName = $data['firstName'];
        $resource->lastName = $data['lastName'];
        $resource->dateOfBirth = $data['dateOfBirth'] ?? null;
        $resource->taxId = $data['taxId'] ?? null;
        $resource->phone = $data['phone'] ?? null;
        $resource->email = $data['email'] ?? null;
        $resource->address = $data['address'] ?? null;
        $resource->profession = $data['profession'] ?? null;
        $resource->sportsActivity = $data['sportsActivity'] ?? null;
        $resource->notes = $data['notes'] ?? null;
        $resource->rate = $data['rate'] ?? null;
        $resource->allergies = $data['allergies'] ?? null;
        $resource->medication = $data['medication'] ?? null;
        $resource->systemicDiseases = $data['systemicDiseases'] ?? null;
        $resource->surgeries = $data['surgeries'] ?? null;
        $resource->accidents = $data['accidents'] ?? null;
        $resource->injuries = $data['injuries'] ?? null;
        $resource->bruxism = $data['bruxism'] ?? null;
        $resource->insoles = $data['insoles'] ?? null;
        $resource->others = $data['others'] ?? null;

        $resource->createdAt = $data['createdAt'] instanceof DateTimeInterface
            ? DateTimeImmutable::createFromInterface($data['createdAt'])
            : new DateTimeImmutable($data['createdAt']);

        $resource->records = array_map(function ($r) {
            $recordCreatedAt = $r['createdAt'] instanceof DateTimeInterface
                ? $r['createdAt']
                : new DateTimeImmutable($r['createdAt']);

            return [
                'id' => $r['id'],
                'createdAt' => $recordCreatedAt->format(DateTimeInterface::ATOM),
                'physiotherapyTreatment' => $r['physiotherapyTreatment'],
                'consultationReason' => $r['consultationReason'] ?? null,
                'currentSituation' => $r['currentSituation'] ?? null,
                'evolution' => $r['evolution'] ?? null,
                'radiologyTests' => $r['radiologyTests'] ?? null,
                'medicalTreatment' => $r['medicalTreatment'] ?? null,
                'homeTreatment' => $r['homeTreatment'] ?? null,
                'notes' => $r['notes'] ?? null,
                'sickLeave' => $r['sickLeave'] ?? false,
                'onset' => $r['onset'] ?? null,
            ];
        }, $data['records'] ?? []);

        return $resource;
    }
}