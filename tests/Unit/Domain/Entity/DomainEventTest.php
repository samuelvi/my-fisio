<?php

declare(strict_types=1);

namespace App\Tests\Unit\Domain\Entity;

use App\Domain\Entity\DomainEvent;
use App\Domain\Entity\User;
use PHPUnit\Framework\TestCase;

/**
 * Unit tests for DomainEvent entity
 *
 * Tests follow Event Sourcing best practices:
 * - Events are immutable
 * - Complete payload storage
 * - UUID uniqueness
 * - Correlation and causation tracking
 */
class DomainEventTest extends TestCase
{
    /**
     * @test
     */
    public function it_creates_domain_event_with_required_fields(): void
    {
        // Arrange
        $eventName = 'patient.created';
        $aggregateType = 'Patient';
        $aggregateId = '123';
        $payload = ['firstName' => 'John', 'lastName' => 'Doe'];

        // Act
        $event = DomainEvent::create(
            eventName: $eventName,
            aggregateType: $aggregateType,
            aggregateId: $aggregateId,
            payload: $payload
        );

        // Assert
        $this->assertNull($event->id);
        $this->assertNotEmpty($event->eventId);
        $this->assertSame($eventName, $event->eventName);
        $this->assertSame(1, $event->eventVersion);
        $this->assertSame($aggregateType, $event->aggregateType);
        $this->assertSame($aggregateId, $event->aggregateId);
        $this->assertSame($payload, $event->payload);
        $this->assertInstanceOf(\DateTimeImmutable::class, $event->occurredAt);
        $this->assertInstanceOf(\DateTimeImmutable::class, $event->recordedAt);
        $this->assertNull($event->user);
        $this->assertNull($event->metadata);
        $this->assertNull($event->correlationId);
        $this->assertNull($event->causationId);
    }

