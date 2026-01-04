<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Infrastructure\Api\Resource\InvoiceResource;
use App\Infrastructure\Persistence\Doctrine\Repository\DoctrineInvoiceRepository;
use DateTimeImmutable;
use DateTimeInterface;
use Symfony\Component\HttpFoundation\RequestStack;

final class InvoiceProvider implements ProviderInterface
{
    public function __construct(
        private readonly DoctrineInvoiceRepository $repository,
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
        $number = $filters['number'] ?? $request?->query->get('number');
        $page = (int) ($filters['page'] ?? $request?->query->get('page', 1));
        $itemsPerPage = (int) ($filters['itemsPerPage'] ?? $request?->query->get('itemsPerPage', 30));
        $order = $filters['order'] ?? $request?->query->all()['order'] ?? null;

        $searchFilters = [
            'fullName' => $fullName,
            'taxId' => $taxId,
            'number' => $number,
            'order' => $order,
        ];

        $invoices = $this->repository->searchAsArray($searchFilters, $page, $itemsPerPage);
        
        return array_map([$this, 'mapToResource'], $invoices);
    }

    private function mapToResource(array $data): InvoiceResource
    {
        $resource = new InvoiceResource();
        $resource->id = $data['id'];
        $resource->number = $data['number'];
        $resource->fullName = $data['fullName'];
        $resource->taxId = $data['taxId'] ?? null;
        $resource->amount = (float) $data['amount'];
        $resource->phone = $data['phone'] ?? null;
        $resource->address = $data['address'] ?? null;
        $resource->email = $data['email'] ?? null;
        
        $resource->date = $data['date'] instanceof DateTimeInterface 
            ? DateTimeImmutable::createFromInterface($data['date']) 
            : new DateTimeImmutable($data['date']);
            
        $resource->createdAt = $data['createdAt'] instanceof DateTimeInterface 
            ? DateTimeImmutable::createFromInterface($data['createdAt']) 
            : new DateTimeImmutable($data['createdAt']);

        if (isset($data['customer'])) {
            $resource->customer = '/api/customers/' . $data['customer']['id'];
        }

        if (isset($data['lines'])) {
            $resource->lines = array_map(function (array $line) {
                return [
                    'id' => $line['id'],
                    'concept' => $line['concept'],
                    'description' => $line['description'],
                    'quantity' => $line['quantity'],
                    'price' => (float) $line['price'],
                    'amount' => (float) $line['amount'],
                ];
            }, $data['lines']);
        }

        return $resource;
    }
}
