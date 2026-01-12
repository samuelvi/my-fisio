---
name: audit-trail-pattern
description: Audit Trail implementation pattern for compliance and change tracking.
---

# Audit Trail Pattern

## Overview
Automatic change tracking for compliance, security, and forensics. Records all CREATE, UPDATE, DELETE operations on audited entities.

## Architecture
Two-table approach:
1. **audit_trail** - Technical audit log (Doctrine listener)
2. **domain_events** - Business events (Event Sourcing)

## Implementation

### Audit Trail Table
```sql
CREATE TABLE audit_trail (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(100),
    entity_id INT,
    operation ENUM('created', 'updated', 'deleted'),
    changes JSON,
    changed_at DATETIME,
    changed_by INT,
    ip_address VARCHAR(45),
    user_agent TEXT
);
```

### Doctrine Listener
```php
class AuditEventListener
{
    public function onFlush(OnFlushEventArgs $args): void
    {
        if (!$this->auditEnabled) return;
        
        $uow = $args->getObjectManager()->getUnitOfWork();
        
        foreach ($uow->getScheduledEntityInsertions() as $entity) {
            $this->recordChange($entity, 'created');
        }
        
        foreach ($uow->getScheduledEntityUpdates() as $entity) {
            $changeset = $uow->getEntityChangeSet($entity);
            $this->recordChange($entity, 'updated', $changeset);
        }
        
        foreach ($uow->getScheduledEntityDeletions() as $entity) {
            $this->recordChange($entity, 'deleted');
        }
    }
}
```

### Configuration
```yaml
# .env
AUDIT_TRAIL_ENABLED=true  # Production
AUDIT_TRAIL_ENABLED=false # Development

# services.yaml
services:
    App\Infrastructure\Audit\AuditEventListener:
        tags:
            - { name: doctrine.event_listener, event: onFlush }
```

### Querying Audit Trail
```php
// Get all changes for entity
$changes = $auditRepository->findBy([
    'entityType' => 'Patient',
    'entityId' => 123
], ['changedAt' => 'DESC']);

// Get changes by user
$userChanges = $auditRepository->findBy(['changedBy' => $userId]);
```

## Use Cases
- ✅ Regulatory compliance (GDPR, HIPAA)
- ✅ Security forensics (who changed what when)
- ✅ Data recovery (rollback to previous state)
- ✅ User activity monitoring

## Best Practices
- Enable in production only (performance)
- Disable in tests (isolation)
- Store only changed fields (not full entity)
- Rotate audit logs (archive old entries)
- Secure audit table (read-only for most users)

## References
- Related: [event-sourcing-v1.0.md](../core/event-sourcing-v1.0.md)
- See: docs/features/audit-system.md
