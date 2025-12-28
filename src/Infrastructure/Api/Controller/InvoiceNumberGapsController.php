<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\Controller;

use App\Application\Query\Invoice\GetInvoiceNumberGaps\GetInvoiceNumberGapsQuery;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Messenger\HandleTrait;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Routing\Attribute\Route;

final class InvoiceNumberGapsController extends AbstractController
{
    use HandleTrait;

    public function __construct(
        private MessageBusInterface $queryBus,
    ) {
        $this->messageBus = $this->queryBus;
    }

    #[Route('/api/invoice-gaps', name: 'invoice_number_gaps', methods: ['GET'])]
    public function __invoke(Request $request): JsonResponse
    {
        $year = (int) $request->query->get('year', date('Y'));
        if ($year <= 0) {
            $year = (int) date('Y');
        }

        $result = $this->handle(GetInvoiceNumberGapsQuery::create($year));

        return $this->json([
            'year' => $result->year,
            'totalInvoices' => $result->totalInvoices,
            'totalGaps' => $result->totalGaps,
            'gaps' => $result->gaps,
        ]);
    }
}
