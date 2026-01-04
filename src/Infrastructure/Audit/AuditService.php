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
 */
class AuditService
{
    private bool $enabled;

    public function __construct(
        #[Autowire(param: 'audit_trail_enabled')]
        bool $auditTrailEnabled
    ) {
        $this->enabled = $auditTrailEnabled;
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
     */
    public function isEnabled(): bool
    {
        return $this->enabled;
    }
}
