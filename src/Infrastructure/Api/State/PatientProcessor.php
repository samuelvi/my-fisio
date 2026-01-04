<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use ApiPlatform\Validator\Exception\ValidationException;
use App\Application\Command\Patient\CreatePatientCommand;
use App\Application\Command\Patient\UpdatePatientCommand;
use App\Infrastructure\Api\Resource\PatientResource;
use Symfony\Component\Messenger\HandleTrait;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

use function count;

class PatientProcessor implements ProcessorInterface
{
    use HandleTrait;

    public function __construct(
        MessageBusInterface $commandBus,
        private ValidatorInterface $validator,
    ) {
        $this->messageBus = $commandBus;
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
            $command = new UpdatePatientCommand(
                id: (int) $uriVariables['id'],
                firstName: $data->firstName,
                lastName: $data->lastName,
                status: $data->status,
                dateOfBirth: $data->dateOfBirth,
                taxId: $data->taxId,
                phone: $data->phone,
                email: $data->email,
                address: $data->address,
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
                customer: $data->customer
            );

            $this->handle($command);
            
            // For updates, we can assume the ID didn't change.
            $data->id = (int) $uriVariables['id'];
        } else {
            $command = new CreatePatientCommand(
                firstName: $data->firstName,
                lastName: $data->lastName,
                status: $data->status,
                dateOfBirth: $data->dateOfBirth,
                taxId: $data->taxId,
                phone: $data->phone,
                email: $data->email,
                address: $data->address,
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
                customer: $data->customer
            );

            $id = $this->handle($command);
            $data->id = $id;
        }

        return $data;
    }
}