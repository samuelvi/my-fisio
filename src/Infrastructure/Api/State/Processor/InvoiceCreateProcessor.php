<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\State\Processor;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Domain\Entity\Counter;
use App\Domain\Entity\Invoice;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * @implements ProcessorInterface<Invoice, Invoice>
 */
final class InvoiceCreateProcessor implements ProcessorInterface
{
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private readonly ProcessorInterface $persistProcessor,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        if (!$data instanceof Invoice) {
            return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
        }

        // 1. Calculate logic for Number Generation
        $year = $data->date->format('Y');
        $counterKey = 'invoices_' . $year;

        // Use a lock mechanism if high concurrency is expected, but for now simple repo check
        $counterRepo = $this->entityManager->getRepository(Counter::class);
        /** @var Counter|null $counter */
        $counter = $counterRepo->findOneBy(['name' => $counterKey]);

        if (!$counter) {
            // Start of the year or first invoice ever for this year
            // Format: YYYY + 000001 (e.g. 2025000001)
            $nextValue = $year . '000001';
            $counter = new Counter($counterKey, $nextValue);
            $this->entityManager->persist($counter);
        } else {
            // Increment existing
            $currentValue = (int) $counter->value;
            $nextValue = (string) ($currentValue + 1);
            $counter->value = $nextValue;
            // No need to persist, it's managed, but flushing will happen in persistProcessor
        }

        $data->number = $nextValue;

        // 2. Recalculate totals to ensure data integrity
        $totalAmount = 0.0;
        foreach ($data->lines as $line) {
            $lineAmount = $line->quantity * $line->price;
            $line->amount = $lineAmount; // Force correct amount on line
            $line->invoice = $data; // Ensure relationship
            $totalAmount += $lineAmount;
        }
        $data->amount = $totalAmount;

        // 3. Delegate persistence to the default Doctrine processor (which handles the transaction flush)
        return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
    }
}
