<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\Resource;

use ApiPlatform\Metadata\ApiProperty;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use App\Infrastructure\Api\State\RecordProcessor;
use App\Infrastructure\Api\State\RecordProvider;
use DateTimeImmutable;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ApiResource(
    shortName: 'Record',
    operations: [
        new Get(name: 'api_records_get'),
        new GetCollection(name: 'api_records_collection'),
        new Post(name: 'api_records_post', processor: RecordProcessor::class),
        new Put(name: 'api_records_put', processor: RecordProcessor::class),
    ],
    provider: RecordProvider::class,
    normalizationContext: ['groups' => ['record:read']],
    denormalizationContext: ['groups' => ['record:write']],
)]
class RecordResource
{
    #[ApiProperty(identifier: true)]
    #[Groups(['record:read'])]
    public ?int $id = null;

    #[Groups(['record:read', 'record:write'])]
    public ?string $patient = null;

    #[Groups(['record:read', 'record:write'])]
    #[Assert\NotBlank(normalizer: 'trim', message: 'record_physiotherapy_treatment_required')]
    public string $physiotherapyTreatment = '';

    #[Groups(['record:read', 'record:write'])]
    public ?string $consultationReason = null;

    #[Groups(['record:read', 'record:write'])]
    public ?string $currentSituation = null;

    #[Groups(['record:read', 'record:write'])]
    public ?string $evolution = null;

    #[Groups(['record:read', 'record:write'])]
    public ?string $radiologyTests = null;

    #[Groups(['record:read', 'record:write'])]
    public ?string $medicalTreatment = null;

    #[Groups(['record:read', 'record:write'])]
    public ?string $homeTreatment = null;

    #[Groups(['record:read', 'record:write'])]
    public ?string $onset = null;

    #[Groups(['record:read', 'record:write'])]
    public ?string $notes = null;

    #[Groups(['record:read', 'record:write'])]
    public ?bool $sickLeave = false;

    #[Groups(['record:read', 'record:write'])]
    public ?DateTimeImmutable $createdAt = null;

    public function __construct()
    {
    }
}
