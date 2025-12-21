<?php

namespace App\Tests\Functional;

use ApiPlatform\Symfony\Bundle\Test\ApiTestCase;
use Zenstruck\Foundry\Test\ResetDatabase;
use Zenstruck\Foundry\Test\Factories;
use App\Tests\Factory\UserFactory;

class PatientResourceTest extends ApiTestCase
{
    use ResetDatabase, Factories;

    private function authenticate(): string
    {
        $client = self::createClient();
        
        // Ensure we have a user
        UserFactory::createOne([
            'email' => 'admin@example.com',
            'password' => 'password',
            'roles' => ['ROLE_ADMIN']
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
                'Accept' => 'application/ld+json'
            ],
            'json' => [
                'firstName' => 'John',
                'lastName' => 'Doe',
                'phone' => '123456789',
                'email' => 'john.doe@example.com'
            ]
        ]);

        $this->assertResponseStatusCodeSame(201);
        $this->assertJsonContains([
            '@context' => '/api/contexts/Patient',
            '@type' => 'Patient',
            'firstName' => 'John',
            'lastName' => 'Doe',
            'phone' => '123456789',
            'email' => 'john.doe@example.com'
        ]);
    }

    public function testCreatePatientUnauthorized(): void
    {
        $client = self::createClient();
        $client->request('POST', '/api/patients', [
            'headers' => [
                'Content-Type' => 'application/ld+json',
                'Accept' => 'application/ld+json'
            ],
            'json' => [
                'firstName' => 'Jane',
                'lastName' => 'Doe'
            ]
        ]);

        $this->assertResponseStatusCodeSame(401);
    }
}
