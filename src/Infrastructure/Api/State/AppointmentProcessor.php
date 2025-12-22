<?php

namespace App\Infrastructure\Api\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\Metadata\DeleteOperationInterface;
use ApiPlatform\State\ProcessorInterface;
use App\Domain\Entity\Appointment;
use App\Domain\Entity\Patient;
use App\Infrastructure\Api\Resource\AppointmentResource;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class AppointmentProcessor implements ProcessorInterface
{
    public function __construct(
        private EntityManagerInterface $entityManager
    ) {
    }

    /**
     * @param AppointmentResource $data
     */
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): ?AppointmentResource
    {
        if ($operation instanceof DeleteOperationInterface) {
            $appointment = $this->entityManager->getRepository(Appointment::class)->find($uriVariables['id']);
            if ($appointment) {
                $this->entityManager->remove($appointment);
                $this->entityManager->flush();
            }
            return null;
        }

        if (isset($uriVariables['id'])) {
            $appointment = $this->entityManager->getRepository(Appointment::class)->find($uriVariables['id']);
            if (!$appointment) {
                throw new NotFoundHttpException('Appointment not found');
            }
        } else {
            $patient = null;
            if ($data->patientId) {
                $patient = $this->entityManager->getRepository(Patient::class)->find($data->patientId);
                if (!$patient) {
                    throw new NotFoundHttpException('Patient not found');
                }
            }

            $appointment = Appointment::create(
                $patient,
                $data->userId,
                $data->startsAt,
                $data->endsAt
            );
        }

        // Update patient if provided (allows changing or setting patient on update)
        if ($data->patientId !== null) {
            $patient = $this->entityManager->getRepository(Patient::class)->find($data->patientId);
            if ($patient) {
                $appointment->patient = $patient;
            }
        } elseif (property_exists($data, 'patientId')) {
            // If patientId is explicitly null in the request, we might want to unset it
            $appointment->patient = null;
        }

        // Update fields
        $appointment->title = $data->title;
        $appointment->allDay = $data->allDay;
        $appointment->startsAt = $data->startsAt;
        $appointment->endsAt = $data->endsAt;
        $appointment->notes = $data->notes;
        $appointment->type = $data->type;

        $this->entityManager->persist($appointment);
        $this->entityManager->flush();

        $data->id = $appointment->id;
        $data->patientName = $appointment->patient ? $appointment->patient->firstName . ' ' . $appointment->patient->lastName : null;
        $data->createdAt = $appointment->createdAt;
            
        return $data;
    }
}
