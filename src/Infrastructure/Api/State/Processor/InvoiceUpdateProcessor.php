<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\State\Processor;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use ApiPlatform\Validator\Exception\ValidationException;
use App\Application\Service\InvoiceNumberValidator;
use App\Domain\Entity\InvoiceLine;
use App\Domain\Entity\Customer;
use App\Domain\Repository\InvoiceRepositoryInterface;
use App\Domain\Repository\CustomerRepositoryInterface;
use App\Infrastructure\Api\Resource\InvoiceInput;
use App\Infrastructure\Api\Resource\InvoiceLineInput;
use DateTimeImmutable;
use App\Domain\Entity\Invoice;
use App\Infrastructure\Api\Resource\InvoiceResource;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Validator\Validator\ValidatorInterface;

/**
 * @implements ProcessorInterface<InvoiceInput, InvoiceResource>
 */
final class InvoiceUpdateProcessor implements ProcessorInterface
{
    public function __construct(
        private InvoiceRepositoryInterface $invoiceRepository,
        private CustomerRepositoryInterface $customerRepository,
        private ValidatorInterface $validator,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        if (!$data instanceof InvoiceInput) {
            return $data;
        }

        if (!isset($uriVariables['id'])) {
            throw new BadRequestHttpException('Invoice id is required.');
        }

        $invoiceId = (int) $uriVariables['id'];
        $invoice = $this->invoiceRepository->get($invoiceId);

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

        $numberYear = $data->number ? (int) substr($data->number, 0, 4) : 0;
        $existingNumbers = $numberYear > 0
            ? $this->invoiceRepository->getNumbersByYearExcluding($numberYear, $invoice->id ?? 0)
            : [];
        $validationResult = InvoiceNumberValidator::validateWithReason($data->number ?? '', $existingNumbers);
        if (!$validationResult->isValid) {
            throw new BadRequestHttpException($validationResult->reason ?? 'invoice_number_invalid');
        }

        // Handle Customer (Link or Create)
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
            }
        }

        if (null !== $data->number) {
            $invoice->number = $data->number;
        }
        $invoice->fullName = $data->fullName;
        $invoice->phone = $data->phone;
        $invoice->address = $data->address;
        $invoice->email = $data->email;
        $invoice->taxId = $data->taxId;
        $invoice->currency = $data->currency ?? $invoice->currency ?? 'EUR';
        $invoice->customer = $customer;
        if ($data->date instanceof DateTimeImmutable) {
            $invoice->date = $data->date;
        }

        foreach ($invoice->lines as $line) {
            $this->invoiceRepository->removeLine($line);
        }
        $invoice->lines->clear();

        $totalAmount = 0.0;
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
            $totalAmount += $lineAmount;
        }

        $invoice->amount = $totalAmount;

        $this->invoiceRepository->save($invoice);

        return $this->mapToResource($invoice);
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
