<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\State\Processor;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Application\Service\InvoiceNumberValidator;
use App\Domain\Entity\Invoice;
use App\Domain\Entity\InvoiceLine;
use App\Domain\Repository\InvoiceRepositoryInterface;
use App\Infrastructure\Api\Resource\InvoiceInput;
use App\Infrastructure\Api\Resource\InvoiceLineInput;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class InvoiceUpdateProcessor implements ProcessorInterface
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private InvoiceRepositoryInterface $invoiceRepository
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
        $invoice = $this->entityManager->getRepository(Invoice::class)
            ->createQueryBuilder('i')
            ->select('i', 'l')
            ->leftJoin('i.lines', 'l')
            ->where('i.id = :id')
            ->setParameter('id', $invoiceId)
            ->getQuery()
            ->getOneOrNullResult();

        if (!$invoice instanceof Invoice) {
            throw new NotFoundHttpException('Invoice not found.');
        }

        if (!$data->name) {
            throw new BadRequestHttpException('Customer name is required.');
        }

        $numberYear = $data->number ? (int) substr($data->number, 0, 4) : 0;
        $existingNumbers = $numberYear > 0
            ? $this->invoiceRepository->getNumbersByYearExcluding($numberYear, $invoice->id ?? 0)
            : [];
        $validationResult = InvoiceNumberValidator::validateWithReason($data->number ?? '', $existingNumbers);
        if (!$validationResult->isValid) {
            throw new BadRequestHttpException($validationResult->reason ?? 'invoice_number_invalid');
        }

        $invoice->number = $data->number;
        $invoice->name = $data->name;
        $invoice->phone = $data->phone;
        $invoice->address = $data->address;
        $invoice->email = $data->email;
        $invoice->taxId = $data->taxId;
        if ($data->date instanceof \DateTimeImmutable) {
            $invoice->date = $data->date;
        }

        foreach ($invoice->lines as $line) {
            $this->entityManager->remove($line);
        }
        $invoice->lines->clear();

        $totalAmount = 0.0;
        foreach ($data->lines as $lineData) {
            $line = $lineData instanceof InvoiceLineInput ? $lineData : null;
            if (!$line && is_array($lineData)) {
                $line = new InvoiceLineInput();
                $line->concept = $lineData['concept'] ?? null;
                $line->description = $lineData['description'] ?? null;
                $line->quantity = (int)($lineData['quantity'] ?? 1);
                $line->price = (float)($lineData['price'] ?? 0.0);
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

        $this->entityManager->persist($invoice);
        $this->entityManager->flush();

        return $invoice;
    }
}
