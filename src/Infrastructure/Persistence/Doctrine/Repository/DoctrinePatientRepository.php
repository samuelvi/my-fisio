<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Doctrine\Repository;

use App\Domain\Entity\Patient;
use App\Domain\Repository\PatientRepositoryInterface;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Patient>
 */
final class DoctrinePatientRepository extends ServiceEntityRepository implements PatientRepositoryInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Patient::class);
    }

    public function countAll(): int
    {
        $qb = $this->createQueryBuilder('p')
            ->select('COUNT(p.id) as total');

        $result = $qb->getQuery()->getArrayResult();

        return (int) ($result[0]['total'] ?? 0);
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
