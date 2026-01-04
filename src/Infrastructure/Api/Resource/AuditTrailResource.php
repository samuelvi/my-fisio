<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\Resource;

use ApiPlatform\Metadata\ApiProperty;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use App\Infrastructure\Api\State\AuditTrailProvider;
use DateTimeImmutable;
use Symfony\Component\Serializer\Attribute\Groups;

#[ApiResource(
    shortName: 'AuditTrail',
    operations: [
        new Get(name: 'api_audit_trails_get'),
        new GetCollection(name: 'api_audit_trails_collection'),
    ],
    provider: AuditTrailProvider::class,
    normalizationContext: ['groups' => ['audit:read']],
)]
class AuditTrailResource
{
    #[ApiProperty(identifier: true)]
    #[Groups(['audit:read'])]
    public ?int $id = null;

    #[Groups(['audit:read'])]
    public string $entityType = '';

    #[Groups(['audit:read'])]
    public string $entityId = '';

    #[Groups(['audit:read'])]
    public string $operation = '';

    #[Groups(['audit:read'])]
    public array $changes = [];

    #[Groups(['audit:read'])]
    public ?DateTimeImmutable $changedAt = null;

    #[Groups(['audit:read'])]
    public ?string $changedBy = null;

    #[Groups(['audit:read'])]
    public ?string $ipAddress = null;

    #[Groups(['audit:read'])]
    public ?string $userAgent = null;
}
