<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\State\Processor;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Domain\Entity\Invoice;
use App\Domain\Entity\InvoiceLine;
use App\Domain\Repository\CounterRepositoryInterface;
use App\Infrastructure\Api\Resource\InvoiceInput;
use App\Infrastructure\Api\Resource\InvoiceLineInput;
use DateTimeImmutable;

use function is_array;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

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
        if (!$data instanceof InvoiceInput) {
            return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
        }

        if (!$data->name) {
            throw new BadRequestHttpException('Customer name is required.');
        }

        $invoice = Invoice::create($data->name);
        $invoice->phone = $data->phone;
        $invoice->address = $data->address;
        $invoice->email = $data->email;
        $invoice->taxId = $data->taxId;
        if ($data->date instanceof DateTimeImmutable) {
            $invoice->date = $data->date;
        }

        // 1. Atomic Number Generation
        $year = $invoice->date->format('Y');
        $counterKey = 'invoices_'.$year;
        $initialValue = $year.'000001';

        // Use the atomic DB update to prevent race conditions
        $invoice->number = $this->counterRepository->incrementAndGetNext($counterKey, $initialValue);

        // 2. Recalculate totals
        $totalAmount = 0.0;
        foreach ($data->lines as $lineData) {
            $line = $lineData instanceof InvoiceLineInput ? $lineData : null;
            if (!$line && is_array($lineData)) {
                $line = new InvoiceLineInput();
                $line->concept = $lineData['concept'] ?? null;
                $line->description = $lineData['description'] ?? null;
                $line->quantity = (int) ($lineData['quantity'] ?? 1);
                $line->price = (float) ($lineData['price'] ?? 0.0);
            }
            if (!$line) {
                continue;
            }

            $lineAmount = $line->quantity * $line->price;
            $invoiceLine = InvoiceLine::create($line->quantity, $line->price, $lineAmount);
            $invoiceLine->concept = $line->concept;
            $invoiceLine->description = $line->description;
            $invoiceLine->invoice = $invoice;
            $invoice->lines->add($invoiceLine);
            $totalAmount += $lineAmount;
        }
        $invoice->amount = $totalAmount;

        return $this->persistProcessor->process($invoice, $operation, $uriVariables, $context);
    }
}
