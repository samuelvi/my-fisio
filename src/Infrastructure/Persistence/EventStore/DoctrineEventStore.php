<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\EventStore;

use App\Domain\Entity\StoredEvent;
use App\Domain\Event\DomainEventInterface;
use App\Domain\Event\EventStoreInterface;
use Doctrine\ORM\EntityManagerInterface;

class DoctrineEventStore implements EventStoreInterface
{
    public function __construct(
        private EntityManagerInterface $entityManager
    ) {
    }

    public function append(DomainEventInterface $event): void
    {
        $storedEvent = StoredEvent::create(
            $event->getAggregateId(),
            $event->getEventName(),
            $event->getPayload(),
            $event->getOccurredOn()
        );

        $this->entityManager->persist($storedEvent);
        $this->entityManager->flush();
    }
}
