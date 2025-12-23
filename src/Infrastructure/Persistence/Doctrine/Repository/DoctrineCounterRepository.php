<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Doctrine\Repository;

use App\Domain\Entity\Counter;
use App\Domain\Repository\CounterRepositoryInterface;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\DBAL\LockMode;
use Doctrine\Persistence\ManagerRegistry;
use ReflectionClass;

/**
 * @extends ServiceEntityRepository<Counter>
 */
final class DoctrineCounterRepository extends ServiceEntityRepository implements CounterRepositoryInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Counter::class);
    }

    public function findByName(string $name): ?Counter
    {
        $qb = $this->createQueryBuilder('c')
            ->where('c.name = :name')
            ->setParameter('name', $name);

        $result = $qb->getQuery()->getArrayResult();

        if (empty($result)) {
            return null;
        }

        $data = $result[0];

        $counter = Counter::create(
            name: $data['name'],
            value: $data['value']
        );

        $reflection = new ReflectionClass($counter);
        $idProp = $reflection->getProperty('id');
        $idProp->setValue($counter, $data['id']);

        return $counter;
    }

    public function incrementAndGetNext(string $name, string $initialValue): string
    {
        $em = $this->getEntityManager();

        /**
         * Cross-database compatible atomic increment using Pessimistic Locking.
         * Works on PostgreSQL, MySQL, Oracle, etc.
         */
        return $em->wrapInTransaction(function () use ($name, $initialValue, $em) {
            // 1. Fetch the counter with PESSIMISTIC_WRITE lock (SELECT ... FOR UPDATE)
            $counter = $this->createQueryBuilder('c')
                ->where('c.name = :name')
                ->setParameter('name', $name)
                ->getQuery()
                ->setLockMode(LockMode::PESSIMISTIC_WRITE)
                ->getOneOrNullResult();

            if (!$counter) {
                // 2. Create if not exists
                $counter = Counter::create($name, $initialValue);
                $em->persist($counter);
                $em->flush();
                return $initialValue;
            }

            // 3. Increment and save
            $currentValue = (int) $counter->value;
            $nextValue = (string) ($currentValue + 1);
            $counter->value = $nextValue;

            $em->flush();

            return $nextValue;
        });
    }
}