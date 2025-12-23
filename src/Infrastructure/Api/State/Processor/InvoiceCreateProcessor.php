<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\State\Processor;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Domain\Entity\Invoice;
use App\Domain\Repository\CounterRepositoryInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * @implements ProcessorInterface<Invoice, Invoice>
 */
final class InvoiceCreateProcessor implements ProcessorInterface
{
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private readonly ProcessorInterface $persistProcessor,
        private readonly CounterRepositoryInterface $counterRepository,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        if (!$data instanceof Invoice) {
            return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
        }

        // 1. Atomic Number Generation
        $year = $data->date->format('Y');
        $counterKey = 'invoices_' . $year;
        $initialValue = $year . '000001';

        // Use the atomic DB update to prevent race conditions
        $data->number = $this->counterRepository->incrementAndGetNext($counterKey, $initialValue);

        // 2. Recalculate totals
        $totalAmount = 0.0;
        foreach ($data->lines as $line) {
            $lineAmount = $line->quantity * $line->price;
            $line->amount = $lineAmount; 
            $line->invoice = $data; 
            $totalAmount += $lineAmount;
        }
        $data->amount = $totalAmount;

        return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
    }
}
