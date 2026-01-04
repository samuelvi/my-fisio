<?php

declare(strict_types=1);

namespace App\Tests\Functional\Audit;

use App\Domain\Entity\AuditTrail;
use App\Domain\Entity\Customer;
use App\Domain\Entity\Invoice;
use App\Domain\Entity\Patient;

/**
 * Functional tests for Audit Trail system
 *
 * These tests verify the REAL Doctrine listener integration with an actual database.
 * They test end-to-end functionality, not mocked behavior.
 *
 * Requirements tested:
 * - Audit trails created automatically on entity operations
 * - Correct operation type (created/updated/deleted)
 * - Change tracking accuracy
 * - All audited entities (Patient, Customer, Invoice, etc.)
 */
class AuditTrailFunctionalTest extends AuditTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Clean up audit tables before each test
        $this->cleanupAuditTables();
    }

    protected function tearDown(): void
    {
        // Clean up all test data
        $this->cleanupAuditTables();
        $this->cleanupTestEntities();

        parent::tearDown();
    }

    /**
     * @test
     */
    public function it_creates_audit_trail_when_customer_is_created(): void
    {
        // Arrange - Verify no audit trails exist
        $initialCount = $this->countAuditTrails();
        $this->assertSame(0, $initialCount, 'Expected no audit trails before test');

        // Act - Create a new customer
        $customer = Customer::create(
            firstName: 'John',
            lastName: 'Doe Test',
            taxId: 'TEST123456',
            email: 'test@example.com',
            phone: '+1234567890',
            billingAddress: '123 Test St'
        );

        $this->entityManager->persist($customer);
        $this->entityManager->flush();
        $this->entityManager->clear();

        // Assert - Verify audit trail was created
        $auditTrails = $this->findAuditTrailsByEntity('Customer', (string) $customer->id);

        $this->assertCount(1, $auditTrails, 'Expected exactly one audit trail for customer creation');

        $audit = $auditTrails[0];
        $this->assertSame('Customer', $audit->entityType);
        $this->assertSame((string) $customer->id, $audit->entityId);
        $this->assertSame('created', $audit->operation);
        $this->assertArrayHasKey('fullName', $audit->changes);
        $this->assertNull($audit->changes['fullName']['before']);
        $this->assertSame('John Doe Test', $audit->changes['fullName']['after']);
    }

    /**
     * @test
     */
    public function it_creates_audit_trail_when_customer_is_updated(): void
    {
        // Arrange - Create a customer
        $customer = Customer::create(
            firstName: 'Jane',
            lastName: 'Doe',
            taxId: 'TEST789',
            email: 'jane@example.com',
            phone: '+9876543210',
            billingAddress: '456 Test Ave'
        );

        $this->entityManager->persist($customer);
        $this->entityManager->flush();
        $this->cleanupAuditTables(); // Clear the creation audit trail
        $this->entityManager->clear();

        // Act - Update the customer
        $customer = $this->entityManager->find(Customer::class, $customer->id);
        $customer->fullName = 'Jane Smith';
        $customer->email = 'jane.smith@example.com';

        $this->entityManager->flush();
        $this->entityManager->clear();

        // Assert - Verify audit trail was created for update
        $auditTrails = $this->findAuditTrailsByEntity('Customer', (string) $customer->id);

        $this->assertCount(1, $auditTrails, 'Expected exactly one audit trail for customer update');

        $audit = $auditTrails[0];
        $this->assertSame('Customer', $audit->entityType);
        $this->assertSame('updated', $audit->operation);

        // Verify fullName change
        $this->assertArrayHasKey('fullName', $audit->changes);
        $this->assertSame('Jane Doe', $audit->changes['fullName']['before']);
        $this->assertSame('Jane Smith', $audit->changes['fullName']['after']);

        // Verify email change
        $this->assertArrayHasKey('email', $audit->changes);
        $this->assertSame('jane@example.com', $audit->changes['email']['before']);
        $this->assertSame('jane.smith@example.com', $audit->changes['email']['after']);
    }

    /**
     * @test
     */
    public function it_creates_audit_trail_when_customer_is_deleted(): void
    {
        // Arrange - Create a customer
        $customer = Customer::create(
            firstName: 'Bob',
            lastName: 'Wilson',
            taxId: 'TEST999',
            email: 'bob@example.com',
            phone: '+1111111111',
            billingAddress: '789 Test Blvd'
        );

        $this->entityManager->persist($customer);
        $this->entityManager->flush();
        $customerId = $customer->id;
        $this->cleanupAuditTables(); // Clear the creation audit trail
        $this->entityManager->clear();

        // Act - Delete the customer
        $customer = $this->entityManager->find(Customer::class, $customerId);
        $this->entityManager->remove($customer);
        $this->entityManager->flush();
        $this->entityManager->clear();

        // Assert - Verify audit trail was created for deletion
        $auditTrails = $this->findAuditTrailsByEntity('Customer', (string) $customerId);

        $this->assertCount(1, $auditTrails, 'Expected exactly one audit trail for customer deletion');

        $audit = $auditTrails[0];
        $this->assertSame('Customer', $audit->entityType);
        $this->assertSame((string) $customerId, $audit->entityId);
        $this->assertSame('deleted', $audit->operation);

        // Verify the deleted data is captured (before values, after is null)
        $this->assertArrayHasKey('fullName', $audit->changes);
        $this->assertSame('Bob Wilson', $audit->changes['fullName']['before']);
        $this->assertNull($audit->changes['fullName']['after']);
    }

    /**
     * @test
     */
    public function it_creates_audit_trail_for_patient_entity(): void
    {
        // Arrange
        $this->cleanupAuditTables();

        // Act - Create a patient
        $patient = Patient::create(
            firstName: 'Alice',
            lastName: 'Johnson',
            dateOfBirth: new \DateTimeImmutable('1990-05-15'),
            email: 'alice@example.com',
            phone: '+2222222222',
            address: '321 Patient St',
            taxId: 'ID123456'
        );

        $this->entityManager->persist($patient);
        $this->entityManager->flush();
        $this->entityManager->clear();

        // Assert
        $auditTrails = $this->findAuditTrailsByEntity('Patient', (string) $patient->id);

        $this->assertGreaterThanOrEqual(1, count($auditTrails), 'Expected at least one audit trail for patient creation');

        $creationAudit = null;
        foreach ($auditTrails as $audit) {
            if ($audit->operation === 'created') {
                $creationAudit = $audit;
                break;
            }
        }

        $this->assertNotNull($creationAudit, 'Expected to find a creation audit trail');
        $this->assertSame('Patient', $creationAudit->entityType);
        $this->assertArrayHasKey('firstName', $creationAudit->changes);
        $this->assertSame('Alice', $creationAudit->changes['firstName']['after']);
    }

    /**
     * @test
     */
    public function it_tracks_multiple_updates_to_same_entity(): void
    {
        // Arrange - Create a customer
        $customer = Customer::create(
            firstName: 'Test',
            lastName: 'Customer',
            taxId: 'MULTI123',
            email: 'multi@example.com',
            phone: '+3333333333',
            billingAddress: '111 Multi St'
        );

        $this->entityManager->persist($customer);
        $this->entityManager->flush();
        $this->cleanupAuditTables(); // Start fresh for updates
        $this->entityManager->clear();

        // Act - Make multiple updates
        $customer = $this->entityManager->find(Customer::class, $customer->id);

        // Update 1
        $customer->fullName = 'Test Customer V2';
        $this->entityManager->flush();
        $this->entityManager->clear();

        // Update 2
        $customer = $this->entityManager->find(Customer::class, $customer->id);
        $customer->fullName = 'Test Customer V3';
        $this->entityManager->flush();
        $this->entityManager->clear();

        // Update 3
        $customer = $this->entityManager->find(Customer::class, $customer->id);
        $customer->email = 'multi.v3@example.com';
        $this->entityManager->flush();
        $this->entityManager->clear();

        // Assert - Verify all updates were tracked
        $auditTrails = $this->findAuditTrailsByEntity('Customer', (string) $customer->id);

        $this->assertCount(3, $auditTrails, 'Expected three separate audit trails for three updates');

        // All should be update operations
        foreach ($auditTrails as $audit) {
            $this->assertSame('updated', $audit->operation);
        }

        // Verify chronological order (most recent first)
        $this->assertArrayHasKey('email', $auditTrails[0]->changes, 'Most recent change should be email');
        $this->assertArrayHasKey('fullName', $auditTrails[1]->changes, 'Second change should be fullName to V3');
        $this->assertSame('Test Customer V3', $auditTrails[1]->changes['fullName']['after']);
        $this->assertArrayHasKey('fullName', $auditTrails[2]->changes, 'Third change should be fullName to V2');
        $this->assertSame('Test Customer V2', $auditTrails[2]->changes['fullName']['after']);
    }

    /**
     * @test
     */
    public function it_does_not_create_audit_trail_when_no_changes_made(): void
    {
        // Arrange - Create a customer
        $customer = Customer::create(
            firstName: 'No Change',
            lastName: 'Test',
            taxId: 'NOCHANGE123',
            email: 'nochange@example.com',
            phone: '+4444444444',
            billingAddress: '222 NoChange St'
        );

        $this->entityManager->persist($customer);
        $this->entityManager->flush();
        $this->cleanupAuditTables(); // Start fresh
        $this->entityManager->clear();

        // Act - Fetch and flush without making changes
        $customer = $this->entityManager->find(Customer::class, $customer->id);
        $this->entityManager->flush(); // No changes
        $this->entityManager->clear();

        // Assert - No audit trail should be created
        $auditTrails = $this->findAuditTrailsByEntity('Customer', (string) $customer->id);

        $this->assertCount(0, $auditTrails, 'Expected no audit trails when no changes are made');
    }

    /**
     * @test
     */
    public function it_captures_audit_trail_with_timestamp(): void
    {
        // Arrange
        $beforeTime = new \DateTimeImmutable('now');

        // Wait a moment to ensure timestamp difference
        usleep(10000); // 10ms

        // Act
        $customer = Customer::create(
            firstName: 'Timestamp',
            lastName: 'Test',
            taxId: 'TIME123',
            email: 'time@example.com',
            phone: '+5555555555',
            billingAddress: '333 Time St'
        );

        $this->entityManager->persist($customer);
        $this->entityManager->flush();
        $this->entityManager->clear();

        usleep(10000); // 10ms
        $afterTime = new \DateTimeImmutable('now');

        // Assert
        $auditTrails = $this->findAuditTrailsByEntity('Customer', (string) $customer->id);

        $this->assertCount(1, $auditTrails);

        $audit = $auditTrails[0];
        $this->assertInstanceOf(\DateTimeImmutable::class, $audit->changedAt);

        // Compare timestamps (allow for microsecond differences by comparing timestamps)
        $this->assertGreaterThanOrEqual(
            $beforeTime->getTimestamp(),
            $audit->changedAt->getTimestamp(),
            'Audit timestamp should be after or equal to beforeTime'
        );
        $this->assertLessThanOrEqual(
            $afterTime->getTimestamp(),
            $audit->changedAt->getTimestamp(),
            'Audit timestamp should be before or equal to afterTime'
        );
    }

    // Helper methods

    private function cleanupAuditTables(): void
    {
        try {
            $this->entityManager->createQuery('DELETE FROM App\Domain\Entity\AuditTrail')->execute();
            $this->entityManager->clear();
        } catch (\Exception $e) {
            // Ignore errors if tables don't exist yet
        }
    }

    private function cleanupTestEntities(): void
    {
        try {
            // Delete in correct order to respect foreign keys
            $this->entityManager->createQuery('DELETE FROM App\Domain\Entity\Customer')->execute();
            $this->entityManager->createQuery('DELETE FROM App\Domain\Entity\Patient')->execute();
            $this->entityManager->clear();
        } catch (\Exception $e) {
            // Ignore errors if tables don't exist yet
        }
    }

    private function countAuditTrails(): int
    {
        return (int) $this->entityManager
            ->createQuery('SELECT COUNT(a.id) FROM App\Domain\Entity\AuditTrail a')
            ->getSingleScalarResult();
    }

    /**
     * @return AuditTrail[]
     */
    private function findAuditTrailsByEntity(string $entityType, string $entityId): array
    {
        return $this->entityManager
            ->getRepository(AuditTrail::class)
            ->findBy(
                ['entityType' => $entityType, 'entityId' => $entityId],
                ['changedAt' => 'DESC']
            );
    }
}
