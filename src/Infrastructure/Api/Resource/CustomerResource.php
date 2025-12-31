<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\Resource;

use ApiPlatform\Doctrine\Orm\Filter\OrderFilter;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiProperty;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Metadata\Delete;
use App\Infrastructure\Api\State\CustomerProcessor;
use App\Infrastructure\Api\State\CustomerProvider;
use App\Domain\Entity\Customer;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use DateTimeImmutable;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ApiResource(
    shortName: 'Customer',
    operations: [
        new Get(name: 'api_customers_item_get', uriTemplate: '/customers/{id}'),
        new GetCollection(name: 'api_customers_collection', uriTemplate: '/customers'),
        new Post(name: 'api_customers_post', uriTemplate: '/customers', processor: CustomerProcessor::class),
        new Put(name: 'api_customers_put', uriTemplate: '/customers/{id}', processor: CustomerProcessor::class),
        new Delete(name: 'api_customers_delete', uriTemplate: '/customers/{id}', processor: CustomerProcessor::class),
    ],
    provider: CustomerProvider::class,
    normalizationContext: ['groups' => ['customer:read']],
    denormalizationContext: ['groups' => ['customer:write']],
)]
#[ApiFilter(SearchFilter::class, properties: [
    'fullName' => 'ipartial',
    'taxId' => 'ipartial',
])]
#[ApiFilter(OrderFilter::class, properties: ['lastName', 'firstName'])]
class CustomerResource
{
    #[ApiProperty(identifier: true)]
    #[Groups(['customer:read'])]
    public ?int $id = null;

    #[Groups(['customer:read', 'customer:write'])]
    #[Assert\NotBlank(message: 'error_customer_first_name_required')]
    public string $firstName = '';

    #[Groups(['customer:read', 'customer:write'])]
    #[Assert\NotBlank(message: 'error_customer_last_name_required')]
    public string $lastName = '';

    #[Groups(['customer:read'])]
    public ?string $fullName = null;

    #[Groups(['customer:read', 'customer:write'])]
    #[Assert\NotBlank(message: 'error_customer_tax_id_required')]
    public string $taxId = '';

    #[Groups(['customer:read', 'customer:write'])]
    public ?string $email = null;

    #[Groups(['customer:read', 'customer:write'])]
    public ?string $phone = null;

    #[Groups(['customer:read', 'customer:write'])]
    #[Assert\NotBlank(message: 'error_customer_billing_address_required')]
    public ?string $billingAddress = null;

    #[Groups(['customer:read'])]
    public ?DateTimeImmutable $createdAt = null;

    #[Groups(['customer:read'])]
    public ?DateTimeImmutable $updatedAt = null;

    public function __construct()
    {
    }
}