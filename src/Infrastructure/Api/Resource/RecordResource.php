<?php

namespace App\Infrastructure\Api\Resource;

use ApiPlatform\Metadata\ApiProperty;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use App\Infrastructure\Api\State\RecordProvider;
use App\Infrastructure\Api\State\RecordProcessor;
use Symfony\Component\Serializer\Attribute\Groups;

#[ApiResource(
    shortName: 'Record',
    operations: [
        new Get(),
        new GetCollection(),
        new Post(processor: RecordProcessor::class),
        new Put(processor: RecordProcessor::class)
    ],
    provider: RecordProvider::class,
    normalizationContext: ['groups' => ['record:read']],
    denormalizationContext: ['groups' => ['record:write']]
)]
class RecordResource
{
    #[ApiProperty(identifier: true)]
    #[Groups(['record:read'])]
    public ?int $id = null;

    #[Groups(['record:read', 'record:write'])]
    public string $patient; // IRI format expected by API Platform /api/patients/{id}

    #[Groups(['record:read', 'record:write'])]
    public string $physiotherapyTreatment;

    #[Groups(['record:read'])]
    public ?\DateTimeImmutable $createdAt = null;
}
