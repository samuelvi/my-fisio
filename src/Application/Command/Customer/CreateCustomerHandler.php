<?php

declare(strict_types=1);

namespace App\Application\Command\Customer;

use App\Domain\Entity\Customer;
use App\Domain\Repository\CustomerRepositoryInterface;
use Symfony\Component\DependencyInjection\Attribute\Target;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
use Symfony\Component\Messenger\MessageBusInterface;

#[AsMessageHandler(bus: 'command.bus')]
class CreateCustomerHandler
{
    public function __construct(
        private CustomerRepositoryInterface $customerRepo,
        #[Target('event.bus')]
        private MessageBusInterface $eventBus
    ) {
    }

    public function __invoke(CreateCustomerCommand $cmd): int
    {
        $customer = Customer::create(
            firstName: $cmd->firstName,
            lastName: $cmd->lastName,
            taxId: $cmd->taxId,
            email: $cmd->email,
            phone: $cmd->phone,
            billingAddress: $cmd->billingAddress
        );

        $this->customerRepo->save($customer);

        $customer->recordCreatedEvent();
        
        foreach ($customer->pullDomainEvents() as $event) {
            $this->eventBus->dispatch($event);
        }

        return (int) $customer->id;
    }
}
