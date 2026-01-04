<?php

declare(strict_types=1);

namespace App\Domain\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'event_store')]
#[ORM\Index(columns: ['aggregate_id'], name: 'idx_es_aggregate_id')]
#[ORM\Index(columns: ['event_name'], name: 'idx_es_event_name')]
#[ORM\Index(columns: ['occurred_on'], name: 'idx_es_occurred_on')]
class StoredEvent
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: Types::BIGINT)]
    private ?int $id = null;

    #[ORM\Column(type: Types::STRING, length: 36)]
    private string $aggregateId;

    #[ORM\Column(type: Types::STRING, length: 255)]
    private string $eventName;

    #[ORM\Column(type: Types::JSON)]
    private array $payload;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $occurredOn;

    #[ORM\Column(type: Types::INTEGER)]
    private int $version = 1;

    private function __construct(
        string $aggregateId,
        string $eventName,
        array $payload,
        \DateTimeImmutable $occurredOn
    ) {
        $this->aggregateId = $aggregateId;
        $this->eventName = $eventName;
        $this->payload = $payload;
        $this->occurredOn = $occurredOn;
    }

    public static function create(
        string $aggregateId,
        string $eventName,
        array $payload,
        \DateTimeImmutable $occurredOn
    ): self {
        return new self($aggregateId, $eventName, $payload, $occurredOn);
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getAggregateId(): string
    {
        return $this->aggregateId;
    }

    public function getEventName(): string
    {
        return $this->eventName;
    }

    public function getPayload(): array
    {
        return $this->payload;
    }

    public function getOccurredOn(): \DateTimeImmutable
    {
        return $this->occurredOn;
    }
}
