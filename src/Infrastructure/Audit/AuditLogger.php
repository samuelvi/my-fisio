<?php

declare(strict_types=1);

namespace App\Infrastructure\Audit;

use App\Domain\Entity\DomainEvent;
use App\Domain\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * Domain Events Logger Service
 *
 * Logs business-level events following Event Sourcing patterns.
 * Can be enabled/disabled via DOMAIN_EVENTS_ENABLED environment variable.
 */
class AuditLogger
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private Security $security,
        private RequestStack $requestStack,
        private bool $enabled
    ) {
    }

    /**
     * Log a domain event
     *
     * @param string $eventName Event name (e.g., 'patient.created', 'invoice.cancelled')
     * @param string $aggregateType Type of aggregate (e.g., 'Patient', 'Invoice')
     * @param int $aggregateId ID of the aggregate
     * @param array $payload Event payload data
     * @param array|null $metadata Additional context (reason, notes, etc.)
     * @param string|null $correlationId Correlation ID to track related operations
     */
    public function log(
        string $eventName,
        string $aggregateType,
        int $aggregateId,
        array $payload = [],
        ?array $metadata = null,
        ?string $correlationId = null
    ): void {
        if (!$this->enabled) {
            return;
        }

        $user = $this->security->getUser();
        $request = $this->requestStack->getCurrentRequest();

        // Add request context to metadata
        if (null === $metadata) {
            $metadata = [];
        }

        $metadata['ip_address'] = $request?->getClientIp();
        $metadata['user_agent'] = $request?->headers->get('User-Agent');

        $domainEvent = DomainEvent::create(
            eventName: $eventName,
            aggregateType: $aggregateType,
            aggregateId: (string) $aggregateId,
            payload: $payload,
            user: $user instanceof User ? $user : null,
            metadata: $metadata,
            correlationId: $correlationId
        );

        $this->entityManager->persist($domainEvent);
        $this->entityManager->flush();
    }

    /**
     * Log patient creation
     */
    public function logPatientCreated(int $patientId, ?array $metadata = null): void
    {
        $this->log('patient.created', 'Patient', $patientId, [], $metadata);
    }

    /**
     * Log patient update
     */
    public function logPatientUpdated(int $patientId, array $changes, ?array $metadata = null): void
    {
        $this->log('patient.updated', 'Patient', $patientId, ['changes' => $changes], $metadata);
    }

    /**
     * Log patient deletion
     */
    public function logPatientDeleted(int $patientId, ?array $metadata = null): void
    {
        $this->log('patient.deleted', 'Patient', $patientId, [], $metadata);
    }

    /**
     * Log invoice issued
     */
    public function logInvoiceIssued(int $invoiceId, ?array $metadata = null): void
    {
        $this->log('invoice.issued', 'Invoice', $invoiceId, [], $metadata);
    }

    /**
     * Log invoice updated
     */
    public function logInvoiceUpdated(int $invoiceId, array $changes, ?array $metadata = null): void
    {
        $this->log('invoice.updated', 'Invoice', $invoiceId, ['changes' => $changes], $metadata);
    }

    /**
     * Log invoice cancelled
     */
    public function logInvoiceCancelled(int $invoiceId, string $reason, ?array $metadata = null): void
    {
        $payload = ['cancellation_reason' => $reason];
        $this->log('invoice.cancelled', 'Invoice', $invoiceId, $payload, $metadata);
    }

    /**
     * Log appointment scheduled
     */
    public function logAppointmentScheduled(int $appointmentId, ?array $metadata = null): void
    {
        $this->log('appointment.scheduled', 'Appointment', $appointmentId, [], $metadata);
    }

    /**
     * Log appointment rescheduled
     */
    public function logAppointmentRescheduled(int $appointmentId, array $changes, ?array $metadata = null): void
    {
        $this->log('appointment.rescheduled', 'Appointment', $appointmentId, ['changes' => $changes], $metadata);
    }

    /**
     * Log appointment cancelled
     */
    public function logAppointmentCancelled(int $appointmentId, string $reason, ?array $metadata = null): void
    {
        $payload = ['cancellation_reason' => $reason];
        $this->log('appointment.cancelled', 'Appointment', $appointmentId, $payload, $metadata);
    }

    /**
     * Log clinical record created
     */
    public function logRecordCreated(int $recordId, ?array $metadata = null): void
    {
        $this->log('record.created', 'Record', $recordId, [], $metadata);
    }

    /**
     * Log clinical record updated
     */
    public function logRecordUpdated(int $recordId, array $changes, ?array $metadata = null): void
    {
        $this->log('record.updated', 'Record', $recordId, ['changes' => $changes], $metadata);
    }

    /**
     * Log appointment updated
     */
    public function logAppointmentUpdated(int $appointmentId, array $changes, ?array $metadata = null): void
    {
        $this->log('appointment.updated', 'Appointment', $appointmentId, ['changes' => $changes], $metadata);
    }

    /**
     * Log customer created
     */
    public function logCustomerCreated(int $customerId, ?array $metadata = null): void
    {
        $this->log('customer.created', 'Customer', $customerId, [], $metadata);
    }

    /**
     * Log customer updated
     */
    public function logCustomerUpdated(int $customerId, array $changes, ?array $metadata = null): void
    {
        $this->log('customer.updated', 'Customer', $customerId, ['changes' => $changes], $metadata);
    }

    /**
     * Check if audit is enabled
     */
    public function isEnabled(): bool
    {
        return $this->enabled;
    }
}
