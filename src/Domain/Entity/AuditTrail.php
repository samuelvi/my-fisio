<?php

declare(strict_types=1);

namespace App\Domain\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use ApiPlatform\Doctrine\Orm\Filter\OrderFilter;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

/**
 * Audit Trail Entity
 *
 * Records technical changes to entities for compliance and debugging.
 * Captures WHAT changed (before/after values) for audit purposes.
 *
 * Standards followed:
 * - Audit Logging best practices
 * - Compliance requirements (GDPR, SOX, HIPAA)
 * - Immutable audit trail pattern
 */
#[ORM\Entity]
#[ORM\Table(name: 'audit_trail')]
#[ORM\Index(columns: ['entity_type', 'entity_id', 'changed_at'], name: 'idx_entity')]
#[ORM\Index(columns: ['operation', 'changed_at'], name: 'idx_operation')]
#[ORM\Index(columns: ['changed_by', 'changed_at'], name: 'idx_changed_by')]
#[ORM\Index(columns: ['changed_at'], name: 'idx_changed_at')]
#[ApiResource(
    operations: [
        new GetCollection(),
        new Get(),
    ],
    normalizationContext: ['groups' => ['audit:read']],
    paginationItemsPerPage: 30,
)]
#[ApiFilter(SearchFilter::class, properties: ['entityType' => 'exact', 'entityId' => 'exact', 'operation' => 'exact'])]
#[ApiFilter(OrderFilter::class, properties: ['changedAt', 'id'])]
class AuditTrail
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: Types::BIGINT)]
    #[Groups(['audit:read'])]
    public ?int $id = null;

    /**
     * Type of entity that was changed (e.g., 'Patient', 'Invoice')
     */
    #[ORM\Column(type: Types::STRING, length: 100)]
    #[Groups(['audit:read'])]
    public string $entityType;

    /**
     * ID of the entity that was changed
     */
    #[ORM\Column(type: Types::STRING, length: 100)]
    #[Groups(['audit:read'])]
    public string $entityId;

    /**
     * Operation performed: created, updated, deleted
     */
    #[ORM\Column(type: Types::STRING, length: 20)]
    #[Groups(['audit:read'])]
    public string $operation;

    /**
     * Changes made (before/after values)
     * Structure: { "field": { "before": value, "after": value } }
     */
    #[ORM\Column(type: Types::JSON)]
    #[Groups(['audit:read'])]
    public array $changes;

    /**
     * When the change occurred
     */
    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['audit:read'])]
    public \DateTimeImmutable $changedAt;

    /**
     * User who made the change (null for system changes)
     */
    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'changed_by', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    #[Groups(['audit:read'])]
    public ?User $changedBy = null;

    /**
     * IP address of the user
     */
    #[ORM\Column(type: Types::STRING, length: 45, nullable: true)]
    #[Groups(['audit:read'])]
    public ?string $ipAddress = null;

    /**
     * User agent string
     */
    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['audit:read'])]
    public ?string $userAgent = null;

    /**
     * Create a new audit trail entry
     */
    public static function create(
        string $entityType,
        string $entityId,
        string $operation,
        array $changes,
        ?User $changedBy = null,
        ?string $ipAddress = null,
        ?string $userAgent = null
    ): self {
        $audit = new self();
        $audit->entityType = $entityType;
        $audit->entityId = (string) $entityId;
        $audit->operation = $operation;
        $audit->changes = $changes;
        $audit->changedAt = new \DateTimeImmutable();
        $audit->changedBy = $changedBy;
        $audit->ipAddress = $ipAddress;
        $audit->userAgent = $userAgent;

        return $audit;
    }

    /**
     * Get the entity class name without namespace
     */
    public function getEntityShortName(): string
    {
        $parts = explode('\\', $this->entityType);

        return end($parts);
    }

    /**
     * Check if a specific field was changed
     */
    public function hasFieldChanged(string $field): bool
    {
        return isset($this->changes[$field]);
    }

    /**
     * Get the old value of a field
     */
    public function getOldValue(string $field): mixed
    {
        return $this->changes[$field]['before'] ?? null;
    }

    /**
     * Get the new value of a field
     */
    public function getNewValue(string $field): mixed
    {
        return $this->changes[$field]['after'] ?? null;
    }

    /**
     * Get all changed field names
     */
    public function getChangedFields(): array
    {
        return array_keys($this->changes);
    }
}