<?php

declare(strict_types=1);

namespace App\Tests\Functional\Audit;

use App\Infrastructure\Audit\DoctrineAuditListener;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

/**
 * Base test case for audit functional tests
 *
 * Automatically registers the DoctrineAuditListener with the EventManager
 * to ensure audit trails are captured during tests.
 *
 * Background:
 * Symfony's test container optimizes away event listeners by default.
 * We manually register the listener in setUp() to ensure it fires during tests.
 */
abstract class AuditTestCase extends KernelTestCase
{
    protected EntityManagerInterface $entityManager;
    protected DoctrineAuditListener $auditListener;

    protected function setUp(): void
    {
        self::bootKernel(['environment' => 'test']);
        $container = static::getContainer();

        $this->entityManager = $container->get(EntityManagerInterface::class);

        // Get the configured audit listener (now public in test environment)
        $this->auditListener = $container->get(DoctrineAuditListener::class);

        // Manually register the listener with Doctrine's EventManager
        // This is necessary because Symfony's test container doesn't automatically
        // register event listeners for performance reasons
        $eventManager = $this->entityManager->getEventManager();

        // Remove any existing instances first (in case of multiple test runs)
        $eventManager->removeEventListener(['postPersist', 'onFlush'], $this->auditListener);

        // Add the listener
        $eventManager->addEventListener(['postPersist', 'onFlush'], $this->auditListener);
    }
}
