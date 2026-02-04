<?php

declare(strict_types=1);

namespace App\Infrastructure\Audit;

use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * Service to control audit trail creation
 *
 * Respects the AUDIT_TRAIL_ENABLED environment variable as the default state,
 * but allows temporarily disabling audit for batch operations like data migrations
 * where tracking every change would create noise in the audit log.
 * 
 * Also supports granular control per entity type.
 */
class AuditService
{
    private bool $enabled;
    private bool $patientEnabled;
    private bool $customerEnabled;
    private bool $appointmentEnabled;
    private bool $invoiceEnabled;
    private bool $recordEnabled;

    public function __construct(
        #[Autowire(param: 'audit_trail_enabled')]
        bool $auditTrailEnabled,
        #[Autowire(param: 'audit_trail_patient_enabled')]
        bool $patientEnabled = true,
        #[Autowire(param: 'audit_trail_customer_enabled')]
        bool $customerEnabled = true,
        #[Autowire(param: 'audit_trail_appointment_enabled')]
        bool $appointmentEnabled = true,
        #[Autowire(param: 'audit_trail_invoice_enabled')]
        bool $invoiceEnabled = true,
        #[Autowire(param: 'audit_trail_record_enabled')]
        bool $recordEnabled = true,
    ) {
        $this->enabled = $auditTrailEnabled;
        $this->patientEnabled = $patientEnabled;
        $this->customerEnabled = $customerEnabled;
        $this->appointmentEnabled = $appointmentEnabled;
        $this->invoiceEnabled = $invoiceEnabled;
        $this->recordEnabled = $recordEnabled;
    }

    /**
     * Disable audit trail creation
     *
     * Use this for batch operations like data migrations where
     * audit trails would create unnecessary noise.
     */
    public function disable(): void
    {
        $this->enabled = false;
    }

    /**
     * Enable audit trail creation
     */
    public function enable(): void
    {
        $this->enabled = true;
    }

    /**
     * Check if audit trail creation is enabled
     * 
     * @param string|null $entityType The entity type (e.g., 'Patient', 'Invoice')
     */
    public function isEnabled(?string $entityType = null): bool
    {
        if (!$this->enabled) {
            return false;
        }

        if (null === $entityType) {
            return true;
        }

        return match ($entityType) {
            'Patient' => $this->patientEnabled,
            'Customer' => $this->customerEnabled,
            'Appointment' => $this->appointmentEnabled,
            'Invoice' => $this->invoiceEnabled,
            'Record' => $this->recordEnabled,
            default => true,
        };
    }
}
