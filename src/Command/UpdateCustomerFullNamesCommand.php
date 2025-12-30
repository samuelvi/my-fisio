<?php

declare(strict_types=1);

namespace App\Command;

use App\Domain\Entity\Customer;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Helper\ProgressBar;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:update-customer-fullnames',
    description: 'Updates fullName for all customers based on firstName and lastName.',
)]
final class UpdateCustomerFullNamesCommand extends Command
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
        $io->title('Updating Customer Full Names');

        $repository = $this->entityManager->getRepository(Customer::class);
        $totalCustomers = $repository->count([]);
        
        $io->info(sprintf('Found %d customers.', $totalCustomers));

        if ($totalCustomers === 0) {
            $io->success('No customers to update.');
            return Command::SUCCESS;
        }

        $query = $repository->createQueryBuilder('c')->getQuery();
        $iterableResult = $query->toIterable();

        $progressBar = new ProgressBar($output, $totalCustomers);
        $progressBar->start();

        $count = 0;
        foreach ($iterableResult as $customer) {
            /** @var Customer $customer */
            $customer->updateFullName();
            
            $count++;
            if (($count % self::BATCH_SIZE) === 0) {
                $this->entityManager->flush();
                $this->entityManager->clear();
            }
            $progressBar->advance();
        }

        $this->entityManager->flush();
        $progressBar->finish();

        $io->newLine(2);
        $io->success('All customer full names have been updated.');

        return Command::SUCCESS;
    }
}
