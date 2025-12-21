<?php

namespace App\Infrastructure\Api\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Domain\Entity\Appointment;
use App\Infrastructure\Api\Resource\AppointmentResource;
use Doctrine\ORM\EntityManagerInterface;

class AppointmentProvider implements ProviderInterface
{
    public function __construct(
        private EntityManagerInterface $entityManager
    ) {
    }

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): object|array|null
    {
        if (isset($uriVariables['id'])) {
            $appointment = $this->entityManager->getRepository(Appointment::class)->find($uriVariables['id']);
            return $appointment ? $this->mapToResource($appointment) : null;
        }

        $filters = $context['filters'] ?? [];
        $criteria = [];
        if (isset($filters['patientId'])) {
            $criteria['patient'] = $filters['patientId'];
        }

        $appointments = $this->entityManager->getRepository(Appointment::class)->findBy($criteria, ['startsAt' => 'ASC']);

        return array_map([$this, 'mapToResource'], $appointments);
    }

    private function mapToResource(Appointment $appointment): AppointmentResource
    {
        $resource = new AppointmentResource();
        $resource->id = $appointment->id;
        $resource->patientId = $appointment->patient->id;
        $resource->patientName = $appointment->patient->firstName . ' ' . $appointment->patient->lastName;
        $resource->userId = $appointment->userId;
        $resource->title = $appointment->title;
        $resource->allDay = $appointment->allDay;
        $resource->startsAt = $appointment->startsAt;
        $resource->endsAt = $appointment->endsAt;
        $resource->notes = $appointment->notes;
        $resource->url = $appointment->url;
        $resource->className = $appointment->className;
        $resource->editable = $appointment->editable;
        $resource->startEditable = $appointment->startEditable;
        $resource->durationEditable = $appointment->durationEditable;
        $resource->color = $appointment->color;
        $resource->backgroundColor = $appointment->backgroundColor;
        $resource->textColor = $appointment->textColor;
        $resource->createdAt = $appointment->createdAt;
        
        return $resource;
    }
}
