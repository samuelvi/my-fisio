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
        if (isset($uriVariables['id'])) {
            $patient = $this->entityManager->getRepository(Patient::class)->find($uriVariables['id']);
            return $patient ? $this->mapToResource($patient) : null;
        }

        $filters = $context['filters'] ?? [];
        $page = (int) ($filters['page'] ?? 1);
        $limit = (int) ($filters['itemsPerPage'] ?? $this->itemsPerPage);
        $offset = ($page - 1) * $limit;

        // Fetching patients using QueryBuilder to support search
        $repository = $this->entityManager->getRepository(Patient::class);
        $qb = $repository->createQueryBuilder('p');

        if (isset($filters['status'])) {
            $statusEnum = PatientStatus::tryFrom($filters['status']);
            if ($statusEnum) {
                $qb->andWhere('p.status = :status')
                   ->setParameter('status', $statusEnum);
            }
        } else {
            // Default to active if not specified
            $qb->andWhere('p.status = :status')
               ->setParameter('status', PatientStatus::ACTIVE);
        }

        // Search filter (name, phone, email) - Fuzzy search using pg_trgm similarity
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $searchTerm = '%' . mb_strtolower($search) . '%';
            
            // We use a combination of LIKE for pattern matching and similarity for fuzzy matching
            // We'll use a Native Query or a complex expression. 
            // To keep it simple and compatible with DQL without extra registration:
            $qb->andWhere('LOWER(p.firstName) LIKE :search OR LOWER(p.lastName) LIKE :search OR p.phone LIKE :search OR LOWER(p.email) LIKE :search')
               ->setParameter('search', $searchTerm);
            
            // Add fuzzy matching using similarity and levenshtein if the search term is long enough
            if (strlen($search) >= 3) {
                // We use a subquery with native SQL to find similar IDs
                $conn = $this->entityManager->getConnection();
                
                // We combine similarity (trigrams) and levenshtein (edit distance)
                // Levenshtein is great for small typos (Snati vs Santi)
                // Similarity is better for missing parts or partial matches
                $similarIds = $conn->fetchFirstColumn(
                    "SELECT id FROM patients 
                     WHERE similarity(first_name, :s) > 0.2 
                        OR similarity(last_name, :s) > 0.2
                        OR similarity(first_name || ' ' || last_name, :s) > 0.2
                        OR levenshtein(LOWER(first_name), LOWER(:s)) <= 2
                        OR levenshtein(LOWER(last_name), LOWER(:s)) <= 2",
                    ['s' => $search]
                );

                if (!empty($similarIds)) {
                    // Update the where clause to include these IDs
                    $qb->orWhere('p.id IN (:similarIds)')
                       ->setParameter('similarIds', $similarIds);
                }
            }
        }

        // Determine Sort Order
        if (isset($filters['order']) && $filters['order'] === 'alpha') {
            $qb->orderBy('p.firstName', 'ASC')
               ->addOrderBy('p.lastName', 'ASC');
        } else {
            $qb->orderBy('p.id', 'DESC'); // Default: latest
        }

        // Fetch N+1 records to determine if there's a next page without a COUNT query
        $patients = $qb->setMaxResults($limit + 1)
                       ->setFirstResult($offset)
                       ->getQuery()
                       ->getResult();

        return array_map([$this, 'mapToResource'], $patients);
    }

    private function mapToResource(Patient $patient): PatientResource
    {
        $resource = new PatientResource();
        $resource->id = $patient->id;
        $resource->status = $patient->status;
        $resource->firstName = $patient->firstName;
        $resource->lastName = $patient->lastName;
        $resource->dateOfBirth = $patient->dateOfBirth;
        $resource->identityDocument = $patient->identityDocument;
        $resource->phone = $patient->phone;
        $resource->email = $patient->email;
        $resource->address = $patient->address;
        $resource->profession = $patient->profession;
        $resource->sportsActivity = $patient->sportsActivity;
        $resource->notes = $patient->notes;
        $resource->rate = $patient->rate;
        $resource->allergies = $patient->allergies;
        $resource->medication = $patient->medication;
        $resource->systemicDiseases = $patient->systemicDiseases;
        $resource->surgeries = $patient->surgeries;
        $resource->accidents = $patient->accidents;
        $resource->injuries = $patient->injuries;
        $resource->bruxism = $patient->bruxism;
        $resource->insoles = $patient->insoles;
        $resource->others = $patient->others;
        $resource->createdAt = $patient->createdAt;
        
        $resource->records = $patient->records->map(fn($record) => [
            'id' => $record->id,
            'createdAt' => $record->createdAt->format(\DateTimeInterface::ATOM),
            'physiotherapyTreatment' => $record->physiotherapyTreatment,
            'consultationReason' => $record->consultationReason,
            'currentSituation' => $record->currentSituation,
            'evolution' => $record->evolution,
            'radiologyTests' => $record->radiologyTests,
            'medicalTreatment' => $record->medicalTreatment,
            'homeTreatment' => $record->homeTreatment,
            'notes' => $record->notes,
            'sickLeave' => $record->sickLeave ?? false,
            'onset' => $record->onset,
        ])->toArray();
        
        return $resource;
    }
}