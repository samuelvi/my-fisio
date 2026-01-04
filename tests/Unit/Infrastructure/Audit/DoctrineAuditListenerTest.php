<?php

declare(strict_types=1);

namespace App\Tests\Unit\Infrastructure\Audit;

use App\Domain\Entity\AuditTrail;
use App\Domain\Entity\Patient;
use App\Domain\Entity\User;
use App\Infrastructure\Audit\DoctrineAuditListener;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Event\OnFlushEventArgs;
use Doctrine\ORM\Event\PostPersistEventArgs;
use Doctrine\ORM\Mapping\ClassMetadata;
use Doctrine\ORM\UnitOfWork;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * Unit tests for DoctrineAuditListener
 *
 * Tests verify:
 * - Automatic capture of entity changes
 * - Correct operation detection (created/updated/deleted)
 * - Change serialization
 * - User context tracking
 * - Enable/disable functionality
 */
class DoctrineAuditListenerTest extends TestCase
{
    private DoctrineAuditListener $listener;
    private Security $security;
    private RequestStack $requestStack;
    private EntityManagerInterface $entityManager;
    private UnitOfWork $unitOfWork;

    protected function setUp(): void
    {
        $this->security = $this->createMock(Security::class);
        $this->requestStack = $this->createMock(RequestStack::class);
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->unitOfWork = $this->createMock(UnitOfWork::class);

        $this->entityManager
            ->method('getUnitOfWork')
            ->willReturn($this->unitOfWork);
    }

    /**
     * @test
     */
    public function it_does_nothing_when_disabled(): void
    {
        // Arrange
        $listener = new DoctrineAuditListener(
            enabled: false,
            security: $this->security,
            requestStack: $this->requestStack
        );

        $args = $this->createMock(OnFlushEventArgs::class);
        $args->expects($this->never())->method('getObjectManager');

        // Act
        $listener->onFlush($args);

        // Assert - No assertions needed, mock expectations verify behavior
    }

    /**
     * @test
     */
    public function it_captures_entity_insertion(): void
    {
        // Arrange
        $listener = new DoctrineAuditListener(
            enabled: true,
            security: $this->security,
            requestStack: $this->requestStack
        );

        $patient = $this->createMock(Patient::class);
        $patient->id = 1;

        // Setup class metadata for the Patient entity
        $patientMetadata = $this->createMock(ClassMetadata::class);
        $patientMetadata->method('getFieldNames')->willReturn(['id', 'firstName', 'lastName']);
        $patientMetadata->method('getFieldValue')
            ->willReturnCallback(function ($entity, $field) use ($patient) {
                return match ($field) {
                    'id' => 1,
                    'firstName' => 'John',
                    'lastName' => 'Doe',
                    default => null,
                };
            });

        $this->entityManager
            ->method('getClassMetadata')
            ->willReturnCallback(function ($class) use ($patientMetadata) {
                if (str_contains($class, 'Patient')) {
                    return $patientMetadata;
                }
                return $this->createMock(ClassMetadata::class);
            });

        $this->setupUserContext();

        // Expect persist and flush to be called
        $this->entityManager
            ->expects($this->once())
            ->method('persist')
            ->with($this->callback(function ($arg) {
                return $arg instanceof AuditTrail
                    && str_contains($arg->entityType, 'Patient')
                    && $arg->entityId === '1'
                    && $arg->operation === 'created';
            }));

        $this->entityManager
            ->expects($this->once())
            ->method('flush');

        $args = new PostPersistEventArgs($patient, $this->entityManager);

        // Act
        $listener->postPersist($args);

        // Assert - Expectations verified by mocks
    }

    /**
     * @test
     */
    public function it_captures_entity_update(): void
    {
        // Arrange
        $listener = new DoctrineAuditListener(
            enabled: true,
            security: $this->security,
            requestStack: $this->requestStack
        );

        $patient = $this->createMock(Patient::class);
        $patient->id = 1;

        $this->unitOfWork
            ->method('getScheduledEntityInsertions')
            ->willReturn([]);

        $this->unitOfWork
            ->method('getScheduledEntityUpdates')
            ->willReturn([$patient]);

        $this->unitOfWork
            ->method('getScheduledEntityDeletions')
            ->willReturn([]);

        $this->unitOfWork
            ->method('getEntityChangeSet')
            ->with($patient)
            ->willReturn([
                'firstName' => ['John', 'Jane'],
                'email' => ['old@example.com', 'new@example.com'],
            ]);

        $this->setupUserContext();
        $this->setupClassMetadata();

        // Expect persist with updated operation
        $this->entityManager
            ->expects($this->once())
            ->method('persist')
            ->with($this->callback(function ($arg) {
                return $arg instanceof AuditTrail
                    && $arg->operation === 'updated'
                    && isset($arg->changes['firstName'])
                    && $arg->changes['firstName']['before'] === 'John'
                    && $arg->changes['firstName']['after'] === 'Jane';
            }));

        $args = new OnFlushEventArgs($this->entityManager);

        // Act
        $listener->onFlush($args);

        // Assert - Expectations verified by mocks
    }

