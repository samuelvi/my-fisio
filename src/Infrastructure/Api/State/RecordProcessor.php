<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Domain\Entity\Patient;
use App\Domain\Entity\Record;
use App\Infrastructure\Api\Resource\RecordResource;
use DateTimeImmutable;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class RecordProcessor implements ProcessorInterface
{
    public function __construct(
        private EntityManagerInterface $entityManager,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        if (!$data instanceof RecordResource) {
            return $data;
        }

        if (isset($uriVariables['id'])) {
            $record = $this->entityManager->getRepository(Record::class)->find($uriVariables['id']);
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
        }

        if (!$record) {
            return null;
        }

        // Parse patient ID from IRI
        if (null !== $data->patient && preg_match('#/api/patients/(\d+)#', $data->patient, $matches)) {
            $patientId = (int) $matches[1];
            $patient = $this->entityManager->getRepository(Patient::class)->find($patientId);
            if (!$patient) {
                throw new BadRequestHttpException('Patient not found');
            }
            $record->patient = $patient;
        }

        $record->physiotherapyTreatment = $data->physiotherapyTreatment;
        $record->consultationReason = $data->consultationReason;
        $record->currentSituation = $data->currentSituation;
        $record->evolution = $data->evolution;
        $record->radiologyTests = $data->radiologyTests;
        $record->medicalTreatment = $data->medicalTreatment;
        $record->homeTreatment = $data->homeTreatment;
        $record->onset = $data->onset;
        $record->notes = $data->notes;
        $record->sickLeave = $data->sickLeave;
        if ($data->createdAt instanceof DateTimeImmutable) {
            $record->createdAt = $data->createdAt;
        }

        $this->entityManager->persist($record);
        $this->entityManager->flush();

        $data->id = $record->id;
        if ($record->createdAt instanceof DateTimeImmutable) {
            $data->createdAt = $record->createdAt;
        }

        return $data;
    }
}
