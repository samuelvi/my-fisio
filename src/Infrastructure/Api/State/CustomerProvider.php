<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Domain\Entity\Customer;
use App\Infrastructure\Api\Resource\CustomerResource;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\RequestStack;

final class CustomerProvider implements ProviderInterface
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly RequestStack $requestStack,
    ) {
    }

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): object|array|null
    {
        $repository = $this->entityManager->getRepository(Customer::class);

        if (isset($uriVariables['id'])) {
            $customer = $repository->find($uriVariables['id']);
            return $customer ? $this->mapToResource($customer) : null;
        }

        // Search and Filters from context (API Platform populated)
        $filters = $context['filters'] ?? [];
        $request = $this->requestStack->getCurrentRequest();
        
        // Ensure we capture query params even if API Platform doesn't
        $fullName = $filters['fullName'] ?? $request?->query->get('fullName');
        $taxId = $filters['taxId'] ?? $request?->query->get('taxId');
        $page = (int) ($filters['page'] ?? $request?->query->get('page', 1));
        $itemsPerPage = (int) ($filters['itemsPerPage'] ?? $request?->query->get('itemsPerPage', 10));
        
        $order = $filters['order'] ?? $request?->query->all()['order'] ?? null;
        
        $offset = ($page - 1) * $itemsPerPage;

        $qb = $repository->createQueryBuilder('c');

        if (!empty($fullName)) {
            $qb->andWhere('LOWER(c.fullName) LIKE LOWER(:fullName)')
               ->setParameter('fullName', '%' . $fullName . '%');
        }

        if (!empty($taxId)) {
            $qb->andWhere('LOWER(c.taxId) LIKE LOWER(:taxId)')
               ->setParameter('taxId', '%' . $taxId . '%');
        }

        // Apply dynamic order
        if (!empty($order) && is_array($order)) {
            foreach ($order as $field => $direction) {
                if (in_array($field, ['lastName', 'firstName', 'id', 'taxId', 'email'], true)) {
                    $qb->addOrderBy('c.' . $field, strtoupper((string)$direction) === 'DESC' ? 'DESC' : 'ASC');
                }
            }
        } else {
            $qb->orderBy('c.lastName', 'ASC')
               ->addOrderBy('c.firstName', 'ASC');
        }

        // Fetch N+1
        $qb->setFirstResult($offset)
           ->setMaxResults($itemsPerPage + 1);

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
