---
type: skill
category: core
version: 1.0.0
status: production
compatibility:
  llms: [claude, gemini, openai]
  frameworks: [symfony, doctrine]
dependencies: []
tags: [event-sourcing, domain-events, ddd]
created: 2026-01-09
updated: 2026-01-09
author: MyPhysio Team
license: MIT
description: Event Sourcing pattern implementation with Domain Events for Symfony applications.
---

# Event Sourcing Pattern

## Overview
Event Sourcing captures all changes to application state as a sequence of events. Instead of storing current state, store the events that led to that state.

## Implementation

### Domain Event Structure
```php
final readonly class PatientCreatedEvent
{
    public function __construct(
        public string $eventId,
        public int $aggregateId,
        public string $fullName,
        public \DateTimeImmutable $occurredOn,
    ) {}

    public static function create(int $patientId, string $fullName): self
    {
        return new self(
            eventId: \Symfony\Component\Uid\Uuid::v4()->toRfc4122(),
            aggregateId: $patientId,
            fullName: $fullName,
            occurredOn: new \DateTimeImmutable(),
        );
    }
}
```

### Event Store Interface
```php
interface EventStoreInterface
{
    public function append(DomainEventInterface $event): void;
    public function getEventsForAggregate(int $aggregateId): array;
}
```

### Usage in Command Handler
```php
public function __invoke(CreatePatientCommand $command): void
{
    $patient = Patient::create(...);
    $this->repository->save($patient);
    
    // Persist domain event
    $event = PatientCreatedEvent::create($patient->getId(), $patient->getFullName());
    $this->eventStore->append($event);
}
```

## Key Principles
- Events are immutable and append-only
- State can be rebuilt by replaying events
- Audit trail comes for free
- Time travel debugging possible

## References
- [Event Sourcing by Martin Fowler](https://martinfowler.com/eaaDev/EventSourcing.html)
- Related: [cqrs-pattern-v1.0.md](./cqrs-pattern-v1.0.md)
