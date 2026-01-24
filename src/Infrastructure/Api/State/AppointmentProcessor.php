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

class AppointmentProcessor implements ProcessorInterface
{
    public function __construct(
        private AppointmentRepositoryInterface $appointmentRepo,
        private PatientRepositoryInterface $patientRepo,
        private Security $security,
    ) {
    }

    /**
     * @param AppointmentResource $data
     */
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): ?AppointmentResource
    {
        if ($operation instanceof DeleteOperationInterface) {
            $appointment = $this->appointmentRepo->get((int) $uriVariables['id']);
            $this->appointmentRepo->delete($appointment);

            return null;
        }

        if (isset($uriVariables['id'])) {
            $appointment = $this->appointmentRepo->get((int) $uriVariables['id']);
        } else {
            /** @var User $user */
            $user = $this->security->getUser();

            $appointment = Appointment::create(
                patient: null,
                userId: $user->getId(),
                startsAt: $data->startsAt,
                endsAt: $data->endsAt,
                title: $data->title,
                allDay: $data->allDay,
                type: $data->type,
                notes: $data->notes
            );
        }

        if (null !== $data->patientId) {
            $patient = $this->patientRepo->get((int) $data->patientId);
            $appointment->patient = $patient;
        } elseif (property_exists($data, 'patientId')) {
            // Nullify if explicitly passed as null/undefined handling (depends on serialization)
            // Ideally we check if it was actually in the payload
            $appointment->patient = null;
        }

        $appointment->title = $data->title;
        $appointment->allDay = $data->allDay;
        $appointment->startsAt = $data->startsAt;
        $appointment->endsAt = $data->endsAt;
        $appointment->notes = $data->notes;
        $appointment->type = $data->type;

        $appointment->updateTimestamp();

        $this->appointmentRepo->save($appointment);

        $data->id = $appointment->id;
        $data->userId = $appointment->userId;
        $data->patientName = $appointment->patient ? $appointment->patient->firstName.' '.$appointment->patient->lastName : null;
        $data->createdAt = $appointment->createdAt;

        return $data;
    }
}