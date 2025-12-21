<?php

namespace App\Infrastructure\Api\Resource;

use ApiPlatform\Metadata\ApiProperty;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use App\Infrastructure\Api\State\PatientProvider;
use App\Infrastructure\Api\State\PatientProcessor;
use App\Domain\Enum\PatientStatus;
use Symfony\Component\Serializer\Attribute\Groups;

use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Doctrine\Orm\Filter\BooleanFilter;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;

#[ApiResource(
    shortName: 'Patient',
    operations: [
        new Get(),
        new GetCollection(),
        new Post(processor: PatientProcessor::class),
        new Put(processor: PatientProcessor::class)
    ],
    provider: PatientProvider::class,
    normalizationContext: ['groups' => ['patient:read']],
    denormalizationContext: ['groups' => ['patient:write']]
)]
#[ApiFilter(SearchFilter::class, properties: ['status' => 'exact'])]
class PatientResource
{
    #[ApiProperty(identifier: true)]
    #[Groups(['patient:read'])]
    public ?int $id = null;

    #[Groups(['patient:read', 'patient:write'])]
    public PatientStatus $status = PatientStatus::ACTIVE;

    #[Groups(['patient:read', 'patient:write'])]
    public string $firstName;

    #[Groups(['patient:read', 'patient:write'])]
    public string $lastName;

    #[Groups(['patient:read', 'patient:write'])]
    public ?string $phone = null;

    #[Groups(['patient:read', 'patient:write'])]
    public ?string $email = null;

    #[Groups(['patient:read'])]
    public ?\DateTimeImmutable $createdAt = null;

    /** @var array<int, mixed> */
    #[Groups(['patient:read'])]
    public array $records = [];
}