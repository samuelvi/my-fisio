<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\Resource;

use ApiPlatform\Metadata\ApiProperty;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use App\Infrastructure\Api\State\InvoiceProvider;
use App\Infrastructure\Api\State\Processor\InvoiceCreateProcessor;
use App\Infrastructure\Api\State\Processor\InvoiceUpdateProcessor;
use DateTimeImmutable;
use Symfony\Component\Serializer\Attribute\Groups;

#[ApiResource(
    shortName: 'Invoice',
    operations: [
        new Get(name: 'api_invoices_get'),
        new GetCollection(name: 'api_invoices_collection'),
        new Post(name: 'api_invoices_post', processor: InvoiceCreateProcessor::class, input: InvoiceInput::class),
        new Put(name: 'api_invoices_put', processor: InvoiceUpdateProcessor::class, input: InvoiceInput::class),
    ],
    provider: InvoiceProvider::class,
    normalizationContext: ['groups' => ['invoice:read'], 'enable_max_depth' => true],
    denormalizationContext: ['groups' => ['invoice:write']],
    order: ['date' => 'DESC', 'number' => 'DESC'],
)]
class InvoiceResource
{
    #[ApiProperty(identifier: true)]
    #[Groups(['invoice:read'])]
    public ?int $id = null;

    #[Groups(['invoice:read', 'invoice:write'])]
    public string $number = '';

    #[Groups(['invoice:read'])]
    public ?string $formattedNumber = null;

    #[Groups(['invoice:read', 'invoice:write'])]
    public ?DateTimeImmutable $date = null;

    #[Groups(['invoice:read', 'invoice:write'])]
    public float $amount = 0.0;

    #[Groups(['invoice:read', 'invoice:write'])]
    public string $fullName = '';

    #[Groups(['invoice:read', 'invoice:write'])]
    public ?string $phone = null;

    #[Groups(['invoice:read', 'invoice:write'])]
    public ?string $address = null;

    #[Groups(['invoice:read', 'invoice:write'])]
    public ?string $email = null;

    #[Groups(['invoice:read', 'invoice:write'])]
    public ?string $taxId = null;

    #[Groups(['invoice:read', 'invoice:write'])]
    public ?string $customer = null; // IRI

    /**
     * @var array<int, array<string, mixed>>
     */
    #[Groups(['invoice:read'])]
    public array $lines = [];

    #[Groups(['invoice:read'])]
    public ?DateTimeImmutable $createdAt = null;
}
