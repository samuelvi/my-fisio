<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Infrastructure\Api\Resource\AppointmentResource;
use App\Infrastructure\Persistence\Doctrine\Repository\DoctrineAppointmentRepository;
use DateTimeImmutable;
use DateTimeInterface;

use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class AppointmentProvider implements ProviderInterface
{
    public function __construct(
        private readonly DoctrineAppointmentRepository $repository,
        private readonly RequestStack $requestStack,
    ) {
    }

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): object|array|null
    {
        if (isset($uriVariables['id'])) {
            $result = $this->repository->getByIdAsArray((int) $uriVariables['id']);
            return $result ? $this->mapToResource($result) : null;
        }

        $filters = $context['filters'] ?? [];
        $request = $this->requestStack->getCurrentRequest();
        
        $searchFilters = [];
        
        // 1. Try to get dates from standard API Platform filters
        if (isset($filters['startsAt']['after'])) {
            $searchFilters['startsAt'] = $filters['startsAt']['after'];
        }
        if (isset($filters['endsAt']['before'])) {
            $searchFilters['endsAt'] = $filters['endsAt']['before'];
        }

        if (isset($filters['patientId'])) {
            $searchFilters['patientId'] = (int) $filters['patientId'];
        }
        
        // 2. Try to get parameters from Request query (FullCalendar compatibility)
        if ($request) {
            if (null !== $start = $request->query->get('start')) {
                $searchFilters['startsAt'] = $start;
            }
            if (null !== $end = $request->query->get('end')) {
                $searchFilters['endsAt'] = $end;
            }
            if (null !== $pId = $request->query->get('patientId')) {
                $searchFilters['patientId'] = (int) $pId;
            }
        }

        // 3. VALIDATION: start and end must be present UNLESS patientId is provided
        if (!isset($searchFilters['patientId']) && (!isset($searchFilters['startsAt']) || !isset($searchFilters['endsAt']))) {
            throw new BadRequestHttpException('Filtros de fecha "start" y "end" son obligatorios para consultar citas globales.');
        }

        $appointments = $this->repository->searchAsArray($searchFilters);

        // Sort by startsAt ascending
        usort($appointments, function($a, $b) {
            $dateA = $a['startsAt'] instanceof \DateTimeInterface ? $a['startsAt'] : new \DateTime((string) $a['startsAt']);
            $dateB = $b['startsAt'] instanceof \DateTimeInterface ? $b['startsAt'] : new \DateTime((string) $b['startsAt']);
            return $dateA->getTimestamp() <=> $dateB->getTimestamp();
        });

        return array_map([$this, 'mapToResource'], $appointments);
    }

    private function mapToResource(array $data): AppointmentResource
    {
        $resource = new AppointmentResource();
        $resource->id = $data['id'];
        $resource->userId = $data['userId'];
        $resource->patientId = $data['patient']['id'] ?? null;
        $resource->patientName = isset($data['patient']) ? $data['patient']['firstName'].' '.$data['patient']['lastName'] : null;
        $resource->title = $data['title'];
        $resource->allDay = $data['allDay'];
        $resource->notes = $data['notes'] ?? null;
        $resource->type = $data['type'] ?? null;

        $resource->startsAt = $data['startsAt'] instanceof DateTimeInterface
            ? DateTimeImmutable::createFromInterface($data['startsAt'])
            : new DateTimeImmutable($data['startsAt']);

        $resource->endsAt = $data['endsAt'] instanceof DateTimeInterface
            ? DateTimeImmutable::createFromInterface($data['endsAt'])
            : new DateTimeImmutable($data['endsAt']);

        $resource->createdAt = $data['createdAt'] instanceof DateTimeInterface
            ? DateTimeImmutable::createFromInterface($data['createdAt'])
            : new DateTimeImmutable($data['createdAt']);

        return $resource;
    }
}