<?php

declare(strict_types=1);

namespace App\Controller;

use Doctrine\DBAL\Exception;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

final class HealthController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        #[Autowire(service: 'snc_redis.default')]
        private \Redis $redis
    ) {}

    #[Route('/api/health', name: 'api_health', methods: ['GET'])]
    public function __invoke(): JsonResponse
    {
        $checks = [
            'database' => $this->checkDatabase(),
            'redis' => $this->checkRedis(),
        ];

        $isHealthy = !in_array(false, array_column($checks, 'ok'), true);

        return new JsonResponse([
            'status' => $isHealthy ? 'ok' : 'degraded',
            'checks' => $checks,
        ]);
    }

    private function checkDatabase(): array
    {
        try {
            $this->entityManager->getConnection()->executeQuery('SELECT 1');
            return ['ok' => true];
        } catch (Exception) {
            return ['ok' => false];
        }
    }

    private function checkRedis(): array
    {
        try {
            $pong = $this->redis->ping();
            return ['ok' => $pong === true || $pong === '+PONG' || $pong === 'PONG'];
        } catch (\Throwable) {
            return ['ok' => false];
        }
    }
}
