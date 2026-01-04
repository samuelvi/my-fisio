<?php

declare(strict_types=1);

namespace App\Infrastructure\EventHandler;

use App\Domain\Entity\AuditTrail;
use App\Domain\Entity\User;
use App\Domain\Event\DomainEventInterface;
use App\Domain\Event\EventStoreInterface;
use App\Infrastructure\Audit\AuditService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'event.bus')]
class AuditEventHandler
{
    public function __construct(
        private EventStoreInterface $eventStore,
        private EntityManagerInterface $entityManager,
        private Security $security,
        private RequestStack $requestStack,
        private AuditService $auditService
    ) {
    }

    public function __invoke(DomainEventInterface $event): void
    {
        $this->eventStore->append($event);

        // Skip audit trail creation if disabled (e.g., during batch operations)
        if (!$this->auditService->isEnabled()) {
            return;
        }

        $payload = $event->getPayload();
        $entityType = $this->resolveEntityType($event);

        // Determine operation and changes based on event type
        $operation = $this->determineOperation($event);
        $changes = $payload['changes'] ?? $payload;

        $audit = AuditTrail::create(
            entityType: $entityType,
            entityId: $event->getAggregateId(),
            operation: $operation,
            changes: $changes,
            changedBy: $this->getCurrentUser(),
            ipAddress: $this->getClientIp(),
            userAgent: $this->getUserAgent()
        );

        $this->entityManager->persist($audit);
        $this->entityManager->flush();
    }

    private function determineOperation(DomainEventInterface $event): string
    {
        $name = $event->getEventName();
        if (str_contains(strtolower($name), 'created')) {
            return 'created';
        }
        if (str_contains(strtolower($name), 'updated')) {
            return 'updated';
        }
        if (str_contains(strtolower($name), 'deleted')) {
            return 'deleted';
        }
        return $name;
    }

    private function resolveEntityType(DomainEventInterface $event): string
    {
        // Simple mapping based on event namespace or name
        // E.g. App\Domain\Event\Patient\PatientCreatedEvent -> Patient
        $class = get_class($event);
        if (str_contains($class, 'Patient')) {
            return 'Patient';
        }
        if (str_contains($class, 'Customer')) {
            return 'Customer';
        }
        if (str_contains($class, 'Appointment')) {
            return 'Appointment';
        }
        if (str_contains($class, 'Record')) {
            return 'Record';
        }
        return 'Unknown';
    }

    private function getCurrentUser(): ?User
    {
        $user = $this->security->getUser();
        return $user instanceof User ? $user : null;
    }

    private function getClientIp(): ?string
    {
        $request = $this->requestStack->getCurrentRequest();
        return $request?->getClientIp();
    }

    private function getUserAgent(): ?string
    {
        $request = $this->requestStack->getCurrentRequest();
        return $request?->headers->get('User-Agent');
    }
}