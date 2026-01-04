<?php

declare(strict_types=1);

namespace App\Application\EventListener;

use App\Domain\Event\AppointmentCancelledEvent;
use App\Domain\Event\AppointmentScheduledEvent;
use App\Domain\Event\AppointmentUpdatedEvent;
use App\Domain\Event\CustomerCreatedEvent;
use App\Domain\Event\CustomerUpdatedEvent;
use App\Domain\Event\InvoiceCancelledEvent;
use App\Domain\Event\InvoiceIssuedEvent;
use App\Domain\Event\PatientCreatedEvent;
use App\Domain\Event\PatientUpdatedEvent;
use App\Infrastructure\Audit\AuditLogger;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

/**
 * Audit Event Subscriber
 *
 * Listens to domain events and logs them to the audit system.
 * Only active when AUDIT_BUSINESS_ENABLED is true.
 */
class AuditEventSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private AuditLogger $auditLogger
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            PatientCreatedEvent::NAME => 'onPatientCreated',
            PatientUpdatedEvent::NAME => 'onPatientUpdated',
            InvoiceIssuedEvent::NAME => 'onInvoiceIssued',
            InvoiceCancelledEvent::NAME => 'onInvoiceCancelled',
            AppointmentScheduledEvent::NAME => 'onAppointmentScheduled',
            AppointmentUpdatedEvent::NAME => 'onAppointmentUpdated',
            AppointmentCancelledEvent::NAME => 'onAppointmentCancelled',
            CustomerCreatedEvent::NAME => 'onCustomerCreated',
            CustomerUpdatedEvent::NAME => 'onCustomerUpdated',
        ];
    }

    public function onPatientCreated(PatientCreatedEvent $event): void
    {
        if (!$this->auditLogger->isEnabled()) {
            return;
        }

        $patient = $event->getPatient();
        $this->auditLogger->logPatientCreated(
            $patient->id,
            $event->getMetadata()
        );
    }

    public function onPatientUpdated(PatientUpdatedEvent $event): void
    {
        if (!$this->auditLogger->isEnabled()) {
            return;
        }

        $patient = $event->getPatient();
        $this->auditLogger->logPatientUpdated(
            $patient->id,
            $event->getChanges(),
            $event->getMetadata()
        );
    }

    public function onInvoiceIssued(InvoiceIssuedEvent $event): void
    {
        if (!$this->auditLogger->isEnabled()) {
            return;
        }

        $invoice = $event->getInvoice();
        $this->auditLogger->logInvoiceIssued(
            $invoice->id,
            $event->getMetadata()
        );
    }

    public function onInvoiceCancelled(InvoiceCancelledEvent $event): void
    {
        if (!$this->auditLogger->isEnabled()) {
            return;
        }

        $invoice = $event->getInvoice();
        $this->auditLogger->logInvoiceCancelled(
            $invoice->id,
            $event->getReason(),
            $event->getMetadata()
        );
    }

    public function onAppointmentScheduled(AppointmentScheduledEvent $event): void
    {
        if (!$this->auditLogger->isEnabled()) {
            return;
        }

        $appointment = $event->getAppointment();
        $this->auditLogger->logAppointmentScheduled(
            $appointment->id,
            $event->getMetadata()
        );
    }

    public function onAppointmentUpdated(AppointmentUpdatedEvent $event): void
    {
        if (!$this->auditLogger->isEnabled()) {
            return;
        }

        $appointment = $event->getAppointment();
        $this->auditLogger->logAppointmentUpdated(
            $appointment->id,
            $event->getChanges(),
            $event->getMetadata()
        );
    }

    public function onAppointmentCancelled(AppointmentCancelledEvent $event): void
    {
        if (!$this->auditLogger->isEnabled()) {
            return;
        }

        $appointment = $event->getAppointment();
        $this->auditLogger->logAppointmentCancelled(
            $appointment->id,
            $event->getReason(),
            $event->getMetadata()
        );
    }

    public function onCustomerCreated(CustomerCreatedEvent $event): void
    {
        if (!$this->auditLogger->isEnabled()) {
            return;
        }

        $customer = $event->getCustomer();
        $this->auditLogger->logCustomerCreated(
            $customer->id,
            $event->getMetadata()
        );
    }

    public function onCustomerUpdated(CustomerUpdatedEvent $event): void
    {
        if (!$this->auditLogger->isEnabled()) {
            return;
        }

        $customer = $event->getCustomer();
        $this->auditLogger->logCustomerUpdated(
            $customer->id,
            $event->getChanges(),
            $event->getMetadata()
        );
    }
}
