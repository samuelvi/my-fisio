<?php

namespace App\Infrastructure\Api\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Domain\Entity\Appointment;
use App\Infrastructure\Api\Resource\AppointmentResource;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\RequestStack;

class AppointmentProvider implements ProviderInterface
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private RequestStack $requestStack
    ) {
    }

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): object|array|null
    {
        if (isset($uriVariables['id'])) {
            $appointment = $this->entityManager->getRepository(Appointment::class)->find($uriVariables['id']);
            return $appointment ? $this->mapToResource($appointment) : null;
        }

        $request = $this->requestStack->getCurrentRequest();
        
        // We only care about the date range for the calendar
        $start = $request?->query->get('start');
        $end = $request?->query->get('end');
        $patientId = $request?->query->get('patientId');

        $repository = $this->entityManager->getRepository(Appointment::class);
        $qb = $repository->createQueryBuilder('a');

        // Optional filter by patient (e.g. from Patient Detail page)
        if ($patientId) {
            $qb->andWhere('a.patient = :patientId')
               ->setParameter('patientId', $patientId);
        }

        // Essential filters for the calendar view (Inclusive overlap check)
        if ($start) {
            $qb->andWhere('a.endsAt >= :start')
               ->setParameter('start', new \DateTimeImmutable($start));
        }

        if ($end) {
            $qb->andWhere('a.startsAt <= :end')
               ->setParameter('end', new \DateTimeImmutable($end));
        }

        $appointments = $qb->orderBy('a.startsAt', 'ASC')
                           ->getQuery()
                           ->getResult();

        return array_map([$this, 'mapToResource'], $appointments);
    }

    private function mapToResource(Appointment $appointment): AppointmentResource
    {
        $resource = new AppointmentResource();
        $resource->id = $appointment->id;
        if ($appointment->patient) {
            $resource->patientId = $appointment->patient->id;
            $resource->patientName = $appointment->patient->firstName . ' ' . $appointment->patient->lastName;
        }
        $resource->userId = $appointment->userId;
        
        // Logical title fallback: Title -> Patient Name -> Start of Notes -> empty
        if (!empty($appointment->title)) {
            $resource->title = $appointment->title;
        } elseif ($appointment->patient) {
            $resource->title = $appointment->patient->firstName . ' ' . $appointment->patient->lastName;
        } elseif (!empty($appointment->notes)) {
            $resource->title = mb_substr($appointment->notes, 0, 30) . (mb_strlen($appointment->notes) > 30 ? '...' : '');
        } else {
            $resource->title = '';
        }
        
        $resource->allDay = $appointment->allDay;
        $resource->startsAt = $appointment->startsAt;
        $resource->endsAt = $appointment->endsAt;
        $resource->notes = $appointment->notes;
        $resource->type = $appointment->type;
        $resource->createdAt = $appointment->createdAt;
        
        return $resource;
    }
}
