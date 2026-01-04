<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Infrastructure\Api\Resource\RecordResource;
use App\Infrastructure\Persistence\Doctrine\Repository\DoctrineRecordRepository;
use DateTimeImmutable;
use DateTimeInterface;

class RecordProvider implements ProviderInterface
{
    public function __construct(
        private readonly DoctrineRecordRepository $repository,
    ) {
    }

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): object|array|null
    {
        if (isset($uriVariables['id'])) {
            $result = $this->repository->getByIdAsArray((int) $uriVariables['id']);
            return $result ? $this->mapToResource($result) : null;
        }

        $filters = $context['filters'] ?? [];
        $searchFilters = [];
        if (isset($filters['patient.id'])) {
            $searchFilters['patientId'] = (int) $filters['patient.id'];
        }

        $records = $this->repository->searchAsArray($searchFilters);

        return array_map([$this, 'mapToResource'], $records);
    }

    private function mapToResource(array $data): RecordResource
    {
        $resource = new RecordResource();
        $resource->id = $data['id'];
        $resource->patient = '/api/patients/' . $data['patient']['id'];
        $resource->physiotherapyTreatment = $data['physiotherapyTreatment'];
        $resource->consultationReason = $data['consultationReason'] ?? null;
        $resource->onset = $data['onset'] ?? null;
        $resource->radiologyTests = $data['radiologyTests'] ?? null;
        $resource->evolution = $data['evolution'] ?? null;
        $resource->currentSituation = $data['currentSituation'] ?? null;
        $resource->sickLeave = $data['sickLeave'] ?? false;
        $resource->medicalTreatment = $data['medicalTreatment'] ?? null;
        $resource->homeTreatment = $data['homeTreatment'] ?? null;
        $resource->notes = $data['notes'] ?? null;

        $resource->createdAt = $data['createdAt'] instanceof DateTimeInterface
            ? DateTimeImmutable::createFromInterface($data['createdAt'])
            : new DateTimeImmutable($data['createdAt']);

        return $resource;
    }
}