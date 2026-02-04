<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Domain\Entity\Record;
use App\Domain\Repository\PatientRepositoryInterface;
use App\Domain\Repository\RecordRepositoryInterface;
use App\Infrastructure\Api\Resource\RecordResource;
use DateTimeImmutable;
use Symfony\Component\DependencyInjection\Attribute\Target;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Messenger\MessageBusInterface;

class RecordProcessor implements ProcessorInterface
{
    public function __construct(
        private RecordRepositoryInterface $recordRepo,
        private PatientRepositoryInterface $patientRepo,
        #[Target('event.bus')]
        private MessageBusInterface $eventBus,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        if (!$data instanceof RecordResource) {
            return $data;
        }

        // Parse patient ID from IRI
        $patient = null;
        if (null !== $data->patient && preg_match('#/api/patients/(\d+)#', $data->patient, $matches)) {
            $patientId = (int) $matches[1];
            try {
                $patient = $this->patientRepo->get($patientId);
            } catch (\Exception $e) {
                throw new BadRequestHttpException('Patient not found');
            }
        }

        if (isset($uriVariables['id'])) {
            $record = $this->recordRepo->get((int) $uriVariables['id']);
            
            $record->update(
                physiotherapyTreatment: $data->physiotherapyTreatment,
                consultationReason: $data->consultationReason,
                onset: $data->onset,
                radiologyTests: $data->radiologyTests,
                evolution: $data->evolution,
                currentSituation: $data->currentSituation,
                sickLeave: $data->sickLeave,
                medicalTreatment: $data->medicalTreatment,
                homeTreatment: $data->homeTreatment,
                notes: $data->notes,
                patient: $patient
            );

            if ($data->createdAt instanceof DateTimeImmutable) {
                $record->createdAt = $data->createdAt;
            }
        } else {
            $record = Record::create(
                physiotherapyTreatment: $data->physiotherapyTreatment,
                consultationReason: $data->consultationReason,
                onset: $data->onset,
                radiologyTests: $data->radiologyTests,
                evolution: $data->evolution,
                currentSituation: $data->currentSituation,
                sickLeave: $data->sickLeave,
                medicalTreatment: $data->medicalTreatment,
                homeTreatment: $data->homeTreatment,
                notes: $data->notes
            );
            
            if ($patient) {
                $record->patient = $patient;
            }
            if ($data->createdAt instanceof DateTimeImmutable) {
                $record->createdAt = $data->createdAt;
            }
            
            $record->recordCreatedEvent();
        }

        $this->recordRepo->save($record);

        foreach ($record->pullDomainEvents() as $event) {
            $this->eventBus->dispatch($event);
        }

        $data->id = $record->id;
        if ($record->createdAt instanceof DateTimeImmutable) {
            $data->createdAt = $record->createdAt;
        }

        return $data;
    }
}