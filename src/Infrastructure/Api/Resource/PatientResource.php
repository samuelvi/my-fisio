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
use Symfony\Component\Serializer\Attribute\Groups;

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
class PatientResource
{
    #[ApiProperty(identifier: true)]
    #[Groups(['patient:read'])]
    public ?int $id = null;

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
}