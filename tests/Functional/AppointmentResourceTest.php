<?php

declare(strict_types=1);

namespace App\Tests\Functional;

use ApiPlatform\Symfony\Bundle\Test\ApiTestCase;
use App\Tests\Factory\AppointmentFactory;
use App\Tests\Factory\PatientFactory;
use App\Tests\Factory\UserFactory;
use Zenstruck\Foundry\Test\Factories;
use Zenstruck\Foundry\Test\ResetDatabase;

class AppointmentResourceTest extends ApiTestCase
{
    use Factories;
    use ResetDatabase;

    private function requestAppointment(string $method, string $uri, array $auth, array $payload = []): array
    {
        $client = self::createClient();
        $options = [
            'auth_bearer' => $auth['token'],
            'headers' => [
                'Content-Type' => 'application/ld+json',
                'Accept' => 'application/ld+json',
            ],
        ];

        if (!empty($payload)) {
            $options['json'] = $payload;
        }

        $response = $client->request($method, $uri, $options);

        return [
            'response' => $response,
            'data' => $response->getStatusCode() === 204 ? [] : $response->toArray(false),
        ];
    }

    private function authenticate(): array
    {
        $client = self::createClient();

        $user = UserFactory::createOne([
            'email' => 'admin@example.com',
            'password' => 'password',
            'roles' => ['ROLE_ADMIN'],
        ]);

        $response = $client->request('POST', '/api/login_check', [
            'json' => [
                'username' => 'admin@example.com',
                'password' => 'password',
            ],
        ]);

        return [
            'token' => $response->toArray()['token'],
            'userId' => $user->id,
        ];
    }

    public function testCreateAppointment(): void
    {
        $auth = $this->authenticate();
        $patient = PatientFactory::createOne();

        $client = self::createClient();
        $client->request('POST', '/api/appointments', [
            'auth_bearer' => $auth['token'],
            'headers' => [
                'Content-Type' => 'application/ld+json',
                'Accept' => 'application/ld+json',
            ],
            'json' => [
                'patientId' => $patient->id,
                'userId' => $auth['userId'],
                'title' => 'Therapy Session',
                'startsAt' => '2025-12-25T10:00:00+00:00',
                'endsAt' => '2025-12-25T11:00:00+00:00',
                'notes' => 'First session',
            ],
        ]);

        $this->assertResponseStatusCodeSame(201);
        $this->assertJsonContains([
            '@type' => 'Appointment',
            'title' => 'Therapy Session',
            'patientName' => $patient->firstName.' '.$patient->lastName,
        ]);
    }

    public function testCreateAppointmentWithoutPatient(): void
    {
        $auth = $this->authenticate();

        $client = self::createClient();
        $client->request('POST', '/api/appointments', [
            'auth_bearer' => $auth['token'],
            'headers' => [
                'Content-Type' => 'application/ld+json',
                'Accept' => 'application/ld+json',
            ],
            'json' => [
                'userId' => $auth['userId'],
                'title' => 'General Clinic Prep',
                'startsAt' => '2025-12-26T09:00:00+00:00',
                'endsAt' => '2025-12-26T10:00:00+00:00',
            ],
        ]);

        $this->assertResponseStatusCodeSame(201);
        $this->assertJsonContains([
            '@type' => 'Appointment',
            'title' => 'General Clinic Prep',
        ]);
    }

    public function testGetAppointments(): void
    {
        $auth = $this->authenticate();
        $patient = PatientFactory::createOne();
        AppointmentFactory::createMany(3, [
            'patient' => $patient,
            'userId' => $auth['userId'],
            'startsAt' => new \DateTimeImmutable('2026-01-06T10:00:00'),
            'endsAt' => new \DateTimeImmutable('2026-01-06T11:00:00'),
        ]);

        $client = self::createClient();
        $client->request('GET', '/api/appointments', [
            'auth_bearer' => $auth['token'],
            'headers' => [
                'Accept' => 'application/ld+json',
            ],
            'query' => [
                'start' => '2026-01-01T00:00:00',
                'end' => '2026-01-31T23:59:59',
            ],
        ]);

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains([
            'totalItems' => 3,
        ]);
    }

