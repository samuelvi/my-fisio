<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Doctrine\Repository;

use App\Domain\Entity\Appointment;
use App\Domain\Enum\AppointmentType;
use App\Domain\Repository\AppointmentRepositoryInterface;
use DateTimeInterface;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Appointment>
 */
final class DoctrineAppointmentRepository extends ServiceEntityRepository implements AppointmentRepositoryInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Appointment::class);
    }

    public function countByDateAndType(DateTimeInterface $date, AppointmentType $type): int
    {
        $start = $date->format('Y-m-d 00:00:00');
        $end = $date->format('Y-m-d 23:59:59');

        $qb = $this->createQueryBuilder('a')
            ->select('COUNT(a.id) as total')
            ->where('a.startsAt >= :start')
            ->andWhere('a.startsAt <= :end')
            ->andWhere('a.type = :type')
            ->setParameter('start', $start)
            ->setParameter('end', $end)
            ->setParameter('type', $type->value);

        $result = $qb->getQuery()->getArrayResult();

        return (int) ($result[0]['total'] ?? 0);
    }

    public function save(Appointment $appointment): void
    {
        $this->getEntityManager()->persist($appointment);
        $this->getEntityManager()->flush();
    }

    public function countAppointmentsInDateRange(DateTimeInterface $start, DateTimeInterface $end): int
    {
        $qb = $this->createQueryBuilder('a')
            ->select('COUNT(a.id) as total')
            ->where('a.startsAt >= :start')
            ->andWhere('a.endsAt <= :end')
            ->setParameter('start', $start)
            ->setParameter('end', $end);

        $result = $qb->getQuery()->getArrayResult();

        return (int) ($result[0]['total'] ?? 0);
    }

    public function deleteEmptyGapsInDateRange(DateTimeInterface $start, DateTimeInterface $end): int
    {
        $qb = $this->createQueryBuilder('a')
            ->delete()
            ->where('a.startsAt >= :start')
            ->andWhere('a.endsAt <= :end')
            ->andWhere('a.title IS NULL OR a.title = :emptyString')
            ->setParameter('start', $start)
            ->setParameter('end', $end)
            ->setParameter('emptyString', '');

        return $qb->getQuery()->execute();
    }
}
