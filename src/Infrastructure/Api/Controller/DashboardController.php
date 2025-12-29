<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\Controller;

use App\Application\Query\Dashboard\GetDashboardStats\GetDashboardStatsQuery;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Messenger\HandleTrait;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Routing\Attribute\Route;

final class DashboardController extends AbstractController
{
    use HandleTrait;

    public function __construct(MessageBusInterface $queryBus)
    {
        $this->messageBus = $queryBus;
    }

    #[Route('/api/dashboard/stats', name: 'api_dashboard_stats', methods: ['GET'], options: ['expose' => true])]
    public function getStats(): JsonResponse
    {
        $stats = $this->handle(GetDashboardStatsQuery::create());

        return $this->json($stats);
    }
}
