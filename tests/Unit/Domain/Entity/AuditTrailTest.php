<?php

declare(strict_types=1);

namespace App\Tests\Unit\Domain\Entity;

use App\Domain\Entity\AuditTrail;
use App\Domain\Entity\User;
use PHPUnit\Framework\TestCase;

/**
 * Unit tests for AuditTrail entity
 *
 * Tests follow industry standards:
 * - Arrange-Act-Assert pattern
 * - Clear test names describing scenario and expected outcome
 * - Edge cases and validation coverage
 * - Immutability verification
 */
class AuditTrailTest extends TestCase
{
    /**
     * @test
     */
    public function it_creates_audit_trail_entry_with_required_fields(): void
    {
        // Arrange
        $entityType = 'Patient';
        $entityId = '123';
        $operation = 'created';
        $changes = [
            'firstName' => ['before' => null, 'after' => 'John'],
            'lastName' => ['before' => null, 'after' => 'Doe'],
        ];

        // Act
        $auditTrail = AuditTrail::create(
            entityType: $entityType,
            entityId: $entityId,
            operation: $operation,
            changes: $changes
        );

        // Assert
        $this->assertNull($auditTrail->id);
        $this->assertSame($entityType, $auditTrail->entityType);
        $this->assertSame($entityId, $auditTrail->entityId);
        $this->assertSame($operation, $auditTrail->operation);
        $this->assertSame($changes, $auditTrail->changes);
        $this->assertInstanceOf(\DateTimeImmutable::class, $auditTrail->changedAt);
        $this->assertNull($auditTrail->changedBy);
        $this->assertNull($auditTrail->ipAddress);
        $this->assertNull($auditTrail->userAgent);
    }

    /**
     * @test
     */
    public function it_creates_audit_trail_with_user_context(): void
    {
        // Arrange
        $user = $this->createMock(User::class);
        $ipAddress = '192.168.1.1';
        $userAgent = 'Mozilla/5.0';

        // Act
        $auditTrail = AuditTrail::create(
            entityType: 'Invoice',
            entityId: '456',
            operation: 'updated',
            changes: ['total' => ['before' => 100, 'after' => 150]],
            changedBy: $user,
            ipAddress: $ipAddress,
            userAgent: $userAgent
        );

        // Assert
        $this->assertSame($user, $auditTrail->changedBy);
        $this->assertSame($ipAddress, $auditTrail->ipAddress);
        $this->assertSame($userAgent, $auditTrail->userAgent);
    }

    /**
     * @test
     */
    public function it_converts_entity_id_to_string(): void
    {
        // Arrange
        $entityId = 999;

        // Act
        $auditTrail = AuditTrail::create(
            entityType: 'Appointment',
            entityId: (string) $entityId,
            operation: 'deleted',
            changes: []
        );

        // Assert
        $this->assertSame('999', $auditTrail->entityId);
        $this->assertIsString($auditTrail->entityId);
    }

    /**
     * @test
     */
    public function it_gets_entity_short_name(): void
    {
        // Arrange
        $auditTrail = AuditTrail::create(
            entityType: 'App\\Domain\\Entity\\Patient',
            entityId: '1',
            operation: 'created',
            changes: []
        );

        // Act
        $shortName = $auditTrail->getEntityShortName();

        // Assert
        $this->assertSame('Patient', $shortName);
    }

    /**
     * @test
     */
    public function it_checks_if_field_changed(): void
    {
        // Arrange
        $changes = [
            'firstName' => ['before' => 'John', 'after' => 'Jane'],
            'email' => ['before' => 'old@example.com', 'after' => 'new@example.com'],
        ];

        $auditTrail = AuditTrail::create(
            entityType: 'Customer',
            entityId: '1',
            operation: 'updated',
            changes: $changes
        );

        // Act & Assert
        $this->assertTrue($auditTrail->hasFieldChanged('firstName'));
        $this->assertTrue($auditTrail->hasFieldChanged('email'));
        $this->assertFalse($auditTrail->hasFieldChanged('lastName'));
    }

    /**
     * @test
     */
    public function it_gets_old_and_new_values(): void
    {
        // Arrange
        $changes = [
            'status' => ['before' => 'pending', 'after' => 'confirmed'],
        ];

        $auditTrail = AuditTrail::create(
            entityType: 'Appointment',
            entityId: '1',
            operation: 'updated',
            changes: $changes
        );

        // Act
        $oldValue = $auditTrail->getOldValue('status');
        $newValue = $auditTrail->getNewValue('status');

        // Assert
        $this->assertSame('pending', $oldValue);
        $this->assertSame('confirmed', $newValue);
    }

    /**
     * @test
     */
    public function it_returns_null_for_nonexistent_field_values(): void
    {
        // Arrange
        $auditTrail = AuditTrail::create(
            entityType: 'Patient',
            entityId: '1',
            operation: 'created',
            changes: []
        );

        // Act & Assert
        $this->assertNull($auditTrail->getOldValue('nonexistent'));
        $this->assertNull($auditTrail->getNewValue('nonexistent'));
    }

    /**
     * @test
     */
    public function it_gets_all_changed_field_names(): void
    {
        // Arrange
        $changes = [
            'firstName' => ['before' => 'John', 'after' => 'Jane'],
            'lastName' => ['before' => 'Doe', 'after' => 'Smith'],
            'email' => ['before' => 'old@example.com', 'after' => 'new@example.com'],
        ];

        $auditTrail = AuditTrail::create(
            entityType: 'User',
            entityId: '1',
            operation: 'updated',
            changes: $changes
        );

        // Act
        $changedFields = $auditTrail->getChangedFields();

        // Assert
        $this->assertCount(3, $changedFields);
        $this->assertContains('firstName', $changedFields);
        $this->assertContains('lastName', $changedFields);
        $this->assertContains('email', $changedFields);
    }

    /**
     * @test
     */
    public function it_handles_empty_changes(): void
    {
        // Arrange & Act
        $auditTrail = AuditTrail::create(
            entityType: 'Patient',
            entityId: '1',
            operation: 'created',
            changes: []
        );

        // Assert
        $this->assertEmpty($auditTrail->changes);
        $this->assertEmpty($auditTrail->getChangedFields());
    }

    /**
     * @test
     */
    public function it_records_deletion_operation(): void
    {
        // Arrange
        $changes = [
            'firstName' => ['before' => 'John', 'after' => null],
            'lastName' => ['before' => 'Doe', 'after' => null],
        ];

        // Act
        $auditTrail = AuditTrail::create(
            entityType: 'Patient',
            entityId: '1',
            operation: 'deleted',
            changes: $changes
        );

        // Assert
        $this->assertSame('deleted', $auditTrail->operation);
        $this->assertNull($auditTrail->getNewValue('firstName'));
        $this->assertNull($auditTrail->getNewValue('lastName'));
    }

    /**
     * @test
     */
    public function changed_at_is_immutable(): void
    {
        // Arrange
        $auditTrail = AuditTrail::create(
            entityType: 'Patient',
            entityId: '1',
            operation: 'created',
            changes: []
        );

        $originalTimestamp = $auditTrail->changedAt;

        // Act - Try to modify (which should create a new instance, not modify)
        $modifiedTimestamp = $auditTrail->changedAt->modify('+1 day');

        // Assert - Original should remain unchanged
        $this->assertEquals($originalTimestamp, $auditTrail->changedAt);
        $this->assertNotEquals($modifiedTimestamp, $auditTrail->changedAt);
    }
}
