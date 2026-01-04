<?php

declare(strict_types=1);

namespace App\Infrastructure\Audit;

use App\Domain\Entity\Appointment;
use App\Domain\Entity\AuditTrail;
use App\Domain\Entity\Customer;
use App\Domain\Entity\Invoice;
use App\Domain\Entity\Patient;
use App\Domain\Entity\Record;
use App\Domain\Entity\User;
use Doctrine\Common\EventSubscriber;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Event\OnFlushEventArgs;
use Doctrine\ORM\Event\PostPersistEventArgs;
use Doctrine\ORM\Events;
use Doctrine\ORM\UnitOfWork;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * Doctrine Audit Listener
 *
 * Automatically captures entity changes and writes them to the audit_trail table.
 * Only active when AUDIT_TRAIL_ENABLED is true.
 *
 * Standards followed:
 * - Audit Logging best practices
 * - Compliance requirements (GDPR, SOX, HIPAA)
 * - Immutable audit trail pattern
 */
class DoctrineAuditListener implements EventSubscriber
{
    /**
     * Entities that should be audited
     */
    private const AUDITED_ENTITIES = [
        Patient::class,
        Invoice::class,
        Appointment::class,
        Customer::class,
        Record::class,
        User::class,
    ];

    public function __construct(
        private bool $enabled,
        private Security $security,
        private RequestStack $requestStack
    ) {
    }

    /**
     * Subscribe to Doctrine events
     */
    public function getSubscribedEvents(): array
    {
        return [
            Events::postPersist => 'postPersist',  // For insertions (ID is available)
            Events::onFlush => 'onFlush',          // For updates and deletions
        ];
    }

    /**
     * Called after entity is persisted - captures insertions
     */
    public function postPersist(PostPersistEventArgs $args): void
    {
        if (!$this->enabled) {
            return;
        }

        $entity = $args->getObject();

        if (!$this->isAudited($entity)) {
            return;
        }

        $entityType = $this->getEntityType($entity);
        $entityId = $this->getEntityId($entity);

        // At this point, ID should be available for IDENTITY strategy
        if (null === $entityId) {
            return;
        }

        // For postPersist, we need to track what changed
        // We'll record all non-null fields as "created" changes
        $em = $args->getObjectManager();
        $metadata = $em->getClassMetadata(get_class($entity));

        $changes = [];
        foreach ($metadata->getFieldNames() as $fieldName) {
            $value = $metadata->getFieldValue($entity, $fieldName);
            if ($value !== null) {
                $changes[$fieldName] = [
                    'before' => null,
                    'after' => $this->serializeValue($value),
                ];
            }
        }

        $audit = AuditTrail::create(
            entityType: $entityType,
            entityId: (string) $entityId,
            operation: 'created',
            changes: $changes,
            changedBy: $this->getCurrentUser(),
            ipAddress: $this->getClientIp(),
            userAgent: $this->getUserAgent()
        );

        $em->persist($audit);
        $em->flush();
    }

    /**
     * Called on flush - captures updates and deletions
     */
    public function onFlush(OnFlushEventArgs $args): void
    {
        if (!$this->enabled) {
            return;
        }

        $em = $args->getObjectManager();
        $uow = $em->getUnitOfWork();

        // Process updates
        foreach ($uow->getScheduledEntityUpdates() as $entity) {
            if ($this->isAudited($entity)) {
                $this->auditUpdate($em, $uow, $entity);
            }
        }

        // Process deletions
        foreach ($uow->getScheduledEntityDeletions() as $entity) {
            if ($this->isAudited($entity)) {
                $this->auditDelete($em, $uow, $entity);
            }
        }
    }

    /**
     * Check if entity should be audited
     */
    private function isAudited(object $entity): bool
    {
        foreach (self::AUDITED_ENTITIES as $class) {
            if ($entity instanceof $class) {
                return true;
            }
        }

        return false;
    }

    /**
     * Audit entity update
     */
    private function auditUpdate(EntityManagerInterface $em, UnitOfWork $uow, object $entity): void
    {
        $entityType = $this->getEntityType($entity);
        $entityId = $this->getEntityId($entity);

        if (null === $entityId) {
            return;
        }

        $changeSet = $uow->getEntityChangeSet($entity);

        if (empty($changeSet)) {
            return; // No actual changes
        }

        $changes = $this->formatChanges($changeSet);

        $audit = AuditTrail::create(
            entityType: $entityType,
            entityId: (string) $entityId,
            operation: 'updated',
            changes: $changes,
            changedBy: $this->getCurrentUser(),
            ipAddress: $this->getClientIp(),
            userAgent: $this->getUserAgent()
        );

        $em->persist($audit);

        // Recompute changeset for new audit entity
        $classMetadata = $em->getClassMetadata(AuditTrail::class);
        $uow->computeChangeSet($classMetadata, $audit);
    }

