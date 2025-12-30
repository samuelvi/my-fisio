<?php

declare(strict_types=1);

namespace App\Tests\Functional;

use ApiPlatform\Symfony\Bundle\Test\ApiTestCase;
use App\Tests\Factory\CustomerFactory;
use App\Tests\Factory\UserFactory;
use Zenstruck\Foundry\Test\Factories;
use Zenstruck\Foundry\Test\ResetDatabase;

class CustomerResourceTest extends ApiTestCase
{
    use Factories;
    use ResetDatabase;

    private function authenticate(): string
    {
        $client = self::createClient();

        UserFactory::createOne([
            'email' => 'admin@example.com',
            'password' => 'password',
            'roles' => ['ROLE_ADMIN'],
        ]);

        $response = $client->request('POST', '/api/login_check', [
            'headers' => ['Content-Type' => 'application/json'],
            'json' => [
                'username' => 'admin@example.com',
                'password' => 'password',
            ],
        ]);

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();

        return $data['token'];
    }

    public function testSearchByTaxId(): void
    {
        $token = $this->authenticate();
        $client = self::createClient();

        // Create a specific customer
        CustomerFactory::createOne([
            'firstName' => 'Target',
            'lastName' => 'Customer',
            'taxId' => '52795346L',
        ]);

        // Create other customers to ensure we don't just get lucky with one result
        CustomerFactory::createMany(3);

        // Search for the specific taxId
        $response = $client->request('GET', '/api/customers', [
            'auth_bearer' => $token,
            'headers' => [
                'Accept' => 'application/ld+json',
            ],
            'query' => [
                'taxId' => '52795346L',
            ],
        ]);

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();

        $totalItems = $data['hydra:totalItems'] ?? $data['totalItems'] ?? null;
        $member = $data['hydra:member'] ?? $data['member'] ?? [];

        // Should find exactly 1 result
        $this->assertSame(1, $totalItems);
        $this->assertSame('52795346L', $member[0]['taxId']);
    }

    public function testSearchByPartialTaxId(): void
    {
        $token = $this->authenticate();
        $client = self::createClient();

        CustomerFactory::createOne([
            'firstName' => 'Partial',
            'lastName' => 'Match',
            'taxId' => 'ABC12345',
        ]);

        CustomerFactory::createMany(3);

        // Search for "c123" (should match ABC12345 case-insensitive)
        $response = $client->request('GET', '/api/customers', [
            'auth_bearer' => $token,
            'headers' => [
                'Accept' => 'application/ld+json',
            ],
            'query' => [
                'taxId' => 'c123',
            ],
        ]);

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();
        
        $totalItems = $data['hydra:totalItems'] ?? $data['totalItems'] ?? null;
        $member = $data['hydra:member'] ?? $data['member'] ?? [];

        $this->assertSame(1, $totalItems);
        $this->assertSame('ABC12345', $member[0]['taxId']);
    }

    public function testSearchByFullName(): void
    {
        $token = $this->authenticate();
        $client = self::createClient();

        CustomerFactory::createOne([
            'firstName' => 'Unique',
            'lastName' => 'Name',
        ]);

        CustomerFactory::createMany(3);

        $response = $client->request('GET', '/api/customers', [
            'auth_bearer' => $token,
            'headers' => [
                'Accept' => 'application/ld+json',
            ],
            'query' => [
                'fullName' => 'Unique',
            ],
        ]);

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();

        $totalItems = $data['hydra:totalItems'] ?? $data['totalItems'] ?? null;
        $member = $data['hydra:member'] ?? $data['member'] ?? [];

        $this->assertSame(1, $totalItems);
        $this->assertSame('Unique Name', $member[0]['fullName']);
    }

    public function testOrdering(): void
    {
        $token = $this->authenticate();
        $client = self::createClient();

        CustomerFactory::createOne(['lastName' => 'AAAA']);
        CustomerFactory::createOne(['lastName' => 'ZZZZ']);

        $response = $client->request('GET', '/api/customers', [
            'auth_bearer' => $token,
            'headers' => ['Accept' => 'application/ld+json'],
            'query' => ['order[lastName]' => 'desc'],
        ]);

        $data = $response->toArray();
        $member = $data['hydra:member'] ?? $data['member'] ?? [];
        
        $this->assertGreaterThanOrEqual(2, count($member));
        $this->assertSame('ZZZZ', $member[0]['lastName']);
    }
}
