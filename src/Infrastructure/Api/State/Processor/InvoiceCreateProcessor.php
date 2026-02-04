<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\State\Processor;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use ApiPlatform\Validator\Exception\ValidationException;
use App\Domain\Entity\Invoice;
use App\Domain\Entity\InvoiceLine;
use App\Domain\Entity\Customer;
use App\Domain\Repository\CounterRepositoryInterface;
use App\Domain\Repository\CustomerRepositoryInterface;
use App\Infrastructure\Api\Resource\InvoiceInput;
use App\Infrastructure\Api\Resource\InvoiceLineInput;
use DateTimeImmutable;

use function count;
use function is_array;

use App\Infrastructure\Api\Resource\InvoiceResource;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\DependencyInjection\Attribute\Target;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

/**
 * @implements ProcessorInterface<InvoiceInput, InvoiceResource>
 */
final class InvoiceCreateProcessor implements ProcessorInterface
{
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private readonly ProcessorInterface $persistProcessor,
        private readonly CounterRepositoryInterface $counterRepository,
        private readonly CustomerRepositoryInterface $customerRepository,
        private readonly ValidatorInterface $validator,
        #[Target('event.bus')]
        private readonly MessageBusInterface $eventBus,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        if (!$data instanceof InvoiceInput) {
            return $data;
        }

        if (!$data->fullName) {
            throw new BadRequestHttpException('Customer name is required.');
        }

        $normalizedLines = [];
        foreach ($data->lines as $lineData) {
            $line = $lineData instanceof InvoiceLineInput ? $lineData : null;
            if (!$line && is_array($lineData)) {
                $line = new InvoiceLineInput();
                $line->concept = $lineData['concept'] ?? null;
                $line->description = $lineData['description'] ?? null;
                $line->quantity = (int) ($lineData['quantity'] ?? 1);
                $line->price = (float) ($lineData['price'] ?? 0.0);
            }
            if ($line) {
                $normalizedLines[] = $line;
            }
        }
        $data->lines = $normalizedLines;

        $violations = $this->validator->validate($data);
        if (count($violations) > 0) {
            throw new ValidationException($violations);
        }

        // 1. Calculate Total Amount First (from DTO)
        $totalAmount = 0.0;
        foreach ($data->lines as $line) {
            $totalAmount += ($line->quantity * $line->price);
        }

        // 2. Atomic Number Generation
        $date = $data->date instanceof DateTimeImmutable ? $data->date : new DateTimeImmutable();
        $year = $date->format('Y');
        $counterKey = 'invoices_'.$year;
        $initialValue = $year.'000001';

        // Use the atomic DB update to prevent race conditions
        $number = $this->counterRepository->incrementAndGetNext($counterKey, $initialValue);

        // 3. Handle Customer (Link or Create)
        $customer = null;
        if (!empty($data->taxId)) {
            $customer = $this->customerRepository->findOneByTaxId($data->taxId);
            
            if (!$customer) {
                $customer = Customer::createFromFullName(
                    fullName: $data->fullName,
                    taxId: $data->taxId,
                    email: $data->email,
                    phone: $data->phone,
                    billingAddress: $data->address ?? ''
                );
                $this->customerRepository->save($customer);
                
                $customer->recordCreatedEvent();
                foreach ($customer->pullDomainEvents() as $event) {
                    $this->eventBus->dispatch($event);
                }
            }
        }

        // 4. Create Invoice with required fields
        $currency = $data->currency ?? $_ENV['DEFAULT_CURRENCY'] ?? 'EUR';
        $invoice = Invoice::create(
            number: $number,
            amount: $totalAmount,
            fullName: $data->fullName,
            date: $date,
            currency: $currency,
            phone: $data->phone,
            address: $data->address,
            email: $data->email,
            taxId: $data->taxId,
            customer: $customer
        );

        // 5. Create and Attach Lines
        foreach ($data->lines as $line) {
            $lineAmount = $line->quantity * $line->price;
            $invoiceLine = InvoiceLine::create(
                invoice: $invoice,
                quantity: $line->quantity,
                price: $line->price,
                amount: $lineAmount
            );
            $invoiceLine->concept = $line->concept;
            $invoiceLine->description = $line->description;
            $invoice->lines->add($invoiceLine);
        }

        /** @var Invoice $persistedInvoice */
        $persistedInvoice = $this->persistProcessor->process($invoice, $operation, $uriVariables, $context);

        $persistedInvoice->recordCreatedEvent();
        foreach ($persistedInvoice->pullDomainEvents() as $event) {
            $this->eventBus->dispatch($event);
        }

        return $this->mapToResource($persistedInvoice);
    }

    private function mapToResource(Invoice $invoice): InvoiceResource
    {
        $resource = new InvoiceResource();
        $resource->id = $invoice->id;
        $resource->number = $invoice->number;
        $resource->fullName = $invoice->fullName;
        $resource->taxId = $invoice->taxId;
        $resource->amount = $invoice->amount;
        $resource->currency = $invoice->currency;
        $resource->phone = $invoice->phone;
        $resource->address = $invoice->address;
        $resource->email = $invoice->email;
        $resource->date = $invoice->date instanceof DateTimeImmutable ? $invoice->date : DateTimeImmutable::createFromInterface($invoice->date);
        $resource->createdAt = $invoice->createdAt instanceof DateTimeImmutable ? $invoice->createdAt : DateTimeImmutable::createFromInterface($invoice->createdAt);

        if ($invoice->customer) {
            $resource->customer = '/api/customers/' . $invoice->customer->id;
        }

        foreach ($invoice->lines as $line) {
            $resource->lines[] = [
                'id' => $line->id,
                'concept' => $line->concept,
                'description' => $line->description,
                'quantity' => $line->quantity,
                'price' => $line->price,
                'amount' => $line->amount,
            ];
        }

        return $resource;
    }
}