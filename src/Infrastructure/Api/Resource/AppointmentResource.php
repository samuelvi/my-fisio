<?php

namespace App\Infrastructure\Api\Resource;

use ApiPlatform\Metadata\ApiProperty;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Metadata\Delete;
use App\Infrastructure\Api\State\AppointmentProvider;
use App\Infrastructure\Api\State\AppointmentProcessor;
use Symfony\Component\Serializer\Attribute\Groups;

use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;

#[ApiResource(
    shortName: 'Appointment',
    operations: [
        new Get(),
        new GetCollection(),
        new Post(processor: AppointmentProcessor::class),
        new Put(processor: AppointmentProcessor::class),
        new Delete(processor: AppointmentProcessor::class)
    ],
    provider: AppointmentProvider::class,
    normalizationContext: ['groups' => ['appointment:read']],
    denormalizationContext: ['groups' => ['appointment:write']],
    paginationEnabled: false
)]
#[ApiFilter(SearchFilter::class, properties: ['patientId' => 'exact'])]
class AppointmentResource
{
    #[ApiProperty(identifier: true)]
    #[Groups(['appointment:read'])]
    public ?int $id = null;

    #[Groups(['appointment:read', 'appointment:write'])]
    public ?int $patientId = null;

    #[Groups(['appointment:read'])]
    public ?string $patientName = null;

    #[Groups(['appointment:read', 'appointment:write'])]
    public int $userId;

    #[Groups(['appointment:read', 'appointment:write'])]
    public ?string $title = null;

    #[Groups(['appointment:read', 'appointment:write'])]
    public ?bool $allDay = null;

    #[Groups(['appointment:read', 'appointment:write'])]
    public \DateTimeImmutable $startsAt;

    #[Groups(['appointment:read', 'appointment:write'])]
    public \DateTimeImmutable $endsAt;

    #[Groups(['appointment:read', 'appointment:write'])]
    public ?string $notes = null;

    #[Groups(['appointment:read', 'appointment:write'])]
    public ?string $type = null;

    #[Groups(['appointment:read'])]
    public ?\DateTimeImmutable $createdAt = null;

    public function __construct() {}
}