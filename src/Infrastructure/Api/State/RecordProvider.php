<?php

namespace App\Infrastructure\Api\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Domain\Entity\Record;
use App\Infrastructure\Api\Resource\RecordResource;
use Doctrine\ORM\EntityManagerInterface;

class RecordProvider implements ProviderInterface
{
    public function __construct(
        private EntityManagerInterface $entityManager
    ) {
    }

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): object|array|null
    {
        if (isset($uriVariables['id'])) {
            $record = $this->entityManager->getRepository(Record::class)->find($uriVariables['id']);
            return $record ? $this->mapToResource($record) : null;
        }

        $filters = $context['filters'] ?? [];
        $page = (int) ($filters['page'] ?? 1);
        $limit = (int) ($filters['itemsPerPage'] ?? 10);
        $offset = ($page - 1) * $limit;

        // Fetch N+1 records
        $records = $this->entityManager->getRepository(Record::class)->findBy(
            [], 
            ['id' => 'DESC'],
            $limit + 1,
            $offset
        );

        return array_map([$this, 'mapToResource'], $records);
    }

    private function mapToResource(Record $record): RecordResource
    {
        $resource = RecordResource::create();
        $resource->id = $record->id;
        $resource->patient = '/api/patients/' . $record->patient->id;
        $resource->physiotherapyTreatment = $record->physiotherapyTreatment;
        $resource->consultationReason = $record->consultationReason;
        $resource->onset = $record->onset;
        $resource->currentSituation = $record->currentSituation;
        $resource->evolution = $record->evolution;
        $resource->radiologyTests = $record->radiologyTests;
        $resource->medicalTreatment = $record->medicalTreatment;
        $resource->homeTreatment = $record->homeTreatment;
        $resource->notes = $record->notes;
        $resource->sickLeave = $record->sickLeave ?? false;
        $resource->createdAt = $record->createdAt;
        
        return $resource;
    }
}
