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
        $repository = $this->entityManager->getRepository(Patient::class);
        
        if (isset($uriVariables['id'])) {
            $qb = $repository->createQueryBuilder('p')
                ->select('p', 'r')
                ->leftJoin('p.records', 'r')
                ->where('p.id = :id')
                ->setParameter('id', $uriVariables['id']);

            $result = $qb->getQuery()->getArrayResult();
            return !empty($result) ? $this->mapToResource($result[0]) : null;
        }

        $filters = $context['filters'] ?? [];
        $page = (int) ($filters['page'] ?? 1);
        $limit = (int) ($filters['itemsPerPage'] ?? $this->itemsPerPage);
        $offset = ($page - 1) * $limit;

        $qb = $repository->createQueryBuilder('p')
            ->select('p', 'r')
            ->leftJoin('p.records', 'r');

        if (isset($filters['status'])) {
            $statusEnum = PatientStatus::tryFrom($filters['status']);
            if ($statusEnum) {
                $qb->andWhere('p.status = :status')
                   ->setParameter('status', $statusEnum->value);
            }
        } else {
            $qb->andWhere('p.status = :status')
               ->setParameter('status', PatientStatus::ACTIVE->value);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $searchTerm = '%' . mb_strtolower($search) . '%';
            
            $searchOr = $qb->expr()->orX();
            $searchOr->add('LOWER(p.firstName) LIKE :search');
            $searchOr->add('LOWER(p.lastName) LIKE :search');
            $searchOr->add('p.phone LIKE :search');
            $searchOr->add('LOWER(p.email) LIKE :search');
            $qb->setParameter('search', $searchTerm);
            
            $qb->andWhere($searchOr);
        }

        if (isset($filters['order']) && $filters['order'] === 'alpha') {
            $qb->orderBy('p.firstName', 'ASC')->addOrderBy('p.lastName', 'ASC');
        } else {
            $qb->orderBy('p.id', 'DESC');
        }

        $patients = $qb->setMaxResults($limit + 1)
                       ->setFirstResult($offset)
                       ->getQuery()
                       ->getArrayResult();

        return array_map([$this, 'mapToResource'], $patients);
    }

    private function mapToResource(array $data): PatientResource
    {
        $resource = PatientResource::create();
        $resource->id = $data['id'];
        $resource->status = PatientStatus::from($data['status']);
        $resource->firstName = $data['firstName'];
        $resource->lastName = $data['lastName'];
        $resource->dateOfBirth = $data['dateOfBirth'] ?? null;
        $resource->identityDocument = $data['identityDocument'] ?? null;
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
        $resource->createdAt = $data['createdAt'];
        
        $resource->records = array_map(fn($r) => [
            'id' => $r['id'],
            'createdAt' => $r['createdAt']->format(\DateTimeInterface::ATOM),
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
        ], $data['records'] ?? []);
        
        return $resource;
    }
}
