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
            $search = trim($filters['search']);
            $searchTermFull = '%' . $search . '%';
            $useFuzzy = isset($filters['fuzzy']) && ($filters['fuzzy'] === 'true' || $filters['fuzzy'] === true || $filters['fuzzy'] === '1');
            
            // Search builder
            $searchOr = $qb->expr()->orX();

            // 1. Direct match against fullName, phone or email
            $searchOr->add('p.fullName LIKE :searchFull');
            $searchOr->add('p.phone LIKE :searchFull');
            $searchOr->add('p.email LIKE :searchFull');
            $qb->setParameter('searchFull', $searchTermFull);

            // 2. Intelligent Fuzzy Matching (PostgreSQL specific)
            if ($useFuzzy && strlen($search) >= 3) {
                $conn = $this->entityManager->getConnection();
                // We search for the full query string in the fuzzy index
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

            // 3. Tokenized search: Only apply if NOT using fuzzy or as an additional filter
            // Actually, if we use fuzzy, we don't want the strict AND tokenized search to kill the results
            if (!$useFuzzy) {
                $words = preg_split('/\s+/', $search, -1, PREG_SPLIT_NO_EMPTY);
                if (count($words) > 1) {
                    foreach ($words as $index => $word) {
                        $paramName = 'word_' . $index;
                        $qb->andWhere('p.fullName LIKE :' . $paramName);
                        $qb->setParameter($paramName, '%' . $word . '%');
                    }
                }
            }
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
        
        // Handle Enum (getArrayResult might return the object if enumType is used)
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