    /**
     * @test
     */
    public function it_generates_valid_uuid_v4(): void
    {
        // Arrange & Act
        $event = DomainEvent::create(
            eventName: 'invoice.issued',
            aggregateType: 'Invoice',
            aggregateId: '456',
            payload: []
        );

        // Assert - UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i',
            $event->eventId
        );
    }

    /**
     * @test
     */
    public function it_generates_unique_event_ids(): void
    {
        // Arrange & Act
        $event1 = DomainEvent::create('test.event', 'Test', '1', []);
        $event2 = DomainEvent::create('test.event', 'Test', '1', []);

        // Assert
        $this->assertNotEquals($event1->eventId, $event2->eventId);
    }

    /**
     * @test
     */
    public function it_creates_event_with_user_context(): void
    {
        // Arrange
        $user = $this->createMock(User::class);
        $metadata = ['ip_address' => '192.168.1.1', 'user_agent' => 'Mozilla/5.0'];

        // Act
        $event = DomainEvent::create(
            eventName: 'appointment.scheduled',
            aggregateType: 'Appointment',
            aggregateId: '789',
            payload: ['date' => '2026-01-15', 'time' => '10:00'],
            user: $user,
            metadata: $metadata
        );

        // Assert
        $this->assertSame($user, $event->user);
        $this->assertSame($metadata, $event->metadata);
    }

    /**
     * @test
     */
    public function it_supports_correlation_and_causation_ids(): void
    {
        // Arrange
        $correlationId = '550e8400-e29b-41d4-a716-446655440000';
        $causationId = '660e8400-e29b-41d4-a716-446655440001';

        // Act
        $event = DomainEvent::create(
            eventName: 'invoice.cancelled',
            aggregateType: 'Invoice',
            aggregateId: '100',
            payload: ['reason' => 'Duplicate'],
            correlationId: $correlationId,
            causationId: $causationId
        );

        // Assert
        $this->assertSame($correlationId, $event->correlationId);
        $this->assertSame($causationId, $event->causationId);
    }

    /**
     * @test
     */
    public function it_converts_aggregate_id_to_string(): void
    {
        // Arrange
        $aggregateId = 999;

        // Act
        $event = DomainEvent::create(
            eventName: 'customer.created',
            aggregateType: 'Customer',
            aggregateId: (string) $aggregateId,
            payload: []
        );

        // Assert
        $this->assertSame('999', $event->aggregateId);
        $this->assertIsString($event->aggregateId);
    }

    /**
     * @test
     */
    public function it_adds_metadata_to_event(): void
    {
        // Arrange
        $event = DomainEvent::create(
            eventName: 'patient.updated',
            aggregateType: 'Patient',
            aggregateId: '1',
            payload: []
        );

        // Act
        $event->addMetadata('ip_address', '192.168.1.1');
        $event->addMetadata('reason', 'Data correction');

        // Assert
        $this->assertArrayHasKey('ip_address', $event->metadata);
        $this->assertArrayHasKey('reason', $event->metadata);
        $this->assertSame('192.168.1.1', $event->metadata['ip_address']);
        $this->assertSame('Data correction', $event->metadata['reason']);
    }

    /**
     * @test
     */
    public function it_gets_metadata_value(): void
    {
        // Arrange
        $metadata = ['source' => 'api', 'version' => '2.0'];
        $event = DomainEvent::create(
            eventName: 'record.created',
            aggregateType: 'Record',
            aggregateId: '1',
            payload: [],
            metadata: $metadata
        );

        // Act
        $source = $event->getMetadata('source');
        $version = $event->getMetadata('version');
        $nonexistent = $event->getMetadata('nonexistent');

        // Assert
        $this->assertSame('api', $source);
        $this->assertSame('2.0', $version);
        $this->assertNull($nonexistent);
    }

    /**
     * @test
     */
    public function it_gets_payload_value(): void
    {
        // Arrange
        $payload = [
            'cancellation_reason' => 'Patient no-show',
            'original_date' => '2026-01-15',
        ];

        $event = DomainEvent::create(
            eventName: 'appointment.cancelled',
            aggregateType: 'Appointment',
            aggregateId: '1',
            payload: $payload
        );

        // Act
        $reason = $event->getPayloadValue('cancellation_reason');
        $date = $event->getPayloadValue('original_date');
        $nonexistent = $event->getPayloadValue('nonexistent');

        // Assert
        $this->assertSame('Patient no-show', $reason);
        $this->assertSame('2026-01-15', $date);
        $this->assertNull($nonexistent);
    }

    /**
     * @test
     */
    public function it_handles_complex_payload_structures(): void
    {
        // Arrange
        $complexPayload = [
            'changes' => [
                'firstName' => ['before' => 'John', 'after' => 'Jane'],
                'lastName' => ['before' => 'Doe', 'after' => 'Smith'],
            ],
            'nested' => [
                'level1' => [
                    'level2' => ['value' => 'deep'],
                ],
            ],
        ];

        // Act
        $event = DomainEvent::create(
            eventName: 'patient.updated',
            aggregateType: 'Patient',
            aggregateId: '1',
            payload: $complexPayload
        );

        // Assert
        $this->assertSame($complexPayload, $event->payload);
        $this->assertIsArray($event->getPayloadValue('changes'));
        $this->assertIsArray($event->getPayloadValue('nested'));
    }

    /**
     * @test
     */
    public function it_supports_event_versioning(): void
    {
        // Arrange & Act
        $event = DomainEvent::create(
            eventName: 'invoice.issued',
            aggregateType: 'Invoice',
            aggregateId: '1',
            payload: []
        );

        // Assert - Default version should be 1
        $this->assertSame(1, $event->eventVersion);
    }

    /**
     * @test
     */
    public function occurred_at_and_recorded_at_are_immutable(): void
    {
        // Arrange
        $event = DomainEvent::create(
            eventName: 'patient.created',
            aggregateType: 'Patient',
            aggregateId: '1',
            payload: []
        );

        $originalOccurred = $event->occurredAt;
        $originalRecorded = $event->recordedAt;

        // Act - Try to modify (creates new instances, doesn't modify originals)
        $modifiedOccurred = $event->occurredAt->modify('+1 day');
        $modifiedRecorded = $event->recordedAt->modify('+1 day');

        // Assert - Originals remain unchanged
        $this->assertEquals($originalOccurred, $event->occurredAt);
        $this->assertEquals($originalRecorded, $event->recordedAt);
        $this->assertNotEquals($modifiedOccurred, $event->occurredAt);
        $this->assertNotEquals($modifiedRecorded, $event->recordedAt);
    }

    /**
     * @test
     */
    public function it_tracks_business_time_vs_technical_time(): void
    {
        // Arrange & Act
        $event = DomainEvent::create(
            eventName: 'invoice.issued',
            aggregateType: 'Invoice',
            aggregateId: '1',
            payload: []
        );

        // Assert - Both timestamps should be set and very close (within 1 second)
        $this->assertInstanceOf(\DateTimeImmutable::class, $event->occurredAt);
        $this->assertInstanceOf(\DateTimeImmutable::class, $event->recordedAt);

        $diff = $event->recordedAt->getTimestamp() - $event->occurredAt->getTimestamp();
        $this->assertLessThanOrEqual(1, abs($diff));
    }

    /**
     * @test
     */
    public function it_handles_empty_payload(): void
    {
        // Arrange & Act
        $event = DomainEvent::create(
            eventName: 'customer.created',
            aggregateType: 'Customer',
            aggregateId: '1',
            payload: []
        );

        // Assert
        $this->assertEmpty($event->payload);
        $this->assertIsArray($event->payload);
    }

    /**
     * @test
     */
    public function it_supports_standard_event_naming_convention(): void
    {
        // Arrange - Test various event names following 'aggregate.action' pattern
        $eventNames = [
            'patient.created',
            'patient.updated',
            'invoice.issued',
            'invoice.cancelled',
            'appointment.scheduled',
            'appointment.cancelled',
            'customer.created',
            'record.updated',
        ];

        foreach ($eventNames as $eventName) {
            // Act
            $event = DomainEvent::create(
                eventName: $eventName,
                aggregateType: 'Test',
                aggregateId: '1',
                payload: []
            );

            // Assert
            $this->assertSame($eventName, $event->eventName);
            $this->assertMatchesRegularExpression('/^[a-z]+\.[a-z]+$/', $event->eventName);
        }
    }
}
