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

    public function get(int $id): Appointment
    {
        $appointment = $this->find($id);
        if (!$appointment) {
            throw new \RuntimeException(sprintf('Appointment with id %d not found', $id));
        }
        return $appointment;
    }

    public function delete(Appointment $appointment): void
    {
        $this->getEntityManager()->remove($appointment);
        $this->getEntityManager()->flush();
    }

    public function getByIdAsArray(int $id): ?array
    {
        return $this->createQueryBuilder('a')
            ->select('a', 'p')
            ->leftJoin('a.patient', 'p')
            ->where('a.id = :id')
            ->setParameter('id', $id)
            ->getQuery()
            ->getOneOrNullResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
    }

    public function searchAsArray(array $filters): array
    {
        $qb = $this->createQueryBuilder('a')
            ->select('a', 'p')
            ->leftJoin('a.patient', 'p');

        if (isset($filters['startsAt'])) {
            $qb->andWhere('a.startsAt >= :start')
               ->setParameter('start', $filters['startsAt']);
        }

        if (isset($filters['endsAt'])) {
            $qb->andWhere('a.endsAt <= :end')
               ->setParameter('end', $filters['endsAt']);
        }

        if (isset($filters['patientId'])) {
            $qb->andWhere('a.patient = :patientId')
               ->setParameter('patientId', $filters['patientId']);
        }

        return $qb->getQuery()->getArrayResult();
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

    public function existsAppointmentsInDateRange(DateTimeInterface $start, DateTimeInterface $end): bool
    {
        $result = $this->createQueryBuilder('a')
            ->select('1')
            ->where('a.startsAt < :end')
            ->andWhere('a.endsAt > :start')
            ->setParameter('start', $start)
            ->setParameter('end', $end)
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();

        return $result !== null;
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
