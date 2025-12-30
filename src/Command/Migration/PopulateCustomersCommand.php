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
use Symfony\Component\Console\Input\InputOption;
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
    description: 'Creates customers from existing patients and invoices data.',
)]
final class PopulateCustomersCommand extends Command
{
    private const BATCH_SIZE = 100;

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('reset', null, InputOption::VALUE_OPTIONAL, 'Reset customers table and links before populating', '0');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->title('Populating Customers from Existing Data');

        $reset = $input->getOption('reset') === '1';
        if ($reset) {
            $this->performReset($io);
        }

        $customerMap = $this->loadExistingCustomers();
        $io->note(sprintf('Loaded %d existing customers.', count($customerMap)));

        // 1. Process Invoices (Order by Number DESC to get most recent data first)
        $io->section('Processing Invoices...');
        $invoices = $this->entityManager->getRepository(Invoice::class)->findBy([], ['number' => 'DESC']);
        $progressBar = new ProgressBar($output, count($invoices));
        $progressBar->start();

        $createdCount = 0;
        $linkedCount = 0;
        $batchCount = 0;

        foreach ($invoices as $invoice) {
            $taxId = $this->normalizeTaxId($invoice->taxId);
            $fullName = trim($invoice->fullName);
            
            // Deduplication key: tax_id or full_name if tax_id is empty
            $key = $taxId ?: 'NAME_'.$fullName;

            if (!isset($customerMap[$key])) {
                $customer = $this->createCustomerFromInvoice($invoice, $taxId ?: '');
                $this->entityManager->persist($customer);
                $customerMap[$key] = $customer;
                $createdCount++;
            }

            $customer = $customerMap[$key];
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
        $io->text(sprintf('Created from Invoices: %d, Linked: %d', $createdCount, $linkedCount));

        // 2. Process Patients (LINKING ONLY, never create)
        $io->section('Processing Patients...');
        $patients = $this->entityManager->getRepository(Patient::class)->findAll();
        $progressBar = new ProgressBar($output, count($patients));
        $progressBar->start();

        $patientLinkedCount = 0;
        $batchCount = 0;

        foreach ($patients as $patient) {
            $taxId = $this->normalizeTaxId($patient->taxId);
            $fullName = trim($patient->fullName);
            
            $key = $taxId ?: 'NAME_'.$fullName;

            // Only link if the customer already exists (created from invoices)
            if (!isset($customerMap[$key])) {
                $progressBar->advance();
                continue;
            }

            $customer = $customerMap[$key];
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
        $io->text(sprintf('Linked Patients: %d', $patientLinkedCount));

        $io->success('Customers population completed successfully.');

        return Command::SUCCESS;
    }

    private function performReset(SymfonyStyle $io): void
    {
        $io->warning('Resetting customers table and links...');
        $connection = $this->entityManager->getConnection();
        
        $connection->executeStatement('SET FOREIGN_KEY_CHECKS = 0');
        $connection->executeStatement('TRUNCATE TABLE customers');
        $connection->executeStatement('UPDATE invoices SET customer_id = NULL');
        $connection->executeStatement('UPDATE patients SET customer_id = NULL');
        $connection->executeStatement('SET FOREIGN_KEY_CHECKS = 1');
        
        $io->success('Reset complete.');
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
                continue;
            }
            
            if ($customer->fullName) {
                $map['NAME_'.trim($customer->fullName)] = $customer;
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

        $customer = Customer::create($firstName, $lastName, $taxId);
        $customer->fullName = $invoice->fullName;
        $customer->email = $invoice->email;
        $customer->phone = $invoice->phone;
        $customer->billingAddress = $invoice->address ?? 'Unknown Address';

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
            return [$parts[0], $parts[0]];
        }

        $firstName = array_shift($parts);
        $lastName = implode(' ', $parts);

        return [$firstName, $lastName];
    }
}