    /**
     * Audit entity deletion
     */
    private function auditDelete(EntityManagerInterface $em, UnitOfWork $uow, object $entity): void
    {
        $entityType = $this->getEntityType($entity);
        $entityId = $this->getEntityId($entity);

        if (null === $entityId) {
            return;
        }

        // For deletions, capture the final state
        $originalData = $uow->getOriginalEntityData($entity);
        $changes = $this->formatDeletionChanges($originalData);

        $audit = AuditTrail::create(
            entityType: $entityType,
            entityId: (string) $entityId,
            operation: 'deleted',
            changes: $changes,
            changedBy: $this->getCurrentUser(),
            ipAddress: $this->getClientIp(),
            userAgent: $this->getUserAgent()
        );

        $em->persist($audit);

        // Recompute changeset for new audit entity
        $classMetadata = $em->getClassMetadata(AuditTrail::class);
        $uow->computeChangeSet($classMetadata, $audit);
    }

    /**
     * Get entity type (class name without namespace)
     */
    private function getEntityType(object $entity): string
    {
        $class = get_class($entity);
        $parts = explode('\\', $class);

        return end($parts);
    }

    /**
     * Get entity ID
     */
    private function getEntityId(object $entity): ?int
    {
        if (property_exists($entity, 'id')) {
            return $entity->id;
        }

        return null;
    }

    /**
     * Format entity changes to audit format
     *
     * @param array $changeSet Doctrine change set [field => [old, new]]
     * @param bool $isInsert Whether this is an insertion (no "before" values)
     * @return array Formatted as ["field" => ["before" => val, "after" => val]]
     */
    private function formatChanges(array $changeSet, bool $isInsert = false): array
    {
        $formatted = [];

        foreach ($changeSet as $field => $change) {
            // Skip internal Doctrine fields
            if (str_starts_with($field, '__')) {
                continue;
            }

            $before = $isInsert ? null : $this->serializeValue($change[0]);
            $after = $this->serializeValue($change[1]);

            $formatted[$field] = [
                'before' => $before,
                'after' => $after,
            ];
        }

        return $formatted;
    }

    /**
     * Format deletion changes (only "before" values, "after" is always null)
     */
    private function formatDeletionChanges(array $originalData): array
    {
        $formatted = [];

        foreach ($originalData as $field => $value) {
            // Skip internal Doctrine fields
            if (str_starts_with($field, '__')) {
                continue;
            }

            $formatted[$field] = [
                'before' => $this->serializeValue($value),
                'after' => null,
            ];
        }

        return $formatted;
    }

    /**
     * Serialize a value for audit storage
     */
    private function serializeValue(mixed $value): mixed
    {
        // Handle null
        if (null === $value) {
            return null;
        }

        // Handle DateTime objects
        if ($value instanceof \DateTimeInterface) {
            return $value->format('Y-m-d H:i:s');
        }

        // Handle entities (store ID only)
        if (is_object($value) && method_exists($value, '__toString')) {
            return (string) $value;
        }

        if (is_object($value) && property_exists($value, 'id')) {
            return ['id' => $value->id, 'type' => $this->getEntityType($value)];
        }

        // Handle arrays
        if (is_array($value)) {
            return array_map([$this, 'serializeValue'], $value);
        }

        // Handle scalar values
        if (is_scalar($value)) {
            return $value;
        }

        // For other objects, try to convert to string
        if (is_object($value)) {
            return get_class($value);
        }

        return null;
    }

    /**
     * Get current authenticated user
     */
    private function getCurrentUser(): ?User
    {
        $user = $this->security->getUser();

        return $user instanceof User ? $user : null;
    }

    /**
     * Get client IP address
     */
    private function getClientIp(): ?string
    {
        $request = $this->requestStack->getCurrentRequest();

        return $request?->getClientIp();
    }

    /**
     * Get user agent string
     */
    private function getUserAgent(): ?string
    {
        $request = $this->requestStack->getCurrentRequest();

        return $request?->headers->get('User-Agent');
    }
}