    public function testGetAppointmentsFailsWithoutFilters(): void
    {
        $auth = $this->authenticate();

        $client = self::createClient();
        $client->request('GET', '/api/appointments', [
            'auth_bearer' => $auth['token'],
            'headers' => [
                'Accept' => 'application/ld+json',
            ],
        ]);

        $this->assertResponseStatusCodeSame(400);
        $this->assertJsonContains([
            'detail' => 'Filtros de fecha "start" y "end" son obligatorios para consultar citas globales.',
        ]);
    }

    public function testGetAppointmentsWithApiPlatformFilters(): void
    {
        $auth = $this->authenticate();
        $patient = PatientFactory::createOne();
        AppointmentFactory::createOne([
            'patient' => $patient,
            'userId' => $auth['userId'],
            'startsAt' => new \DateTimeImmutable('2026-05-15T10:00:00'),
            'endsAt' => new \DateTimeImmutable('2026-05-15T11:00:00'),
        ]);

        $client = self::createClient();
        $client->request('GET', '/api/appointments', [
            'auth_bearer' => $auth['token'],
            'headers' => [
                'Accept' => 'application/ld+json',
            ],
            'query' => [
                'startsAt[after]' => '2026-05-01T00:00:00',
                'endsAt[before]' => '2026-05-31T23:59:59',
            ],
        ]);

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains([
            'totalItems' => 1,
        ]);
    }

    public function testCreateAppointmentPersistsAndReloads(): void
    {
        $auth = $this->authenticate();
        $patient = PatientFactory::createOne();

        $payload = [
            'patientId' => $patient->id,
            'userId' => $auth['userId'],
            'title' => 'Session A',
            'startsAt' => '2026-01-10T09:00:00+00:00',
            'endsAt' => '2026-01-10T10:00:00+00:00',
            'notes' => 'Initial booking',
            'type' => 'appointment',
            'allDay' => false,
        ];

        $create = $this->requestAppointment('POST', '/api/appointments', $auth, $payload);
        $this->assertResponseStatusCodeSame(201);

        $id = $create['data']['id'] ?? null;
        $this->assertNotNull($id);

        $get = $this->requestAppointment('GET', "/api/appointments/{$id}", $auth);
        $this->assertResponseIsSuccessful();
        $this->assertJsonContains([
            'id' => $id,
            'title' => 'Session A',
            'patientName' => $patient->firstName.' '.$patient->lastName,
            'notes' => 'Initial booking',
            'type' => 'appointment',
            'allDay' => false,
        ]);
        $startsAt = new \DateTimeImmutable($get['data']['startsAt']);
        $endsAt = new \DateTimeImmutable($get['data']['endsAt']);
        $this->assertSame('2026-01-10T09:00', $startsAt->format('Y-m-d\\TH:i'));
        $this->assertSame('2026-01-10T10:00', $endsAt->format('Y-m-d\\TH:i'));
    }

    public function testUpdateAppointmentPersistsAllFields(): void
    {
        $auth = $this->authenticate();
        $patient = PatientFactory::createOne();
        $newPatient = PatientFactory::createOne();

        $create = $this->requestAppointment('POST', '/api/appointments', $auth, [
            'patientId' => $patient->id,
            'userId' => $auth['userId'],
            'title' => 'Session B',
            'startsAt' => '2026-02-01T09:30:00+00:00',
            'endsAt' => '2026-02-01T10:30:00+00:00',
            'notes' => 'Before update',
            'type' => 'appointment',
            'allDay' => false,
        ]);
        $this->assertResponseStatusCodeSame(201);
        $id = $create['data']['id'];

        $updatePayload = [
            'patientId' => $newPatient->id,
            'userId' => $auth['userId'],
            'title' => 'Session B Updated',
            'startsAt' => '2026-02-02T11:00:00+00:00',
            'endsAt' => '2026-02-02T12:15:00+00:00',
            'notes' => 'Updated notes',
            'type' => 'other',
            'allDay' => false,
        ];

        $this->requestAppointment('PUT', "/api/appointments/{$id}", $auth, $updatePayload);
        $this->assertResponseIsSuccessful();

        $get = $this->requestAppointment('GET', "/api/appointments/{$id}", $auth);
        $this->assertResponseIsSuccessful();
        $this->assertJsonContains([
            'id' => $id,
            'title' => 'Session B Updated',
            'patientName' => $newPatient->firstName.' '.$newPatient->lastName,
            'notes' => 'Updated notes',
            'type' => 'other',
            'allDay' => false,
        ]);
        $startsAt = new \DateTimeImmutable($get['data']['startsAt']);
        $endsAt = new \DateTimeImmutable($get['data']['endsAt']);
        $this->assertSame('2026-02-02T11:00', $startsAt->format('Y-m-d\\TH:i'));
        $this->assertSame('2026-02-02T12:15', $endsAt->format('Y-m-d\\TH:i'));
    }

