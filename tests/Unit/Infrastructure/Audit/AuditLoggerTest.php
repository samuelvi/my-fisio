<?php

declare(strict_types=1);

namespace App\Tests\Unit\Infrastructure\Audit;

use App\Domain\Entity\DomainEvent;
use App\Domain\Entity\User;
use App\Infrastructure\Audit\AuditLogger;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * Unit tests for AuditLogger
 *
 * Tests verify:
 * - Domain event creation and persistence
 * - Event naming conventions
 * - Payload and metadata handling
 * - User context capture
 * - Enable/disable functionality
 */
class AuditLoggerTest extends TestCase
{
    private EntityManagerInterface $entityManager;
    private Security $security;
    private RequestStack $requestStack;

    protected function setUp(): void
    {
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->security = $this->createMock(Security::class);
        $this->requestStack = $this->createMock(RequestStack::class);
    }

    /**
     * @test
     */
    public function it_does_nothing_when_disabled(): void
    {
        // Arrange
        $logger = new AuditLogger(
            entityManager: $this->entityManager,
            security: $this->security,
            requestStack: $this->requestStack,
            enabled: false
        );

        $this->entityManager
            ->expects($this->never())
            ->method('persist');

        $this->entityManager
            ->expects($this->never())
            ->method('flush');

        // Act
        $logger->logPatientCreated(1);

        // Assert - Expectations verified by mocks
    }

    /**
     * @test
     */
    public function it_logs_patient_created_event(): void
    {
        // Arrange
        $logger = new AuditLogger(
            entityManager: $this->entityManager,
            security: $this->security,
            requestStack: $this->requestStack,
            enabled: true
        );

        $this->setupDefaultContext();

        $this->entityManager
            ->expects($this->once())
            ->method('persist')
            ->with($this->callback(function ($arg) {
                return $arg instanceof DomainEvent
                    && $arg->eventName === 'patient.created'
                    && $arg->aggregateType === 'Patient'
                    && $arg->aggregateId === '1';
            }));

        $this->entityManager
            ->expects($this->once())
            ->method('flush');

        // Act
        $logger->logPatientCreated(1);

        // Assert - Expectations verified by mocks
    }

    /**
     * @test
     */
    public function it_logs_patient_updated_event_with_changes(): void
    {
        // Arrange
        $logger = new AuditLogger(
            entityManager: $this->entityManager,
            security: $this->security,
            requestStack: $this->requestStack,
            enabled: true
        );

        $changes = [
            'firstName' => ['before' => 'John', 'after' => 'Jane'],
            'email' => ['before' => 'old@example.com', 'after' => 'new@example.com'],
        ];

        $this->setupDefaultContext();

        $this->entityManager
            ->expects($this->once())
            ->method('persist')
            ->with($this->callback(function ($arg) use ($changes) {
                return $arg instanceof DomainEvent
                    && $arg->eventName === 'patient.updated'
                    && $arg->payload['changes'] === $changes;
            }));

        $this->entityManager
            ->expects($this->once())
            ->method('flush');

        // Act
        $logger->logPatientUpdated(1, $changes);

        // Assert - Expectations verified by mocks
    }

    /**
     * @test
     */
    public function it_logs_invoice_cancelled_with_reason_in_payload(): void
    {
        // Arrange
        $logger = new AuditLogger(
            entityManager: $this->entityManager,
            security: $this->security,
            requestStack: $this->requestStack,
            enabled: true
        );

        $reason = 'Duplicate invoice';

        $this->setupDefaultContext();

        $this->entityManager
            ->expects($this->once())
            ->method('persist')
            ->with($this->callback(function ($arg) use ($reason) {
                return $arg instanceof DomainEvent
                    && $arg->eventName === 'invoice.cancelled'
                    && $arg->aggregateType === 'Invoice'
                    && $arg->payload['cancellation_reason'] === $reason;
            }));

        $this->entityManager
            ->expects($this->once())
            ->method('flush');

        // Act
        $logger->logInvoiceCancelled(123, $reason);

        // Assert - Expectations verified by mocks
    }

    /**
     * @test
     */
    public function it_logs_appointment_scheduled(): void
    {
        // Arrange
        $logger = new AuditLogger(
            entityManager: $this->entityManager,
            security: $this->security,
            requestStack: $this->requestStack,
            enabled: true
        );

        $this->setupDefaultContext();

        $this->entityManager
            ->expects($this->once())
            ->method('persist')
            ->with($this->callback(function ($arg) {
                return $arg instanceof DomainEvent
                    && $arg->eventName === 'appointment.scheduled';
            }));

        $this->entityManager
            ->expects($this->once())
            ->method('flush');

        // Act
        $logger->logAppointmentScheduled(456);

        // Assert - Expectations verified by mocks
    }

