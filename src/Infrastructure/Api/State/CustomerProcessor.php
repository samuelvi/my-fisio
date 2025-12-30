<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\State;

use ApiPlatform\Metadata\DeleteOperationInterface;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Domain\Entity\Customer;
use Doctrine\ORM\EntityManagerInterface;

final class CustomerProcessor implements ProcessorInterface
{
    public function __construct(
        private EntityManagerInterface $entityManager,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        if ($operation instanceof DeleteOperationInterface) {
            $customer = $this->entityManager->getRepository(Customer::class)->find($uriVariables['id']);
            if ($customer) {
                $this->entityManager->remove($customer);
                $this->entityManager->flush();
            }

            return null;
        }

        if (!$data instanceof Customer) {
            return $data;
        }

        // Logic for both Create and Update
        $data->updateFullName();
        
        // For updates, set the timestamp
        if (isset($uriVariables['id'])) {
            $data->updateTimestamp();
        }

        $this->entityManager->persist($data);
        $this->entityManager->flush();

        return $data;
    }
}
