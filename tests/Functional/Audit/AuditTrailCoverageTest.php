<?php

declare(strict_types=1);

namespace App\Tests\Functional\Audit;

use ApiPlatform\Symfony\Bundle\Test\ApiTestCase;
use App\Domain\Entity\AuditTrail;
use App\Tests\Factory\AppointmentFactory;
use App\Tests\Factory\CustomerFactory;
use App\Tests\Factory\PatientFactory;
use App\Tests\Factory\UserFactory;
use Zenstruck\Foundry\Test\Factories;
use Zenstruck\Foundry\Test\ResetDatabase;

class AuditTrailCoverageTest extends ApiTestCase
{
    use ResetDatabase, Factories;

    private $client;

    protected function setUp(): void
    {
        parent::setUp();
        $this->client = static::createClient();
        
        // Ensure audit is enabled globally and for all modules
        $_ENV['AUDIT_TRAIL_ENABLED'] = true;
        $_ENV['AUDIT_TRAIL_APPOINTMENT_ENABLED'] = true;
        $_ENV['AUDIT_TRAIL_INVOICE_ENABLED'] = true;
        $_ENV['AUDIT_TRAIL_RECORD_ENABLED'] = true;
    }

    public function testAppointmentCreationIsAudited(): void
    {
        // 1. Arrange: Login & Data
        $user = UserFactory::createOne(['roles' => ['ROLE_ADMIN']]);
        $patient = PatientFactory::createOne();
        $this->client->loginUser($user);

        // 2. Act: Create Appointment via API
        $this->client->request('POST', '/api/appointments', [
            'headers' => [
                'Content-Type' => 'application/ld+json',
                'Accept' => 'application/ld+json'
            ],
            'json' => [
                'title' => 'Audit Check Appointment',
                'startsAt' => (new \DateTimeImmutable('+1 day 10:00'))->format(\DateTimeInterface::ATOM),
                'endsAt' => (new \DateTimeImmutable('+1 day 11:00'))->format(\DateTimeInterface::ATOM),
                'type' => 'general',
                'patientId' => $patient->id,
                'userId' => $user->id,
                'allDay' => false
            ]
        ]);

        $this->assertResponseStatusCodeSame(201);

        // 3. Assert: Audit Trail exists
        $audit = $this->getContainer()->get('doctrine')->getRepository(AuditTrail::class)->findOneBy([
            'entityType' => 'Appointment',
            'operation' => 'created'
        ]);

        $this->assertNotNull($audit, 'Audit trail for Appointment creation missing');
        $this->assertSame('Audit Check Appointment', $audit->getNewValue('title'));
        $this->assertEquals($user->id, $audit->changedBy->id);
    }

    public function testRecordCreationIsAudited(): void
    {
        // 1. Arrange
        $user = UserFactory::createOne();
        $patient = PatientFactory::createOne();
        $this->client->loginUser($user);

        // 2. Act
        $this->client->request('POST', '/api/records', [
            'headers' => [
                'Content-Type' => 'application/ld+json',
                'Accept' => 'application/ld+json'
            ],
            'json' => [
                'patient' => '/api/patients/' . $patient->id,
                'physiotherapyTreatment' => 'Manual Therapy Audit Test',
                'consultationReason' => 'Pain',
                'createdAt' => (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM)
            ]
        ]);

        $this->assertResponseStatusCodeSame(201);

        // 3. Assert
        $audit = $this->getContainer()->get('doctrine')->getRepository(AuditTrail::class)->findOneBy([
            'entityType' => 'Record',
            'operation' => 'created'
        ]);

        $this->assertNotNull($audit, 'Audit trail for Record creation missing');
        $this->assertSame('Manual Therapy Audit Test', $audit->getNewValue('physiotherapyTreatment'));
    }

    public function testInvoiceCreationIsAudited(): void
    {
        // 1. Arrange
        $user = UserFactory::createOne();
        $this->client->loginUser($user);

        // 2. Act
        $this->client->request('POST', '/api/invoices', [
            'headers' => [
                'Content-Type' => 'application/ld+json',
                'Accept' => 'application/ld+json'
            ],
            'json' => [
                'fullName' => 'Audit Invoice Client',
                'taxId' => 'AUDIT999', // Triggers Customer creation too
                'email' => 'audit@invoice.com',
                'address' => 'Audit Street 1',
                'lines' => [
                    ['concept' => 'Session 1', 'quantity' => 1, 'price' => 50.0]
                ]
            ]
        ]);

        $this->assertResponseStatusCodeSame(201);

        // 3. Assert: Invoice Audit
        $auditInvoice = $this->getContainer()->get('doctrine')->getRepository(AuditTrail::class)->findOneBy([
            'entityType' => 'Invoice',
            'operation' => 'created',
            // 'entityId' => '1' // Removed ID assumption
        ]);
        
        // Find by content if ID is unpredictable
        if (!$auditInvoice) {
             $audits = $this->getContainer()->get('doctrine')->getRepository(AuditTrail::class)->findBy(['entityType' => 'Invoice']);
             foreach($audits as $a) {
                 if ($a->getNewValue('amount') == 50.0) {
                     $auditInvoice = $a;
                     break;
                 }
             }
        }

        $this->assertNotNull($auditInvoice, 'Audit trail for Invoice creation missing');
        $this->assertEquals(50.0, $auditInvoice->getNewValue('amount'));

        // 4. Assert: Customer Audit (Implicit creation)
        $auditCustomer = $this->getContainer()->get('doctrine')->getRepository(AuditTrail::class)->findOneBy([
            'entityType' => 'Customer',
            'operation' => 'created'
        ]);
        
        $this->assertNotNull($auditCustomer, 'Implicit Customer creation should also be audited');
        $this->assertSame('AUDIT999', $auditCustomer->getNewValue('taxId'));
    }
}