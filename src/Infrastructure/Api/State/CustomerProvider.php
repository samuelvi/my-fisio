<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Infrastructure\Api\Resource\CustomerResource;
use App\Infrastructure\Persistence\Doctrine\Repository\DoctrineCustomerRepository;
use Symfony\Component\HttpFoundation\RequestStack;

final class CustomerProvider implements ProviderInterface
{
    public function __construct(
        private readonly DoctrineCustomerRepository $repository,
        private readonly RequestStack $requestStack,
    ) {
    }

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): object|array|null
    {
        if (isset($uriVariables['id'])) {
            $result = $this->repository->getByIdAsArray((int) $uriVariables['id']);
            return $result ? $this->mapToResource($result) : null;
        }

        $filters = $context['filters'] ?? [];
        $request = $this->requestStack->getCurrentRequest();
        
        $fullName = $filters['fullName'] ?? $request?->query->get('fullName');
        $taxId = $filters['taxId'] ?? $request?->query->get('taxId');
        $page = (int) ($filters['page'] ?? $request?->query->get('page', 1));
        $itemsPerPage = (int) ($filters['itemsPerPage'] ?? $request?->query->get('itemsPerPage', 10));
        $order = $filters['order'] ?? $request?->query->all()['order'] ?? null;

        $searchFilters = [
            'fullName' => $fullName,
            'taxId' => $taxId,
            'order' => $order,
        ];

        $customers = $this->repository->searchAsArray($searchFilters, $page, $itemsPerPage);
        
        return array_map([$this, 'mapToResource'], $customers);
    }

    private function mapToResource(array $data): CustomerResource
    {
        $resource = new CustomerResource();
        $resource->id = $data['id'];
        $resource->firstName = $data['firstName'];
        $resource->lastName = $data['lastName'];
        $resource->fullName = $data['fullName'];
        $resource->taxId = $data['taxId'];
        $resource->email = $data['email'] ?? null;
        $resource->phone = $data['phone'] ?? null;
        $resource->billingAddress = $data['billingAddress'] ?? null;
        
        $resource->createdAt = $data['createdAt'] instanceof \DateTimeInterface 
            ? \DateTimeImmutable::createFromInterface($data['createdAt']) 
            : new \DateTimeImmutable($data['createdAt']);
            
        $resource->updatedAt = isset($data['updatedAt']) 
            ? ($data['updatedAt'] instanceof \DateTimeInterface 
                ? \DateTimeImmutable::createFromInterface($data['updatedAt']) 
                : new \DateTimeImmutable($data['updatedAt']))
            : null;

        return $resource;
    }
}
