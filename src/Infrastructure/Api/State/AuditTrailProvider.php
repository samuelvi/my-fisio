<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Domain\Entity\AuditTrail;
use App\Infrastructure\Api\Resource\AuditTrailResource;
use Doctrine\ORM\EntityManagerInterface;

class AuditTrailProvider implements ProviderInterface
{
    public function __construct(
        private EntityManagerInterface $entityManager,
    ) {
    }

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): object|array|null
    {
        $repository = $this->entityManager->getRepository(AuditTrail::class);
        
        if (isset($uriVariables['id'])) {
            $qb = $repository->createQueryBuilder('a')
                ->where('a.id = :id')
                ->setParameter('id', $uriVariables['id']);
            
            $result = $qb->getQuery()->getArrayResult();
            return !empty($result) ? $this->mapToResource($result[0]) : null;
        }

        $filters = $context['filters'] ?? [];
        $qb = $repository->createQueryBuilder('a');

        if (isset($filters['entityType'])) {
            $qb->andWhere('a.entityType = :entityType')
               ->setParameter('entityType', $filters['entityType']);
        }

        if (isset($filters['entityId'])) {
            $qb->andWhere('a.entityId = :entityId')
               ->setParameter('entityId', $filters['entityId']);
        }

        if (isset($filters['operation'])) {
            $qb->andWhere('a.operation = :operation')
               ->setParameter('operation', $filters['operation']);
        }

        // Default ordering
        $qb->orderBy('a.changedAt', 'DESC');

        $results = $qb->getQuery()->getArrayResult();

        return array_map([$this, 'mapToResource'], $results);
    }

    private function mapToResource(array $data): AuditTrailResource
    {
        $resource = new AuditTrailResource();
        $resource->id = (int) $data['id'];
        $resource->entityType = $data['entityType'];
        $resource->entityId = $data['entityId'];
        $resource->operation = $data['operation'];
        $resource->changes = $data['changes'];
        $resource->changedAt = $data['changedAt'] instanceof \DateTimeInterface 
            ? \DateTimeImmutable::createFromInterface($data['changedAt']) 
            : new \DateTimeImmutable($data['changedAt']);
        
        $resource->changedBy = isset($data['changedBy']) ? '/api/users/' . $data['changedBy']['id'] : null;
        $resource->ipAddress = $data['ipAddress'] ?? null;
        $resource->userAgent = $data['userAgent'] ?? null;

        return $resource;
    }
}