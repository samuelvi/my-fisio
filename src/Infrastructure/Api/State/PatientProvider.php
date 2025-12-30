<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Domain\Entity\Patient;
use App\Domain\Enum\PatientStatus;
use App\Infrastructure\Api\Resource\PatientResource;
use App\Infrastructure\Search\PatientSearchStrategyFactory;
use App\Infrastructure\Search\PatientSearchStrategyInterface;
use DateTimeImmutable;
use DateTimeInterface;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;

class PatientProvider implements ProviderInterface
{
    private PatientSearchStrategyInterface $searchStrategy;

    public function __construct(
        private readonly Connection $connection,
        private readonly EntityManagerInterface $entityManager,
        private readonly int $itemsPerPage,
    ) {
        $this->searchStrategy = PatientSearchStrategyFactory::create(connection: $connection);
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

        if (isset($filters['status']) && 'all' !== $filters['status']) {
            $statusEnum = PatientStatus::tryFrom($filters['status']);
            if ($statusEnum) {
                $qb->andWhere('p.status = :status')
                   ->setParameter('status', $statusEnum->value);
            }
        } elseif (!isset($filters['status'])) {
            $qb->andWhere('p.status = :status')
               ->setParameter('status', PatientStatus::ACTIVE->value);
        }

        $hasSearch = false;
        $search = '';
        if (isset($filters['search'])) {
            $search = $this->normalizeSearch((string) $filters['search']);
            if ('' !== $search) {
                $useFuzzy = isset($filters['fuzzy']) && ('true' === $filters['fuzzy'] || true === $filters['fuzzy'] || '1' === $filters['fuzzy']);

                // Use database-specific search strategy
                $this->searchStrategy->applySearchConditions($qb, $search, $useFuzzy);
                $this->searchStrategy->applySearchOrdering($qb, $search);
                $hasSearch = true;
            }
        }

        if (isset($filters['order']) && 'alpha' === $filters['order']) {
            if ($hasSearch) {
                $qb->addOrderBy('p.firstName', 'ASC')->addOrderBy('p.lastName', 'ASC');
            } else {
                $qb->orderBy('p.firstName', 'ASC')->addOrderBy('p.lastName', 'ASC');
            }
        } else {
            if ($hasSearch) {
                $qb->addOrderBy('p.id', 'DESC');
            } else {
                $qb->orderBy('p.id', 'DESC');
            }
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

        if ($hasSearch) {
            // Re-apply search ordering for the final query
            $this->searchStrategy->applySearchOrdering($finalQb, $search);
            // Re-set search parameters for the final query
            $finalQb->setParameter('searchExact', $search)
                ->setParameter('searchFull', '%'.$search.'%');
        }

        if (isset($filters['order']) && 'alpha' === $filters['order']) {
            if ($hasSearch) {
                $finalQb->addOrderBy('p.firstName', 'ASC')->addOrderBy('p.lastName', 'ASC');
            } else {
                $finalQb->orderBy('p.firstName', 'ASC')->addOrderBy('p.lastName', 'ASC');
            }
        } else {
            if ($hasSearch) {
                $finalQb->addOrderBy('p.id', 'DESC');
            } else {
                $finalQb->orderBy('p.id', 'DESC');
            }
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
        $resource->taxId = $data['taxId'] ?? null;
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

        $resource->createdAt = $data['createdAt'] instanceof DateTimeInterface
            ? DateTimeImmutable::createFromInterface($data['createdAt'])
            : new DateTimeImmutable($data['createdAt']);

        $resource->records = array_map(function ($r) {
            $recordCreatedAt = $r['createdAt'] instanceof DateTimeInterface
                ? $r['createdAt']
                : new DateTimeImmutable($r['createdAt']);

            return [
                'id' => $r['id'],
                'createdAt' => $recordCreatedAt->format(DateTimeInterface::ATOM),
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

    private function normalizeSearch(string $search): string
    {
        $search = trim($search);

        return preg_replace('/\s+/', ' ', $search) ?? '';
    }
}