    /**
     * @test
     */
    public function it_captures_entity_deletion(): void
    {
        // Arrange
        $listener = new DoctrineAuditListener(
            enabled: true,
            security: $this->security,
            requestStack: $this->requestStack
        );

        $patient = $this->createMock(Patient::class);
        $patient->id = 1;

        $this->unitOfWork
            ->method('getScheduledEntityInsertions')
            ->willReturn([]);

        $this->unitOfWork
            ->method('getScheduledEntityUpdates')
            ->willReturn([]);

        $this->unitOfWork
            ->method('getScheduledEntityDeletions')
            ->willReturn([$patient]);

        $this->unitOfWork
            ->method('getOriginalEntityData')
            ->with($patient)
            ->willReturn([
                'id' => 1,
                'firstName' => 'John',
                'lastName' => 'Doe',
            ]);

        $this->setupUserContext();
        $this->setupClassMetadata();

        // Expect persist with deleted operation
        $this->entityManager
            ->expects($this->once())
            ->method('persist')
            ->with($this->callback(function ($arg) {
                return $arg instanceof AuditTrail
                    && $arg->operation === 'deleted'
                    && isset($arg->changes['firstName'])
                    && $arg->changes['firstName']['before'] === 'John'
                    && $arg->changes['firstName']['after'] === null;
            }));

        $args = new OnFlushEventArgs($this->entityManager);

        // Act
        $listener->onFlush($args);

        // Assert - Expectations verified by mocks
    }

    /**
     * @test
     */
    public function it_captures_user_context(): void
    {
        // Arrange
        $listener = new DoctrineAuditListener(
            enabled: true,
            security: $this->security,
            requestStack: $this->requestStack
        );

        $patient = $this->createMock(Patient::class);
        $patient->id = 1;

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

        // Setup class metadata
        $patientMetadata = $this->createMock(ClassMetadata::class);
        $patientMetadata->method('getFieldNames')->willReturn(['id', 'firstName']);
        $patientMetadata->method('getFieldValue')
            ->willReturnCallback(fn ($entity, $field) => match ($field) {
                'id' => 1,
                'firstName' => 'John',
                default => null,
            });

        $this->entityManager
            ->method('getClassMetadata')
            ->willReturn($patientMetadata);

        // Expect persist with user context
        $this->entityManager
            ->expects($this->once())
            ->method('persist')
            ->with($this->callback(function ($arg) use ($user) {
                return $arg instanceof AuditTrail
                    && $arg->changedBy === $user
                    && $arg->ipAddress === '192.168.1.1'
                    && $arg->userAgent === 'Mozilla/5.0';
            }));

        $this->entityManager
            ->expects($this->once())
            ->method('flush');

        $args = new PostPersistEventArgs($patient, $this->entityManager);

        // Act
        $listener->postPersist($args);

        // Assert - Expectations verified by mocks
    }

    /**
     * @test
     */
    public function it_skips_non_audited_entities(): void
    {
        // Arrange
        $listener = new DoctrineAuditListener(
            enabled: true,
            security: $this->security,
            requestStack: $this->requestStack
        );

        // Create a non-audited entity (e.g., stdClass)
        $nonAuditedEntity = new \stdClass();
        $nonAuditedEntity->id = 1;

        $this->unitOfWork
            ->method('getScheduledEntityInsertions')
            ->willReturn([$nonAuditedEntity]);

        $this->unitOfWork
            ->method('getScheduledEntityUpdates')
            ->willReturn([]);

        $this->unitOfWork
            ->method('getScheduledEntityDeletions')
            ->willReturn([]);

        // Expect NO persist call for non-audited entities
        $this->entityManager
            ->expects($this->never())
            ->method('persist');

        $args = new OnFlushEventArgs($this->entityManager);

        // Act
        $listener->onFlush($args);

        // Assert - Expectations verified by mocks
    }

    /**
     * @test
     */
    public function it_handles_null_user_context(): void
    {
        // Arrange
        $listener = new DoctrineAuditListener(
            enabled: true,
            security: $this->security,
            requestStack: $this->requestStack
        );

        $patient = $this->createMock(Patient::class);
        $patient->id = 1;

        $this->security
            ->method('getUser')
            ->willReturn(null);

        $this->requestStack
            ->method('getCurrentRequest')
            ->willReturn(null);

        // Setup class metadata
        $patientMetadata = $this->createMock(ClassMetadata::class);
        $patientMetadata->method('getFieldNames')->willReturn(['id', 'firstName']);
        $patientMetadata->method('getFieldValue')
            ->willReturnCallback(fn ($entity, $field) => match ($field) {
                'id' => 1,
                'firstName' => 'John',
                default => null,
            });

        $this->entityManager
            ->method('getClassMetadata')
            ->willReturn($patientMetadata);

        // Expect persist with null user context
        $this->entityManager
            ->expects($this->once())
            ->method('persist')
            ->with($this->callback(function ($arg) {
                return $arg instanceof AuditTrail
                    && $arg->changedBy === null
                    && $arg->ipAddress === null
                    && $arg->userAgent === null;
            }));

        $this->entityManager
            ->expects($this->once())
            ->method('flush');

        $args = new PostPersistEventArgs($patient, $this->entityManager);

        // Act
        $listener->postPersist($args);

        // Assert - Expectations verified by mocks
    }

    private function setupUserContext(?User $user = null): void
    {
        $this->security
            ->method('getUser')
            ->willReturn($user);

        $request = $this->createMock(Request::class);
        $request->method('getClientIp')->willReturn('127.0.0.1');
        $request->headers = $this->createMock(\Symfony\Component\HttpFoundation\HeaderBag::class);
        $request->headers->method('get')->with('User-Agent')->willReturn('TestAgent');

        $this->requestStack
            ->method('getCurrentRequest')
            ->willReturn($request);
    }

    private function setupClassMetadata(): void
    {
        $metadata = $this->createMock(ClassMetadata::class);

        $this->entityManager
            ->method('getClassMetadata')
            ->with(AuditTrail::class)
            ->willReturn($metadata);

        $this->unitOfWork
            ->expects($this->once())
            ->method('computeChangeSet')
            ->with($metadata, $this->isInstanceOf(AuditTrail::class));
    }
}