    /**
     * @test
     */
    public function it_captures_user_context(): void
    {
        // Arrange
        $logger = new AuditLogger(
            entityManager: $this->entityManager,
            security: $this->security,
            requestStack: $this->requestStack,
            enabled: true
        );

        $user = $this->createMock(User::class);

        $request = new Request();
        $request->server->set('REMOTE_ADDR', '192.168.1.1');
        $request->headers->set('User-Agent', 'Mozilla/5.0');

        $this->security
            ->method('getUser')
            ->willReturn($user);

        $this->requestStack
            ->method('getCurrentRequest')
            ->willReturn($request);

        $this->entityManager
            ->expects($this->once())
            ->method('persist')
            ->with($this->callback(function ($arg) use ($user) {
                return $arg instanceof DomainEvent
                    && $arg->user === $user
                    && $arg->metadata['ip_address'] === '192.168.1.1'
                    && $arg->metadata['user_agent'] === 'Mozilla/5.0';
            }));

        $this->entityManager
            ->expects($this->once())
            ->method('flush');

        // Act
        $logger->logCustomerCreated(789);

        // Assert - Expectations verified by mocks
    }

    /**
     * @test
     */
    public function it_handles_null_user_context(): void
    {
        // Arrange
        $logger = new AuditLogger(
            entityManager: $this->entityManager,
            security: $this->security,
            requestStack: $this->requestStack,
            enabled: true
        );

        $this->security
            ->method('getUser')
            ->willReturn(null);

        $this->requestStack
            ->method('getCurrentRequest')
            ->willReturn(null);

        $this->entityManager
            ->expects($this->once())
            ->method('persist')
            ->with($this->callback(function ($arg) {
                return $arg instanceof DomainEvent
                    && $arg->user === null
                    && $arg->metadata['ip_address'] === null
                    && $arg->metadata['user_agent'] === null;
            }));

        $this->entityManager
            ->expects($this->once())
            ->method('flush');

        // Act
        $logger->logRecordCreated(999);

        // Assert - Expectations verified by mocks
    }

    /**
     * @test
     */
    public function it_merges_provided_metadata_with_request_context(): void
    {
        // Arrange
        $logger = new AuditLogger(
            entityManager: $this->entityManager,
            security: $this->security,
            requestStack: $this->requestStack,
            enabled: true
        );

        $providedMetadata = [
            'reason' => 'Data correction',
            'source' => 'admin-panel',
        ];

        $this->setupDefaultContext();

        $this->entityManager
            ->expects($this->once())
            ->method('persist')
            ->with($this->callback(function ($arg) use ($providedMetadata) {
                return $arg instanceof DomainEvent
                    && $arg->metadata['reason'] === 'Data correction'
                    && $arg->metadata['source'] === 'admin-panel'
                    && isset($arg->metadata['ip_address'])
                    && isset($arg->metadata['user_agent']);
            }));

        $this->entityManager
            ->expects($this->once())
            ->method('flush');

        // Act
        $logger->logPatientUpdated(1, [], $providedMetadata);

        // Assert - Expectations verified by mocks
    }

    /**
     * @test
     */
    public function it_uses_standard_event_naming_convention_for_patient_events(): void
    {
        // Arrange
        $logger = new AuditLogger(
            entityManager: $this->entityManager,
            security: $this->security,
            requestStack: $this->requestStack,
            enabled: true
        );

        $this->setupDefaultContext();

        $this->entityManager
            ->expects($this->once())
            ->method('persist')
            ->with($this->callback(function ($arg) {
                return $arg instanceof DomainEvent
                    && $arg->eventName === 'patient.created';
            }));

        $this->entityManager
            ->expects($this->once())
            ->method('flush');

        // Act
        $logger->logPatientCreated(1);

        // Assert - Event name follows pattern: aggregate.action (lowercase with dot separator)
        $this->assertTrue(true);
    }

    /**
     * @test
     */
    public function it_uses_standard_event_naming_convention_for_invoice_events(): void
    {
        // Arrange
        $logger = new AuditLogger(
            entityManager: $this->entityManager,
            security: $this->security,
            requestStack: $this->requestStack,
            enabled: true
        );

        $this->setupDefaultContext();

        $this->entityManager
            ->expects($this->once())
            ->method('persist')
            ->with($this->callback(function ($arg) {
                return $arg instanceof DomainEvent
                    && $arg->eventName === 'invoice.cancelled';
            }));

        $this->entityManager
            ->expects($this->once())
            ->method('flush');

        // Act
        $logger->logInvoiceCancelled(1, 'test reason');

        // Assert - Event name follows pattern: aggregate.action
        $this->assertTrue(true);
    }

    /**
     * @test
     */
    public function it_reports_enabled_status(): void
    {
        // Arrange
        $enabledLogger = new AuditLogger(
            entityManager: $this->entityManager,
            security: $this->security,
            requestStack: $this->requestStack,
            enabled: true
        );

        $disabledLogger = new AuditLogger(
            entityManager: $this->entityManager,
            security: $this->security,
            requestStack: $this->requestStack,
            enabled: false
        );

        // Act & Assert
        $this->assertTrue($enabledLogger->isEnabled());
        $this->assertFalse($disabledLogger->isEnabled());
    }

    private function setupDefaultContext(): void
    {
        $this->security
            ->method('getUser')
            ->willReturn(null);

        $request = $this->createMock(Request::class);
        $request->method('getClientIp')->willReturn('127.0.0.1');
        $request->headers = $this->createMock(\Symfony\Component\HttpFoundation\HeaderBag::class);
        $request->headers->method('get')->with('User-Agent')->willReturn('TestAgent');

        $this->requestStack
            ->method('getCurrentRequest')
            ->willReturn($request);
    }
}
