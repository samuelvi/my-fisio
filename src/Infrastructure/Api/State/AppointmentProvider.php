<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Domain\Enum\AppointmentType;
use App\Infrastructure\Api\Resource\AppointmentResource;
use App\Infrastructure\Persistence\Doctrine\Repository\DoctrineAppointmentRepository;
use DateTimeImmutable;
use DateTimeInterface;

class AppointmentProvider implements ProviderInterface
{
    public function __construct(
        private readonly DoctrineAppointmentRepository $repository,
    ) {
    }

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): object|array|null
    {
        if (isset($uriVariables['id'])) {
            $result = $this->repository->getByIdAsArray((int) $uriVariables['id']);
            return $result ? $this->mapToResource($result) : null;
        }

        $filters = $context['filters'] ?? [];
        $searchFilters = [];
        if (isset($filters['startsAt']['after'])) {
            $searchFilters['startsAt'] = $filters['startsAt']['after'];
        }
        if (isset($filters['endsAt']['before'])) {
            $searchFilters['endsAt'] = $filters['endsAt']['before'];
        }

        $appointments = $this->repository->searchAsArray($searchFilters);

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
        $resource->type = $data['type'] instanceof AppointmentType ? $data['type'] : AppointmentType::from($data['type']);

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