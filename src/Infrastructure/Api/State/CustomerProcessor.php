<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\State;

use ApiPlatform\Metadata\DeleteOperationInterface;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use ApiPlatform\Validator\Exception\ValidationException;
use App\Application\Command\Customer\CreateCustomerCommand;
use App\Application\Command\Customer\UpdateCustomerCommand;
use App\Domain\Repository\CustomerRepositoryInterface;
use App\Infrastructure\Api\Resource\CustomerResource;
use Symfony\Component\Messenger\HandleTrait;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final class CustomerProcessor implements ProcessorInterface
{
    use HandleTrait;

    public function __construct(
        MessageBusInterface $commandBus,
        private CustomerRepositoryInterface $customerRepo,
        private ValidatorInterface $validator,
    ) {
        $this->messageBus = $commandBus;
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        if ($operation instanceof DeleteOperationInterface) {
            $customer = $this->customerRepo->get((int) $uriVariables['id']);
            $this->customerRepo->delete($customer);

            return null;
        }

        if (!$data instanceof CustomerResource) {
            return $data;
        }

        // Set ID before validation so UniqueCustomerTaxId validator can exclude current entity
        if (isset($uriVariables['id'])) {
            $data->id = (int) $uriVariables['id'];
        }

        $violations = $this->validator->validate($data);
        if (count($violations) > 0) {
            throw new ValidationException($violations);
        }

        if (isset($uriVariables['id'])) {
            $command = new UpdateCustomerCommand(
                id: (int) $uriVariables['id'],
                firstName: $data->firstName,
                lastName: $data->lastName,
                taxId: $data->taxId,
                email: $data->email,
                phone: $data->phone,
                billingAddress: $data->billingAddress
            );

            $this->handle($command);
            $data->id = (int) $uriVariables['id'];
        } else {
            $command = new CreateCustomerCommand(
                firstName: $data->firstName,
                lastName: $data->lastName,
                taxId: $data->taxId,
                email: $data->email,
                phone: $data->phone,
                billingAddress: $data->billingAddress
            );

            $id = $this->handle($command);
            $data->id = $id;
        }

        $data->fullName = trim($data->firstName . ' ' . $data->lastName);

        return $data;
    }
}