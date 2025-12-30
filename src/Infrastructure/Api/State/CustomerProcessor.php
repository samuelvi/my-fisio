<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\State;

use ApiPlatform\Metadata\DeleteOperationInterface;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use ApiPlatform\Validator\Exception\ValidationException;
use App\Domain\Entity\Customer;
use App\Infrastructure\Api\Resource\CustomerResource;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final class CustomerProcessor implements ProcessorInterface
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private ValidatorInterface $validator,
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

        if (!$data instanceof CustomerResource) {
            return $data;
        }

        $violations = $this->validator->validate($data);
        if (count($violations) > 0) {
            throw new ValidationException($violations);
        }

        if (isset($uriVariables['id'])) {
            $customer = $this->entityManager->getRepository(Customer::class)->find($uriVariables['id']);
        } else {
            $customer = Customer::create(
                firstName: $data->firstName,
                lastName: $data->lastName,
                taxId: $data->taxId,
                email: $data->email,
                phone: $data->phone,
                billingAddress: $data->billingAddress
            );
        }

        if (!$customer) {
            return null;
        }

        // Map DTO to Entity (for both new and existing)
        $customer->firstName = $data->firstName;
        $customer->lastName = $data->lastName;
        $customer->taxId = $data->taxId;
        $customer->email = $data->email;
        $customer->phone = $data->phone;
        $customer->billingAddress = $data->billingAddress;

        $customer->updateFullName();
        
        if (isset($uriVariables['id'])) {
            $customer->updateTimestamp();
        }

        $this->entityManager->persist($customer);
        $this->entityManager->flush();

        // Map back to DTO
        $data->id = $customer->id;
        $data->fullName = $customer->fullName;
        $data->createdAt = $customer->createdAt instanceof \DateTimeImmutable ? $customer->createdAt : null;
        $data->updatedAt = $customer->updatedAt instanceof \DateTimeImmutable ? $customer->updatedAt : null;

        return $data;
    }
}