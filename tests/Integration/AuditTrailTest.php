<?php

declare(strict_types=1);

namespace App\Tests\Integration;

use App\Application\Command\Patient\CreatePatientCommand;
use App\Application\Command\Patient\UpdatePatientCommand;
use App\Domain\Entity\AuditTrail;
use App\Domain\Entity\Patient;
use App\Domain\Entity\StoredEvent;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\Messenger\MessageBusInterface;

class AuditTrailTest extends KernelTestCase
{
    private MessageBusInterface $commandBus;
    private $entityManager;

    protected function setUp(): void
    {
        self::bootKernel();
        $this->commandBus = self::getContainer()->get('command.bus');
        $this->entityManager = self::getContainer()->get('doctrine')->getManager();
        
        // Ensure audit is enabled
        $_ENV['AUDIT_TRAIL_ENABLED'] = true;
    }

    public function testCreatePatientGeneratesAuditTrail(): void
    {
        // 1. Create Patient
        $command = new CreatePatientCommand(
            firstName: 'Audit',
            lastName: 'Test',
            email: 'audit@test.com',
            taxId: 'AUDIT123'
        );
        
        $this->commandBus->dispatch($command);

        // 2. Verify Patient Exists
        $patient = $this->entityManager->getRepository(Patient::class)->findOneBy(['taxId' => 'AUDIT123']);
        $this->assertNotNull($patient);

        // 3. Verify Event Store
        $events = $this->entityManager->getRepository(StoredEvent::class)->findAll();
        $this->assertNotEmpty($events, 'Event Store should not be empty');
        
        // Find the specific creation event
        $creationEvent = null;
        foreach ($events as $event) {
            if ($event->getAggregateId() === (string)$patient->id && $event->getEventName() === 'PatientCreated') {
                $creationEvent = $event;
                break;
            }
        }
        $this->assertNotNull($creationEvent, 'PatientCreated event should be in EventStore');

        // 4. Verify Audit Trail
        $audits = $this->entityManager->getRepository(AuditTrail::class)->findBy([
            'entityType' => 'Patient',
            'entityId' => (string)$patient->id
        ]);

        $this->assertNotEmpty($audits, 'Audit Trail should have entries');
        $this->assertSame('created', $audits[0]->operation);
        $this->assertSame('Audit', $audits[0]->getNewValue('firstName'));
    }

    public function testUpdatePatientGeneratesAuditTrail(): void
    {
        // 1. Create Initial Patient directly to ensure clean state
        $patient = Patient::create('Update', 'Test', null, 'UPDATE123');
        $this->entityManager->persist($patient);
        $this->entityManager->flush();
        $patientId = $patient->id;

        // Clear Identity Map to simulate new request
        $this->entityManager->clear();

        // 2. Dispatch Update Command
        $command = new UpdatePatientCommand(
            id: $patientId,
            firstName: 'UpdatedName', // Changed
            lastName: 'Test',         // Same
            taxId: 'UPDATE123'
        );

        $this->commandBus->dispatch($command);

        // 3. Verify Audit Trail
        $audits = $this->entityManager->getRepository(AuditTrail::class)->findBy([
            'entityType' => 'Patient',
            'entityId' => (string)$patientId,
            'operation' => 'updated'
        ]);

        $this->assertNotEmpty($audits, 'Should have update audit log');
        
        $audit = $audits[0];
        $this->assertTrue($audit->hasFieldChanged('firstName'));
        $this->assertFalse($audit->hasFieldChanged('lastName'));
        $this->assertSame('Update', $audit->getOldValue('firstName'));
        $this->assertSame('UpdatedName', $audit->getNewValue('firstName'));
    }
}
