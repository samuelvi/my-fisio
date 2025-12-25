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

        // 1. Get the IDs first to avoid join multiplication in pagination
        // Using a simpler query for IDs to avoid PostgreSQL DISTINCT/ORDER BY issues
        $qb = $repository->createQueryBuilder('p')
            ->select('p.id');

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
            $search = trim($filters['search']);
            $searchTermFull = '%' . $search . '%';
            $useFuzzy = isset($filters['fuzzy']) && ($filters['fuzzy'] === 'true' || $filters['fuzzy'] === true || $filters['fuzzy'] === '1');
            
            $searchOr = $qb->expr()->orX();
            $searchOr->add('p.fullName LIKE :searchFull');
            $searchOr->add('p.phone LIKE :searchFull');
            $searchOr->add('p.email LIKE :searchFull');
            $qb->setParameter('searchFull', $searchTermFull);

            if ($useFuzzy && strlen($search) >= 3) {
                $conn = $this->entityManager->getConnection();
                $similarIds = $conn->fetchFirstColumn(
                    "SELECT id FROM patients 
                     WHERE similarity(full_name, :s::text) > 0.3 
                        OR levenshtein(full_name::text, :s::text) <= 3",
                    ['s' => $search]
                );

                if (!empty($similarIds)) {
                    $searchOr->add('p.id IN (:similarIds)');
                    $qb->setParameter('similarIds', $similarIds);
                }
            }
            $qb->andWhere($searchOr);
        }

        if (isset($filters['order']) && $filters['order'] === 'alpha') {
            $qb->orderBy('p.firstName', 'ASC')->addOrderBy('p.lastName', 'ASC');
        } else {
            $qb->orderBy('p.id', 'DESC');
        }

        $ids = $qb->setMaxResults($limit + 1)
                  ->setFirstResult($offset)
                  ->getQuery()
                  ->getSingleColumnResult();

        if (empty($ids)) {
            return [];
        }

        // 2. Fetch full data for those IDs
        $finalQb = $repository->createQueryBuilder('p')
            ->select('p', 'r')
            ->leftJoin('p.records', 'r')
            ->where('p.id IN (:ids)')
            ->setParameter('ids', $ids);

        if (isset($filters['order']) && $filters['order'] === 'alpha') {
            $finalQb->orderBy('p.firstName', 'ASC')->addOrderBy('p.lastName', 'ASC');
        } else {
            $finalQb->orderBy('p.id', 'DESC');
        }

        $patients = $finalQb->getQuery()->getArrayResult();

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
        
        $resource->createdAt = $data['createdAt'] instanceof \DateTimeInterface 
            ? \DateTimeImmutable::createFromInterface($data['createdAt']) 
            : new \DateTimeImmutable($data['createdAt']);
        
        $resource->records = array_map(function($r) {
            $recordCreatedAt = $r['createdAt'] instanceof \DateTimeInterface 
                ? $r['createdAt'] 
                : new \DateTimeImmutable($r['createdAt']);

            return [
                'id' => $r['id'],
                'createdAt' => $recordCreatedAt->format(\DateTimeInterface::ATOM),
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