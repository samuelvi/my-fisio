<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Doctrine\Repository;

use App\Domain\Entity\Record;
use App\Domain\Repository\RecordRepositoryInterface;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Record>
 */
final class DoctrineRecordRepository extends ServiceEntityRepository implements RecordRepositoryInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Record::class);
    }

    public function get(int $id): Record
    {
        $record = $this->find($id);
        if (!$record) {
            throw new \RuntimeException(sprintf('Record with id %d not found', $id));
        }
        return $record;
    }

    public function save(Record $record): void
    {
        $this->getEntityManager()->persist($record);
        $this->getEntityManager()->flush();
    }

    public function delete(Record $record): void
    {
        $this->getEntityManager()->remove($record);
        $this->getEntityManager()->flush();
    }

    public function getByIdAsArray(int $id): ?array
    {
        return $this->createQueryBuilder('r')
            ->select('r', 'p')
            ->leftJoin('r.patient', 'p')
            ->where('r.id = :id')
            ->setParameter('id', $id)
            ->getQuery()
            ->getOneOrNullResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
    }

    public function searchAsArray(array $filters): array
    {
        $qb = $this->createQueryBuilder('r')
            ->select('r', 'p')
            ->leftJoin('r.patient', 'p');

        if (isset($filters['patientId'])) {
            $qb->andWhere('p.id = :patientId')
               ->setParameter('patientId', $filters['patientId']);
        }

        return $qb->orderBy('r.createdAt', 'DESC')
            ->getQuery()
            ->getArrayResult();
    }
}
