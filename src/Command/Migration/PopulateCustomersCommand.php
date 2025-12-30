<?php

declare(strict_types=1);

namespace App\Command\Migration;

use App\Domain\Entity\Customer;
use App\Domain\Entity\Invoice;
use App\Domain\Entity\Patient;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Helper\ProgressBar;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

use function count;
use function explode;
use function implode;
use function array_shift;
use function trim;
use function strtoupper;
use function sprintf;

#[AsCommand(
    name: 'app:migration:populate-customers',
    description: 'Creates customers from existing patients and invoices data based on Tax ID.',
)]
final class PopulateCustomersCommand extends Command
{
    private const BATCH_SIZE = 100;

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->title('Populating Customers from Existing Data');

        $customerMap = $this->loadExistingCustomers();
        $io->note(sprintf('Loaded %d existing customers.', count($customerMap)));

        // 1. Process Invoices
        $io->section('Processing Invoices...');
        $invoices = $this->entityManager->getRepository(Invoice::class)->findAll();
        $progressBar = new ProgressBar($output, count($invoices));
        $progressBar->start();

        $createdCount = 0;
        $linkedCount = 0;
        $skippedCount = 0;
        $batchCount = 0;

        foreach ($invoices as $invoice) {
            $taxId = $this->normalizeTaxId($invoice->taxId);
            if (!$taxId) {
                $skippedCount++;
                $progressBar->advance();
                continue;
            }

            if (!isset($customerMap[$taxId])) {
                $customer = $this->createCustomerFromInvoice($invoice, $taxId);
                echo sprintf("Creating customer from invoice: %s, address: %s\n", $customer->fullName, $customer->billingAddress);
                $this->entityManager->persist($customer);
                $customerMap[$taxId] = $customer;
                $createdCount++;
            }

            $customer = $customerMap[$taxId];
            if ($invoice->customer !== $customer) {
                $invoice->customer = $customer;
                $linkedCount++;
            }

            $batchCount++;
            if ($batchCount % self::BATCH_SIZE === 0) {
                $this->entityManager->flush();
            }
            $progressBar->advance();
        }

        $this->entityManager->flush();
        $progressBar->finish();
        $io->newLine(2);
        $io->text(sprintf('Created: %d, Linked: %d, Skipped (no Tax ID): %d', $createdCount, $linkedCount, $skippedCount));

        // 2. Process Patients
        $io->section('Processing Patients...');
        $patients = $this->entityManager->getRepository(Patient::class)->findAll();
        $progressBar = new ProgressBar($output, count($patients));
        $progressBar->start();

        $patientLinkedCount = 0;
        $patientCreatedCount = 0;
        $patientSkippedCount = 0;
        $batchCount = 0;

        foreach ($patients as $patient) {
            $taxId = $this->normalizeTaxId($patient->taxId);
            if (!$taxId) {
                $patientSkippedCount++;
                $progressBar->advance();
                continue;
            }

            if (!isset($customerMap[$taxId])) {
                $customer = $this->createCustomerFromPatient($patient, $taxId);
                $this->entityManager->persist($customer);
                $customerMap[$taxId] = $customer;
                $patientCreatedCount++;
            }

            $customer = $customerMap[$taxId];
            if ($patient->customer !== $customer) {
                $patient->customer = $customer;
                $patientLinkedCount++;
            }

            $batchCount++;
            if ($batchCount % self::BATCH_SIZE === 0) {
                $this->entityManager->flush();
            }
            $progressBar->advance();
        }

        $this->entityManager->flush();
        $progressBar->finish();
        $io->newLine(2);
        $io->text(sprintf('Created: %d, Linked: %d, Skipped (no Tax ID): %d', $patientCreatedCount, $patientLinkedCount, $patientSkippedCount));

        $io->success('Customers population completed successfully.');

        return Command::SUCCESS;
    }

    /**
     * @return array<string, Customer>
     */
    private function loadExistingCustomers(): array
    {
        $customers = $this->entityManager->getRepository(Customer::class)->findAll();
        $map = [];
        foreach ($customers as $customer) {
            $taxId = $this->normalizeTaxId($customer->taxId);
            if ($taxId) {
                $map[$taxId] = $customer;
            }
        }

        return $map;
    }

    private function normalizeTaxId(?string $taxId): ?string
    {
        if (!$taxId) {
            return null;
        }

        $normalized = trim(strtoupper($taxId));

        return '' === $normalized ? null : $normalized;
    }

    private function createCustomerFromInvoice(Invoice $invoice, string $taxId): Customer
    {
        [$firstName, $lastName] = $this->splitFullName($invoice->fullName);

        $customer = Customer::create(
            $firstName,
            $lastName,
            $taxId
        );

        $customer->fullName = $invoice->fullName;
        $customer->email = $invoice->email;
        $customer->phone = $invoice->phone;
        $customer->billingAddress = $invoice->address ?? 'Unknown Address';

        return $customer;
    }

    private function createCustomerFromPatient(Patient $patient, string $taxId): Customer
    {
        $customer = Customer::create(
            $patient->firstName,
            $patient->lastName,
            $taxId
        );

        $customer->fullName = $patient->fullName;
        $customer->email = $patient->email;
        $customer->phone = $patient->phone;
        $customer->billingAddress = $patient->address ?? 'Unknown Address';

        return $customer;
    }

    private function splitFullName(string $fullName): array
    {
        $fullName = trim($fullName);
        if ($fullName === '') {
            return ['Unknown', 'Unknown'];
        }

        $parts = explode(' ', $fullName);
        $count = count($parts);
        
        if ($count === 1) {
            return [$parts[0], $parts[0]]; // Repeat if only one name
        }

        // Logic for first name and last name
        $firstName = array_shift($parts);
        $lastName = implode(' ', $parts);

        return [$firstName, $lastName];
    }
}
