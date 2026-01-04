<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Doctrine\Repository;

use App\Domain\Entity\Customer;
use App\Domain\Repository\CustomerRepositoryInterface;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Customer>
 */
final class DoctrineCustomerRepository extends ServiceEntityRepository implements CustomerRepositoryInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Customer::class);
    }

    public function findOneByTaxId(string $taxId): ?Customer
    {
        return $this->findOneBy(['taxId' => $taxId]);
    }

    public function getByIdAsArray(int $id): ?array
    {
        return $this->createQueryBuilder('c')
            ->where('c.id = :id')
            ->setParameter('id', $id)
            ->getQuery()
            ->getOneOrNullResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
    }

    public function searchAsArray(array $filters, int $page, int $limit): array
    {
        $offset = ($page - 1) * $limit;
        $qb = $this->createQueryBuilder('c');

        if (!empty($filters['fullName'])) {
            $qb->andWhere('LOWER(c.fullName) LIKE LOWER(:fullName)')
               ->setParameter('fullName', '%' . $filters['fullName'] . '%');
        }

        if (!empty($filters['taxId'])) {
            $qb->andWhere('LOWER(c.taxId) LIKE LOWER(:taxId)')
               ->setParameter('taxId', '%' . $filters['taxId'] . '%');
        }

        if (!empty($filters['order']) && is_array($filters['order'])) {
            foreach ($filters['order'] as $field => $direction) {
                if (in_array($field, ['lastName', 'firstName', 'id', 'taxId', 'email'], true)) {
                    $qb->addOrderBy('c.' . $field, strtoupper((string)$direction) === 'DESC' ? 'DESC' : 'ASC');
                }
            }
        } else {
            $qb->orderBy('c.lastName', 'ASC')->addOrderBy('c.firstName', 'ASC');
        }

        return $qb->setFirstResult($offset)
            ->setMaxResults($limit + 1)
            ->getQuery()
            ->getArrayResult();
    }

    public function get(int $id): Customer
    {
        $customer = $this->find($id);
        if (!$customer) {
            throw new \RuntimeException(sprintf('Customer with id %d not found', $id));
        }
        return $customer;
    }

    public function save(Customer $customer): void
    {
        $this->getEntityManager()->persist($customer);
        $this->getEntityManager()->flush();
    }

    public function delete(Customer $customer): void
    {
        $this->getEntityManager()->remove($customer);
        $this->getEntityManager()->flush();
    }
}