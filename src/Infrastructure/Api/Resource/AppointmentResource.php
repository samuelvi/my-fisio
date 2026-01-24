<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\Resource;

use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiProperty;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use App\Infrastructure\Api\State\AppointmentProcessor;
use App\Infrastructure\Api\State\AppointmentProvider;
use DateTimeImmutable;
use Symfony\Component\Serializer\Attribute\Groups;

#[ApiResource(
    shortName: 'Appointment',
    operations: [
        new Get(name: 'api_appointments_get'),
        new GetCollection(name: 'api_appointments_collection'),
        new Post(name: 'api_appointments_post', processor: AppointmentProcessor::class),
        new Put(name: 'api_appointments_put', processor: AppointmentProcessor::class),
        new Delete(name: 'api_appointments_delete', processor: AppointmentProcessor::class),
    ],
    provider: AppointmentProvider::class,
    normalizationContext: ['groups' => ['appointment:read']],
    denormalizationContext: ['groups' => ['appointment:write']],
    paginationEnabled: false,
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

    #[Groups(['appointment:read'])]
    public ?int $userId = null;

    #[Groups(['appointment:read', 'appointment:write'])]
    public ?string $title = null;

    #[Groups(['appointment:read', 'appointment:write'])]
    public ?bool $allDay = null;

    #[Groups(['appointment:read', 'appointment:write'])]
    public DateTimeImmutable $startsAt;

    #[Groups(['appointment:read', 'appointment:write'])]
    public DateTimeImmutable $endsAt;

    #[Groups(['appointment:read', 'appointment:write'])]
    public ?string $notes = null;

    #[Groups(['appointment:read', 'appointment:write'])]
    public ?string $type = null;

    #[Groups(['appointment:read'])]
    public ?DateTimeImmutable $createdAt = null;

    public function __construct()
    {
        $this->startsAt = new DateTimeImmutable();
        $this->endsAt = new DateTimeImmutable();
    }
}
