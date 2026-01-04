<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Doctrine\Repository;

use App\Domain\Entity\Patient;
use App\Domain\Enum\PatientStatus;
use App\Domain\Repository\PatientRepositoryInterface;
use App\Infrastructure\Search\PatientSearchStrategyFactory;
use App\Infrastructure\Search\PatientSearchStrategyInterface;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\DBAL\Connection;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Patient>
 */
final class DoctrinePatientRepository extends ServiceEntityRepository implements PatientRepositoryInterface
{
    private PatientSearchStrategyInterface $searchStrategy;

    public function __construct(ManagerRegistry $registry, Connection $connection)
    {
        parent::__construct($registry, Patient::class);
        $this->searchStrategy = PatientSearchStrategyFactory::create(connection: $connection);
    }

    public function countAll(): int
    {
        $qb = $this->createQueryBuilder('p')
            ->select('COUNT(p.id) as total');

        $result = $qb->getQuery()->getArrayResult();

        return (int) ($result[0]['total'] ?? 0);
    }

    public function getByIdAsArray(int $id): ?array
    {
        $qb = $this->createQueryBuilder('p')
            ->select('p', 'r')
            ->leftJoin('p.records', 'r')
            ->where('p.id = :id')
            ->setParameter('id', $id);

        $result = $qb->getQuery()->getArrayResult();

        return $result[0] ?? null;
    }

    public function searchAsArray(array $filters, int $page, int $limit): array
    {
        $offset = ($page - 1) * $limit;

        // 1. Get IDs
        $qb = $this->createQueryBuilder('p')->select('p.id');

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
        if (isset($filters['search']) && '' !== trim((string) $filters['search'])) {
            $search = trim(preg_replace('/\s+/', ' ', (string) $filters['search']) ?? '');
            $useFuzzy = isset($filters['fuzzy']) && ('true' === $filters['fuzzy'] || true === $filters['fuzzy'] || '1' === $filters['fuzzy']);

            $this->searchStrategy->applySearchConditions($qb, $search, $useFuzzy);
            $this->searchStrategy->applySearchOrdering($qb, $search);
            $hasSearch = true;
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

        // 2. Fetch full data
        $finalQb = $this->createQueryBuilder('p')
            ->select('p', 'r')
            ->leftJoin('p.records', 'r')
            ->where('p.id IN (:ids)')
            ->setParameter('ids', $ids);

        if ($hasSearch) {
            $this->searchStrategy->applySearchOrdering($finalQb, $search);
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

        return $finalQb->getQuery()->getArrayResult();
    }

    public function get(int $id): Patient
    {
        /** @var Patient|null $patient */
        $patient = $this->find($id);
        if (!$patient) {
            throw new \RuntimeException(sprintf('Patient with id %d not found', $id));
        }
        return $patient;
    }

    public function save(Patient $patient): void
    {
        $this->getEntityManager()->persist($patient);
        $this->getEntityManager()->flush();
    }

    public function delete(Patient $patient): void
    {
        $this->getEntityManager()->remove($patient);
        $this->getEntityManager()->flush();
    }

    #[\Override]
    public function findForInvoicePrefill(int $id): ?array
    {
        $qb = $this->createQueryBuilder('p')
            ->select('p.fullName', 'p.taxId', 'p.email', 'p.phone', 'p.address')
            ->where('p.id = :id')
            ->setParameter('id', $id);

        $result = $qb->getQuery()->getArrayResult();

        return $result[0] ?? null;
    }
}
