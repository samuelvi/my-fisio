<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Domain\Entity\Customer;
use App\Infrastructure\Api\Resource\CustomerResource;
use Doctrine\ORM\EntityManagerInterface;

final class CustomerProvider implements ProviderInterface
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): object|array|null
    {
        $repository = $this->entityManager->getRepository(Customer::class);

        if (isset($uriVariables['id'])) {
            $customer = $repository->find($uriVariables['id']);
            return $customer ? $this->mapToResource($customer) : null;
        }

        // Search and Filters
        $filters = $context['filters'] ?? [];
        $qb = $repository->createQueryBuilder('c');

        if (isset($filters['fullName'])) {
            $qb->andWhere('c.fullName LIKE :fullName')
               ->setParameter('fullName', '%' . $filters['fullName'] . '%');
        }

        if (isset($filters['taxId'])) {
            $qb->andWhere('c.taxId LIKE :taxId')
               ->setParameter('taxId', '%' . $filters['taxId'] . '%');
        }

        // Default order
        $qb->orderBy('c.lastName', 'ASC')
           ->addOrderBy('c.firstName', 'ASC');

        $customers = $qb->getQuery()->getResult();

        return array_map([$this, 'mapToResource'], $customers);
    }

    private function mapToResource(Customer $customer): CustomerResource
    {
        $resource = new CustomerResource();
        $resource->id = $customer->id;
        $resource->firstName = $customer->firstName;
        $resource->lastName = $customer->lastName;
        $resource->fullName = $customer->fullName;
        $resource->taxId = $customer->taxId;
        $resource->email = $customer->email;
        $resource->phone = $customer->phone;
        $resource->billingAddress = $customer->billingAddress;
        $resource->createdAt = $customer->createdAt instanceof \DateTimeImmutable ? $customer->createdAt : null;
        $resource->updatedAt = $customer->updatedAt instanceof \DateTimeImmutable ? $customer->updatedAt : null;

        return $resource;
    }
}
