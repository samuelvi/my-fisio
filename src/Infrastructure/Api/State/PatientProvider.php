<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Domain\Entity\Patient;
use App\Domain\Enum\PatientStatus;
use App\Infrastructure\Api\Resource\PatientResource;

use function count;

use DateTimeImmutable;
use DateTimeInterface;
use Doctrine\ORM\EntityManagerInterface;

use function sprintf;
use function strlen;

class PatientProvider implements ProviderInterface
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private int $itemsPerPage,
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
        $searchTermFull = '';
        if (isset($filters['search'])) {
            $search = $this->normalizeSearch((string) $filters['search']);
            if ('' !== $search) {
                $searchTermFull = '%'.$search.'%';
                $useFuzzy = isset($filters['fuzzy']) && ('true' === $filters['fuzzy'] || true === $filters['fuzzy'] || '1' === $filters['fuzzy']);

                $searchOr = $qb->expr()->orX();
                $searchOr->add('LOWER(p.fullName) = LOWER(:searchExact)');
                $searchOr->add('LOWER(p.email) = LOWER(:searchExact)');
                $searchOr->add('p.phone = :searchExact');
                $searchOr->add('LOWER(p.fullName) LIKE LOWER(:searchFull)');
                $searchOr->add('p.phone LIKE :searchFull');
                $searchOr->add('LOWER(p.email) LIKE LOWER(:searchFull)');
                $qb->setParameter('searchFull', $searchTermFull);
                $qb->setParameter('searchExact', $search);

                $tokens = $this->extractSearchTokens($search);
                if (count($tokens) > 1) {
                    $tokenAnd = $qb->expr()->andX();
                    foreach ($tokens as $index => $token) {
                        $param = 'searchToken'.$index;
                        $tokenAnd->add(sprintf('LOWER(p.fullName) LIKE LOWER(:%s)', $param));
                        $qb->setParameter($param, '%'.$token.'%');
                    }
                    $searchOr->add($tokenAnd);
                }

                if ($useFuzzy && strlen($search) >= 3) {
                    $conn = $this->entityManager->getConnection();
                    $maxDistance = $this->getMaxLevenshteinDistance($search);
                    $maxLength = $this->getMaxLevenshteinLength($search);
                    $similarIds = $conn->fetchFirstColumn(
                        'SELECT id FROM patients 
                         WHERE full_name % :s
                            OR first_name % :s
                            OR last_name % :s
                            OR email % :s
                            OR (
                                char_length(:s) <= :maxLength
                                AND (
                                    levenshtein_less_equal(first_name::text, :s::text, :maxDistance) <= :maxDistance
                                    OR levenshtein_less_equal(last_name::text, :s::text, :maxDistance) <= :maxDistance
                                )
                            )',
                        [
                            's' => $search,
                            'maxLength' => $maxLength,
                            'maxDistance' => $maxDistance,
                        ],
                    );

                    if (!empty($similarIds)) {
                        $searchOr->add('p.id IN (:similarIds)');
                        $qb->setParameter('similarIds', array_values(array_unique($similarIds)));
                    }
                }
                $qb->andWhere($searchOr);
                $qb->addOrderBy('CASE WHEN p.fullName = :searchExact OR p.email = :searchExact OR p.phone = :searchExact THEN 0 WHEN (p.fullName LIKE :searchFull OR p.email LIKE :searchFull OR p.phone LIKE :searchFull) THEN 1 ELSE 2 END', 'ASC');
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
            $finalQb->addOrderBy('CASE WHEN p.fullName = :searchExact OR p.email = :searchExact OR p.phone = :searchExact THEN 0 WHEN (p.fullName LIKE :searchFull OR p.email LIKE :searchFull OR p.phone LIKE :searchFull) THEN 1 ELSE 2 END', 'ASC')
                ->setParameter('searchExact', $search)
                ->setParameter('searchFull', $searchTermFull);
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

    /**
     * @return string[]
     */
    private function extractSearchTokens(string $search): array
    {
        $tokens = preg_split('/\s+/', $search) ?: [];
        $tokens = array_filter(array_map('trim', $tokens), static fn (string $token) => '' !== $token);

        return array_values(array_unique($tokens));
    }

    private function getMaxLevenshteinDistance(string $search): int
    {
        $length = strlen($search);
        if ($length <= 4) {
            return 1;
        }
        if ($length <= 6) {
            return 2;
        }

        return 3;
    }

    private function getMaxLevenshteinLength(string $search): int
    {
        $length = strlen($search);
        if ($length <= 6) {
            return 6;
        }
        if ($length <= 10) {
            return 8;
        }

        return 0;
    }
}
