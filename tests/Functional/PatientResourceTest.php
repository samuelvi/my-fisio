<?php

declare(strict_types=1);

namespace App\Tests\Functional;

use ApiPlatform\Symfony\Bundle\Test\ApiTestCase;
use App\Tests\Factory\UserFactory;
use Zenstruck\Foundry\Test\Factories;
use Zenstruck\Foundry\Test\ResetDatabase;

class PatientResourceTest extends ApiTestCase
{
    use Factories;
    use ResetDatabase;

    private function authenticate(): string
    {
        $client = self::createClient();

        // Ensure we have a user
        UserFactory::createOne([
            'email' => 'admin@example.com',
            'password' => 'password',
            'roles' => ['ROLE_ADMIN'],
        ]);

        $response = $client->request('POST', '/api/login_check', [
            'headers' => ['Content-Type' => 'application/json'], // Login endpoint usually accepts standard JSON
            'json' => [
                'username' => 'admin@example.com',
                'password' => 'password',
            ],
        ]);

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();

        return $data['token'];
    }

    public function testCreatePatient(): void
    {
        $token = $this->authenticate();

        $client = self::createClient();
        $client->request('POST', '/api/patients', [
            'auth_bearer' => $token,
            'headers' => [
                'Content-Type' => 'application/ld+json',
                'Accept' => 'application/ld+json',
            ],
            'json' => [
                'firstName' => 'John',
                'lastName' => 'Doe',
                'phone' => '123456789',
                'email' => 'john.doe@example.com',
            ],
        ]);

        $this->assertResponseStatusCodeSame(201);
        $this->assertJsonContains([
            '@context' => '/api/contexts/Patient',
            '@type' => 'Patient',
            'firstName' => 'John',
            'lastName' => 'Doe',
            'phone' => '123456789',
            'email' => 'john.doe@example.com',
        ]);
    }

    public function testCreatePatientUnauthorized(): void
    {
        $client = self::createClient();
        $client->request('POST', '/api/patients', [
            'headers' => [
                'Content-Type' => 'application/ld+json',
                'Accept' => 'application/ld+json',
            ],
            'json' => [
                'firstName' => 'Jane',
                'lastName' => 'Doe',
            ],
        ]);

        $this->assertResponseStatusCodeSame(401);
    }

    public function testCannotCreateTwoPatientsWithSameEmail(): void
    {
        $token = $this->authenticate();
        $client = self::createClient();

        $patientData = [
            'firstName' => 'John',
            'lastName' => 'Doe',
            'email' => 'duplicate@example.com',
        ];

        // Create first patient
        $client->request('POST', '/api/patients', [
            'auth_bearer' => $token,
            'headers' => [
                'Content-Type' => 'application/ld+json',
                'Accept' => 'application/ld+json',
            ],
            'json' => $patientData,
        ]);
        $this->assertResponseStatusCodeSame(201);

        // Attempt to create second patient with same email
        $client->request('POST', '/api/patients', [
            'auth_bearer' => $token,
            'headers' => [
                'Content-Type' => 'application/ld+json',
                'Accept' => 'application/ld+json',
            ],
            'json' => [
                'firstName' => 'Jane',
                'lastName' => 'Smith',
                'email' => 'duplicate@example.com',
            ],
        ]);

        $this->assertResponseStatusCodeSame(422);
    }
}
