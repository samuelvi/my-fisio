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
        $repository = $this->entityManager->getRepository(Record::class);

        if (isset($uriVariables['id'])) {
            $qb = $repository->createQueryBuilder('r')
                ->select('r', 'p')
                ->leftJoin('r.patient', 'p')
                ->where('r.id = :id')
                ->setParameter('id', $uriVariables['id']);

            $result = $qb->getQuery()->getArrayResult();
            return !empty($result) ? $this->mapToResource($result[0]) : null;
        }

        $filters = $context['filters'] ?? [];
        $page = (int) ($filters['page'] ?? 1);
        $limit = (int) ($filters['itemsPerPage'] ?? 10);
        $offset = ($page - 1) * $limit;

        $qb = $repository->createQueryBuilder('r')
            ->select('r', 'p')
            ->leftJoin('r.patient', 'p')
            ->orderBy('r.id', 'DESC')
            ->setMaxResults($limit + 1)
            ->setFirstResult($offset);

        $results = $qb->getQuery()->getArrayResult();

        return array_map([$this, 'mapToResource'], $results);
    }

    private function mapToResource(array $data): RecordResource
    {
        $resource = new RecordResource();
        $resource->id = $data['id'];
        $resource->patient = '/api/patients/' . $data['patient']['id'];
        $resource->physiotherapyTreatment = $data['physiotherapyTreatment'];
        $resource->consultationReason = $data['consultationReason'] ?? null;
        $resource->onset = $data['onset'] ?? null;
        $resource->currentSituation = $data['currentSituation'] ?? null;
        $resource->evolution = $data['evolution'] ?? null;
        $resource->radiologyTests = $data['radiologyTests'] ?? null;
        $resource->medicalTreatment = $data['medicalTreatment'] ?? null;
        $resource->homeTreatment = $data['homeTreatment'] ?? null;
        $resource->notes = $data['notes'] ?? null;
        $resource->sickLeave = $data['sickLeave'] ?? false;

        $resource->createdAt = $data['createdAt'] instanceof \DateTimeInterface 
            ? \DateTimeImmutable::createFromInterface($data['createdAt']) 
            : new \DateTimeImmutable($data['createdAt']);
        
        return $resource;
    }
}