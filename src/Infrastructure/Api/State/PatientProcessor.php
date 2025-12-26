<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use ApiPlatform\Validator\Exception\ValidationException;
use App\Domain\Entity\Patient;
use App\Infrastructure\Api\Resource\PatientResource;
use DateTimeImmutable;
use function count;

use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class PatientProcessor implements ProcessorInterface
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private ValidatorInterface $validator,
    ) {
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
            $patient = $this->entityManager->getRepository(Patient::class)->find($uriVariables['id']);
        } else {
            $patient = Patient::create($data->firstName, $data->lastName);
        }

        if (!$patient) {
            return null;
        }

        $patient->firstName = $data->firstName;
        $patient->lastName = $data->lastName;
        $patient->syncFullName();
        $patient->status = $data->status;
        $patient->dateOfBirth = $data->dateOfBirth;
        $patient->identityDocument = $data->identityDocument;
        $patient->phone = $data->phone;
        $patient->email = $data->email;
        $patient->address = $data->address;
        $patient->profession = $data->profession;
        $patient->sportsActivity = $data->sportsActivity;
        $patient->notes = $data->notes;
        $patient->rate = $data->rate;
        $patient->allergies = $data->allergies;
        $patient->medication = $data->medication;
        $patient->systemicDiseases = $data->systemicDiseases;
        $patient->surgeries = $data->surgeries;
        $patient->accidents = $data->accidents;
        $patient->injuries = $data->injuries;
        $patient->bruxism = $data->bruxism;
        $patient->insoles = $data->insoles;
        $patient->others = $data->others;

        $this->entityManager->persist($patient);
        $this->entityManager->flush();

        $data->id = $patient->id;
        if ($patient->createdAt instanceof DateTimeImmutable) {
            $data->createdAt = $patient->createdAt;
        }

        return $data;
    }
}
