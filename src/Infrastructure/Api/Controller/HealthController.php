<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\Controller;

use Doctrine\DBAL\Exception;
use Doctrine\ORM\EntityManagerInterface;

use function in_array;

use Redis;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\Routing\Attribute\Route;
use Throwable;

final class HealthController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        #[Autowire(service: 'snc_redis.default')]
        private ?Redis $redis = null,
        #[Autowire('%env(HEALTH_CHECK_TOKEN)%')]
        private string $healthCheckToken = '',
        #[Autowire(service: 'limiter.health_token')]
        private ?RateLimiterFactory $healthTokenLimiter = null,
    ) {
    }

    #[Route('/api/health', name: 'api_health', methods: ['GET'], options: ['expose' => true])]
    public function __invoke(Request $request): JsonResponse
    {
        $providedToken = $request->query->getString('token', '');

        // Only apply rate limiting when a token is provided (to prevent brute force)
        if ('' !== $providedToken && null !== $this->healthTokenLimiter) {
            $limiter = $this->healthTokenLimiter->create($request->getClientIp() ?? 'unknown');
            if (!$limiter->consume()->isAccepted()) {
                return new JsonResponse(
                    ['error' => 'Too many requests'],
                    Response::HTTP_TOO_MANY_REQUESTS
                );
            }
        }

        $isAuthorized = '' !== $this->healthCheckToken
            && hash_equals($this->healthCheckToken, $providedToken);

        // Without valid token, return only basic status
        if (!$isAuthorized) {
            return new JsonResponse(['status' => 'ok']);
        }

        // With valid token, return detailed checks
        $checks = [
            'database' => $this->checkDatabase(),
        ];

        if (null !== $this->redis) {
            $checks['redis'] = $this->checkRedis();
        }

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

            return ['ok' => true === $pong || '+PONG' === $pong || 'PONG' === $pong];
        } catch (Throwable) {
            return ['ok' => false];
        }
    }
}
