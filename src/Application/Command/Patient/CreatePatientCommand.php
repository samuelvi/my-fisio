<?php

declare(strict_types=1);

namespace App\Application\Command\Patient;

use App\Domain\Enum\PatientStatus;
use DateTimeInterface;

class CreatePatientCommand
{
    public function __construct(
        public string $firstName,
        public string $lastName,
        public PatientStatus $status = PatientStatus::ACTIVE,
        public ?DateTimeInterface $dateOfBirth = null,
        public ?string $taxId = null,
        public ?string $phone = null,
        public ?string $email = null,
        public ?string $address = null,
        public ?string $profession = null,
        public ?string $sportsActivity = null,
        public ?string $notes = null,
        public ?string $rate = null,
        public ?string $allergies = null,
        public ?string $medication = null,
        public ?string $systemicDiseases = null,
        public ?string $surgeries = null,
        public ?string $accidents = null,
        public ?string $injuries = null,
        public ?string $bruxism = null,
        public ?string $insoles = null,
        public ?string $others = null,
        public ?string $customer = null // IRI or ID
    ) {
    }
}
