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

        $records = $this->entityManager->getRepository(Record::class)->findAll();
        return array_map([$this, 'mapToResource'], $records);
    }

    private function mapToResource(Record $record): RecordResource
    {
        $resource = new RecordResource();
        $resource->id = $record->id;
        $resource->patient = '/api/patients/' . $record->patient->id;
        $resource->physiotherapyTreatment = $record->physiotherapyTreatment;
        $resource->createdAt = $record->createdAt;
        
        return $resource;
    }
}
