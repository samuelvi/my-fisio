<?php

namespace App\Tests\Functional;

use ApiPlatform\Symfony\Bundle\Test\ApiTestCase;
use Zenstruck\Foundry\Test\ResetDatabase;
use Zenstruck\Foundry\Test\Factories;
use App\Tests\Factory\UserFactory;
use App\Tests\Factory\PatientFactory;
use App\Tests\Factory\AppointmentFactory;

class AppointmentResourceTest extends ApiTestCase
{
    use ResetDatabase, Factories;

    private function authenticate(): string
    {
        $client = self::createClient();
        
        UserFactory::createOne([
            'email' => 'admin@example.com',
            'password' => 'password',
            'roles' => ['ROLE_ADMIN']
        ]);
        
        $response = $client->request('POST', '/api/login_check', [
            'json' => [
                'username' => 'admin@example.com',
                'password' => 'password',
            ],
        ]);

        return $response->toArray()['token'];
    }

    public function testCreateAppointment(): void
    {
        $token = $this->authenticate();
        $patient = PatientFactory::createOne();
        
        $client = self::createClient();
        $client->request('POST', '/api/appointments', [
            'auth_bearer' => $token,
            'headers' => [
                'Content-Type' => 'application/ld+json',
                'Accept' => 'application/ld+json'
            ],
            'json' => [
                'patientId' => $patient->id,
                'userId' => 1,
                'title' => 'Therapy Session',
                'startsAt' => '2025-12-25T10:00:00+00:00',
                'endsAt' => '2025-12-25T11:00:00+00:00',
                'notes' => 'First session'
            ]
        ]);

        $this->assertResponseStatusCodeSame(201);
        $this->assertJsonContains([
            '@type' => 'Appointment',
            'title' => 'Therapy Session',
            'patientName' => $patient->firstName . ' ' . $patient->lastName
        ]);
    }

    public function testGetAppointments(): void
    {
        $token = $this->authenticate();
        $patient = PatientFactory::createOne();
        AppointmentFactory::createMany(3, ['patient' => $patient]);

        $client = self::createClient();
        $client->request('GET', '/api/appointments', [
            'auth_bearer' => $token,
            'headers' => [
                'Accept' => 'application/ld+json'
            ],
        ]);

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains([
            'totalItems' => 3
        ]);
    }
}
