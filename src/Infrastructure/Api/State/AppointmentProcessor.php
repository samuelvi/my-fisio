<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\State;

use ApiPlatform\Metadata\DeleteOperationInterface;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Domain\Entity\Appointment;
use App\Domain\Entity\User;
use App\Domain\Repository\AppointmentRepositoryInterface;
use App\Domain\Repository\PatientRepositoryInterface;
use App\Infrastructure\Api\Resource\AppointmentResource;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Target;
use Symfony\Component\Messenger\MessageBusInterface;

class AppointmentProcessor implements ProcessorInterface
{
    public function __construct(
        private AppointmentRepositoryInterface $appointmentRepo,
        private PatientRepositoryInterface $patientRepo,
        private Security $security,
        #[Target('event.bus')]
        private MessageBusInterface $eventBus,
    ) {
    }

    /**
     * @param AppointmentResource $data
     */
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): ?AppointmentResource
    {
        if ($operation instanceof DeleteOperationInterface) {
            $appointment = $this->appointmentRepo->get((int) $uriVariables['id']);
            $appointment->recordDeletedEvent();
            foreach ($appointment->pullDomainEvents() as $event) {
                $this->eventBus->dispatch($event);
            }
            $this->appointmentRepo->delete($appointment);

            return null;
        }

        // Resolve Patient first
        $patient = null;
        if (null !== $data->patientId) {
            $patient = $this->patientRepo->get((int) $data->patientId);
        }

        if (isset($uriVariables['id'])) {
            $appointment = $this->appointmentRepo->get((int) $uriVariables['id']);
            
            $appointment->update(
                patient: $patient,
                startsAt: $data->startsAt,
                endsAt: $data->endsAt,
                title: $data->title,
                allDay: $data->allDay,
                type: $data->type,
                notes: $data->notes
            );
        } else {
            /** @var User $user */
            $user = $this->security->getUser();

            $appointment = Appointment::create(
                patient: $patient,
                userId: $user->id,
                startsAt: $data->startsAt,
                endsAt: $data->endsAt,
                title: $data->title,
                allDay: $data->allDay,
                type: $data->type,
                notes: $data->notes
            );
            $appointment->recordCreatedEvent();
        }

        $this->appointmentRepo->save($appointment);

        foreach ($appointment->pullDomainEvents() as $event) {
            $this->eventBus->dispatch($event);
        }

        $data->id = $appointment->id;
        $data->userId = $appointment->userId;
        $data->patientName = $appointment->patient ? $appointment->patient->firstName.' '.$appointment->patient->lastName : null;
        $data->createdAt = $appointment->createdAt;

        return $data;
    }
}
