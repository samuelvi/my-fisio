<?php

namespace App\Infrastructure\Api\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Domain\Entity\Appointment;
use App\Infrastructure\Api\Resource\AppointmentResource;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\RequestStack;

class AppointmentProvider implements ProviderInterface
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private RequestStack $requestStack
    ) {
    }

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): object|array|null
    {
        $repository = $this->entityManager->getRepository(Appointment::class);

        if (isset($uriVariables['id'])) {
            $qb = $repository->createQueryBuilder('a')
                ->select('a', 'p')
                ->leftJoin('a.patient', 'p')
                ->where('a.id = :id')
                ->setParameter('id', $uriVariables['id']);

            $result = $qb->getQuery()->getArrayResult();
            return !empty($result) ? $this->mapToResource($result[0]) : null;
        }

        $request = $this->requestStack->getCurrentRequest();
        $start = $request?->query->get('start');
        $end = $request?->query->get('end');
        $patientId = $request?->query->get('patientId');

        $qb = $repository->createQueryBuilder('a')
            ->select('a', 'p')
            ->leftJoin('a.patient', 'p');

        if ($patientId) {
            $qb->andWhere('p.id = :patientId')
               ->setParameter('patientId', $patientId);
        }

        if ($start) {
            $qb->andWhere('a.endsAt >= :start')
               ->setParameter('start', new \DateTimeImmutable($start));
        }

        if ($end) {
            $qb->andWhere('a.startsAt <= :end')
               ->setParameter('end', new \DateTimeImmutable($end));
        }

        $results = $qb->orderBy('a.startsAt', 'ASC')
                      ->getQuery()
                      ->getArrayResult();

        return array_map([$this, 'mapToResource'], $results);
    }

    private function mapToResource(array $data): AppointmentResource
    {
        $resource = new AppointmentResource();
        $resource->id = $data['id'];
        
        if (isset($data['patient'])) {
            $resource->patientId = $data['patient']['id'];
            $resource->patientName = $data['patient']['firstName'] . ' ' . $data['patient']['lastName'];
        }
        
        $resource->userId = $data['userId'];
        
        if (!empty($data['title'])) {
            $resource->title = $data['title'];
        } elseif (isset($data['patient'])) {
            $resource->title = $data['patient']['firstName'] . ' ' . $data['patient']['lastName'];
        } elseif (!empty($data['notes'])) {
            $resource->title = mb_substr($data['notes'], 0, 30) . (mb_strlen($data['notes']) > 30 ? '...' : '');
        } else {
            $resource->title = '';
        }
        
        $resource->allDay = $data['allDay'] ?? null;

        $resource->startsAt = $data['startsAt'] instanceof \DateTimeInterface 
            ? \DateTimeImmutable::createFromInterface($data['startsAt']) 
            : new \DateTimeImmutable($data['startsAt']);

        $resource->endsAt = $data['endsAt'] instanceof \DateTimeInterface 
            ? \DateTimeImmutable::createFromInterface($data['endsAt']) 
            : new \DateTimeImmutable($data['endsAt']);

        $resource->notes = $data['notes'] ?? null;
        $resource->type = $data['type'] ?? null;

        $resource->createdAt = $data['createdAt'] instanceof \DateTimeInterface 
            ? \DateTimeImmutable::createFromInterface($data['createdAt']) 
            : new \DateTimeImmutable($data['createdAt']);
        
        return $resource;
    }
}