    public function testMoveAppointmentSlotPersistsDates(): void
    {
        $auth = $this->authenticate();
        $patient = PatientFactory::createOne();

        $create = $this->requestAppointment('POST', '/api/appointments', $auth, [
            'patientId' => $patient->id,
            'userId' => $auth['userId'],
            'title' => 'Slot Move',
            'startsAt' => '2026-03-05T08:00:00+00:00',
            'endsAt' => '2026-03-05T09:00:00+00:00',
            'notes' => 'Move me',
            'type' => 'appointment',
            'allDay' => false,
        ]);
        $this->assertResponseStatusCodeSame(201);
        $id = $create['data']['id'];

        $this->requestAppointment('PUT', "/api/appointments/{$id}", $auth, [
            'patientId' => $patient->id,
            'userId' => $auth['userId'],
            'title' => 'Slot Move',
            'startsAt' => '2026-03-06T14:30:00+00:00',
            'endsAt' => '2026-03-06T15:30:00+00:00',
            'notes' => 'Move me',
            'type' => 'appointment',
            'allDay' => false,
        ]);
        $this->assertResponseIsSuccessful();

        $get = $this->requestAppointment('GET', "/api/appointments/{$id}", $auth);
        $this->assertResponseIsSuccessful();
        $this->assertJsonContains([
            'id' => $id,
        ]);
        $startsAt = new \DateTimeImmutable($get['data']['startsAt']);
        $endsAt = new \DateTimeImmutable($get['data']['endsAt']);
        $this->assertSame('2026-03-06T14:30', $startsAt->format('Y-m-d\\TH:i'));
        $this->assertSame('2026-03-06T15:30', $endsAt->format('Y-m-d\\TH:i'));
    }

    public function testDeleteCanceledKeepsAppointment(): void
    {
        $auth = $this->authenticate();
        $patient = PatientFactory::createOne();

        $create = $this->requestAppointment('POST', '/api/appointments', $auth, [
            'patientId' => $patient->id,
            'userId' => $auth['userId'],
            'title' => 'Cancel Delete',
            'startsAt' => '2026-04-01T09:00:00+00:00',
            'endsAt' => '2026-04-01T10:00:00+00:00',
            'notes' => 'Do not delete',
            'type' => 'appointment',
            'allDay' => false,
        ]);
        $this->assertResponseStatusCodeSame(201);
        $id = $create['data']['id'];

        $this->requestAppointment('GET', "/api/appointments/{$id}", $auth);
        $this->assertResponseIsSuccessful();

        $this->requestAppointment('GET', "/api/appointments/{$id}", $auth);
        $this->assertResponseIsSuccessful();
    }

    public function testDeleteConfirmedRemovesAppointment(): void
    {
        $auth = $this->authenticate();
        $patient = PatientFactory::createOne();

        $create = $this->requestAppointment('POST', '/api/appointments', $auth, [
            'patientId' => $patient->id,
            'userId' => $auth['userId'],
            'title' => 'Delete Confirmed',
            'startsAt' => '2026-04-02T10:00:00+00:00',
            'endsAt' => '2026-04-02T11:00:00+00:00',
            'notes' => 'Delete me',
            'type' => 'appointment',
            'allDay' => false,
        ]);
        $this->assertResponseStatusCodeSame(201);
        $id = $create['data']['id'];

        $this->requestAppointment('DELETE', "/api/appointments/{$id}", $auth);
        $this->assertResponseStatusCodeSame(204);

        $this->requestAppointment('GET', "/api/appointments/{$id}", $auth);
        $this->assertResponseStatusCodeSame(404);
    }
}
