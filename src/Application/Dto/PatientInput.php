<?php

declare(strict_types=1);

namespace App\Application\Dto;

use Symfony\Component\Validator\Constraints as Assert;

final class PatientInput
{
    #[Assert\NotBlank(message: 'patient_first_name_required')]
    #[Assert\Length(max: 50, maxMessage: 'patient_first_name_max_length')]
    public string $firstName = '';

    #[Assert\NotBlank(message: 'patient_last_name_required')]
    #[Assert\Length(max: 100, maxMessage: 'patient_last_name_max_length')]
    public string $lastName = '';

    public ?string $dateOfBirth = null;

    public ?string $identityDocument = null;

    public ?string $phone = null;

    public ?string $email = null;

    public ?string $address = null;

    public ?string $profession = null;

    public ?string $sportsActivity = null;

    public ?string $allergies = null;

    public ?string $medication = null;

    public ?string $systemicDiseases = null;

    public ?string $surgeries = null;

    public ?string $accidents = null;

    public ?string $notes = null;

    private function __construct()
    {
    }

    public static function create(): self
    {
        return new self();
    }
}
