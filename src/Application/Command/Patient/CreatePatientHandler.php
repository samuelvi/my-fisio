<?php

declare(strict_types=1);

namespace App\Application\Command\Patient;

use App\Domain\Entity\Customer;
use App\Domain\Entity\Patient;
use App\Domain\Repository\CustomerRepositoryInterface;
use App\Domain\Repository\PatientRepositoryInterface;
use Symfony\Component\DependencyInjection\Attribute\Target;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
use Symfony\Component\Messenger\MessageBusInterface;

#[AsMessageHandler(bus: 'command.bus')]
class CreatePatientHandler
{
    public function __construct(
        private PatientRepositoryInterface $patientRepo,
        private CustomerRepositoryInterface $customerRepo,
        #[Target('event.bus')]
        private MessageBusInterface $eventBus
    ) {
    }

    public function __invoke(CreatePatientCommand $cmd): int
    {
        // Handle Customer (Logic from legacy Processor)
        $customer = null;
        if (!empty($cmd->taxId)) {
            $customer = $this->customerRepo->findOneByTaxId($cmd->taxId);
            
            if (!$customer) {
                $customer = Customer::create(
                    firstName: $cmd->firstName,
                    lastName: $cmd->lastName,
                    taxId: $cmd->taxId,
                    email: $cmd->email,
                    phone: $cmd->phone,
                    billingAddress: $cmd->address ?? ''
                );
                $this->customerRepo->save($customer);
                $customer->recordCreatedEvent();
                foreach ($customer->pullDomainEvents() as $event) {
                    $this->eventBus->dispatch($event);
                }
            }
        }

        // Explicit customer override via IRI
        if (null !== $cmd->customer && preg_match('#/api/customers/(\d+)#', $cmd->customer, $matches)) {
            $customer = $this->customerRepo->get((int)$matches[1]);
        }

        $patient = Patient::create(
            firstName: $cmd->firstName,
            lastName: $cmd->lastName,
            dateOfBirth: $cmd->dateOfBirth,
            taxId: $cmd->taxId,
            phone: $cmd->phone,
            address: $cmd->address,
            email: $cmd->email,
            profession: $cmd->profession,
            sportsActivity: $cmd->sportsActivity,
            notes: $cmd->notes,
            rate: $cmd->rate,
            allergies: $cmd->allergies,
            medication: $cmd->medication,
            systemicDiseases: $cmd->systemicDiseases,
            surgeries: $cmd->surgeries,
            accidents: $cmd->accidents,
            injuries: $cmd->injuries,
            bruxism: $cmd->bruxism,
            insoles: $cmd->insoles,
            others: $cmd->others,
            status: $cmd->status
        );

        $patient->customer = $customer;

        $this->patientRepo->save($patient);

        // Record and Dispatch Created Event
        $patient->recordCreatedEvent();
        
        foreach ($patient->pullDomainEvents() as $event) {
            $this->eventBus->dispatch($event);
        }

        return (int) $patient->id;
    }
}
