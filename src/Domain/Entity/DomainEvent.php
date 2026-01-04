<?php

declare(strict_types=1);

namespace App\Domain\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * Domain Event Entity
 *
 * Stores business events following Event Sourcing patterns.
 * These events represent "something that happened" in the business domain.
 *
 * Standards followed:
 * - Event Sourcing (Greg Young, Martin Fowler)
 * - CQRS pattern
 * - Event-Driven Architecture
 */
#[ORM\Entity]
#[ORM\Table(name: 'domain_events')]
#[ORM\Index(columns: ['aggregate_type', 'aggregate_id', 'occurred_at'], name: 'idx_aggregate_stream')]
#[ORM\Index(columns: ['event_name', 'occurred_at'], name: 'idx_event_name')]
#[ORM\Index(columns: ['occurred_at'], name: 'idx_occurred')]
#[ORM\Index(columns: ['correlation_id'], name: 'idx_correlation')]
class DomainEvent
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: Types::BIGINT)]
    public ?int $id = null;

    /**
     * Unique identifier for this event (UUID)
     */
    #[ORM\Column(type: Types::STRING, length: 36, unique: true)]
    public string $eventId;

    /**
     * Name of the event (e.g., 'invoice.cancelled', 'patient.created')
     */
    #[ORM\Column(type: Types::STRING, length: 255)]
    public string $eventName;

    /**
     * Version of the event schema (for event evolution)
     */
    #[ORM\Column(type: Types::INTEGER)]
    public int $eventVersion = 1;

    /**
     * Type of aggregate/entity (e.g., 'Invoice', 'Patient')
     */
    #[ORM\Column(type: Types::STRING, length: 100)]
    public string $aggregateType;

    /**
     * ID of the aggregate/entity
     */
    #[ORM\Column(type: Types::STRING, length: 100)]
    public string $aggregateId;

    /**
     * Complete event data (all information needed to process the event)
     */
    #[ORM\Column(type: Types::JSON)]
    public array $payload;

    /**
     * Additional metadata (IP, user agent, source, etc.)
     */
    #[ORM\Column(type: Types::JSON, nullable: true)]
    public ?array $metadata = null;

    /**
     * When the event occurred (business time)
     */
    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    public \DateTimeImmutable $occurredAt;

    /**
     * When the event was recorded in the database (technical time)
     */
    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    public \DateTimeImmutable $recordedAt;

    /**
     * User who triggered the event (null for system events)
     */
    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    public ?User $user = null;

    /**
     * Correlation ID to track related operations
     */
    #[ORM\Column(type: Types::STRING, length: 36, nullable: true)]
    public ?string $correlationId = null;

    /**
     * ID of the event that caused this event (causality chain)
     */
    #[ORM\Column(type: Types::STRING, length: 36, nullable: true)]
    public ?string $causationId = null;

    /**
     * Create a new domain event
     */
    public static function create(
        string $eventName,
        string $aggregateType,
        string $aggregateId,
        array $payload,
        ?User $user = null,
        ?array $metadata = null,
        ?string $correlationId = null,
        ?string $causationId = null
    ): self {
        $event = new self();
        $event->eventId = self::generateUuid();
        $event->eventName = $eventName;
        $event->aggregateType = $aggregateType;
        $event->aggregateId = (string) $aggregateId;
        $event->payload = $payload;
        $event->metadata = $metadata;
        $event->occurredAt = new \DateTimeImmutable();
        $event->recordedAt = new \DateTimeImmutable();
        $event->user = $user;
        $event->correlationId = $correlationId;
        $event->causationId = $causationId;

        return $event;
    }

    /**
     * Generate a UUID v4
     */
    private static function generateUuid(): string
    {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40); // Version 4
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80); // Variant

        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }

    /**
     * Add metadata to the event
     */
    public function addMetadata(string $key, mixed $value): self
    {
        if (null === $this->metadata) {
            $this->metadata = [];
        }

        $this->metadata[$key] = $value;

        return $this;
    }

    /**
     * Get a metadata value
     */
    public function getMetadata(string $key): mixed
    {
        return $this->metadata[$key] ?? null;
    }

    /**
     * Get a payload value
     */
    public function getPayloadValue(string $key): mixed
    {
        return $this->payload[$key] ?? null;
    }
}
