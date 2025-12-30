<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use ApiPlatform\Validator\Exception\ValidationException;
use App\Domain\Entity\Patient;
use App\Domain\Entity\Customer;
use App\Domain\Repository\CustomerRepositoryInterface;
use App\Infrastructure\Api\Resource\PatientResource;

use function count;

use DateTimeImmutable;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class PatientProcessor implements ProcessorInterface
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private CustomerRepositoryInterface $customerRepository,
        private ValidatorInterface $validator,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        if (!$data instanceof PatientResource) {
            return $data;
        }

        $violations = $this->validator->validate($data);
        if (count($violations) > 0) {
            throw new ValidationException($violations);
        }

        if (isset($uriVariables['id'])) {
            $patient = $this->entityManager->getRepository(Patient::class)->find($uriVariables['id']);
        } else {
            $patient = Patient::create(
                firstName: $data->firstName,
                lastName: $data->lastName,
                dateOfBirth: $data->dateOfBirth,
                taxId: $data->taxId,
                phone: $data->phone,
                address: $data->address,
                email: $data->email,
                profession: $data->profession,
                sportsActivity: $data->sportsActivity,
                notes: $data->notes,
                rate: $data->rate,
                allergies: $data->allergies,
                medication: $data->medication,
                systemicDiseases: $data->systemicDiseases,
                surgeries: $data->surgeries,
                accidents: $data->accidents,
                injuries: $data->injuries,
                bruxism: $data->bruxism,
                insoles: $data->insoles,
                others: $data->others,
                status: $data->status
            );
        }

        if (!$patient) {
            return null;
        }

        // Handle Customer (Link or Create)
        $customer = null;
        if (!empty($data->taxId)) {
            $customer = $this->customerRepository->findOneByTaxId($data->taxId);
            
            if (!$customer) {
                $customer = Customer::create(
                    firstName: $data->firstName,
                    lastName: $data->lastName,
                    taxId: $data->taxId,
                    email: $data->email,
                    phone: $data->phone,
                    billingAddress: $data->address ?? ''
                );
                $this->customerRepository->save($customer);
            }
        }

        // Parse customer ID from IRI (Explicit override if provided)
        if (null !== $data->customer && preg_match('#/api/customers/(\d+)#', $data->customer, $matches)) {
            $customerId = (int) $matches[1];
            $customer = $this->entityManager->getRepository(Customer::class)->find($customerId);
        }
        
        $patient->customer = $customer;

        // Update fields (for both new and existing)
        $patient->firstName = $data->firstName;
        $patient->lastName = $data->lastName;
        $patient->dateOfBirth = $data->dateOfBirth;
        $patient->taxId = $data->taxId;
        $patient->phone = $data->phone;
        $patient->address = $data->address;
        $patient->email = $data->email;
        $patient->profession = $data->profession;
        $patient->sportsActivity = $data->sportsActivity;
        $patient->notes = $data->notes;
        $patient->rate = $data->rate;
        $patient->allergies = $data->allergies;
        $patient->medication = $data->medication;
        $patient->systemicDiseases = $data->systemicDiseases;
        $patient->surgeries = $data->surgeries;
        $patient->accidents = $data->accidents;
        $patient->injuries = $data->injuries;
        $patient->bruxism = $data->bruxism;
        $patient->insoles = $data->insoles;
        $patient->others = $data->others;
        $patient->status = $data->status;

        $patient->updateFullName();

        $this->entityManager->persist($patient);
        $this->entityManager->flush();

        $data->id = $patient->id;
        if ($patient->createdAt instanceof DateTimeImmutable) {
            $data->createdAt = $patient->createdAt;
        }

        return $data;
    }
}
