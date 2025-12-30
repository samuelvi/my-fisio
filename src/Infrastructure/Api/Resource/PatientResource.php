<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\Resource;

use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiProperty;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use App\Domain\Enum\PatientStatus;
use App\Infrastructure\Api\State\PatientProcessor;
use App\Infrastructure\Api\State\PatientProvider;
use DateTimeImmutable;
use DateTimeInterface;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ApiResource(
    shortName: 'Patient',
    operations: [
        new Get(name: 'api_patients_get'),
        new GetCollection(name: 'api_patients_collection'),
        new Post(name: 'api_patients_post', processor: PatientProcessor::class),
        new Put(name: 'api_patients_put', processor: PatientProcessor::class),
    ],
    provider: PatientProvider::class,
    normalizationContext: ['groups' => ['patient:read']],
    denormalizationContext: ['groups' => ['patient:write']],
)]
#[ApiFilter(SearchFilter::class, properties: ['status' => 'exact'])]
class PatientResource
{
    #[ApiProperty(identifier: true)]
    #[Groups(['patient:read'])]
    public ?int $id = null;

    #[Groups(['patient:read', 'patient:write'])]
    public PatientStatus $status = PatientStatus::ACTIVE;

    #[Groups(['patient:read', 'patient:write'])]
    #[Assert\NotBlank(normalizer: 'trim', message: 'patient_first_name_required')]
    public string $firstName = '';

    #[Groups(['patient:read', 'patient:write'])]
    #[Assert\NotBlank(normalizer: 'trim', message: 'patient_last_name_required')]
    public string $lastName = '';

    #[Groups(['patient:read', 'patient:write'])]
    public ?DateTimeInterface $dateOfBirth = null;

    #[Groups(['patient:read', 'patient:write'])]
    public ?string $taxId = null;

    #[Groups(['patient:read', 'patient:write'])]
    public ?string $phone = null;

    #[Groups(['patient:read', 'patient:write'])]
    public ?string $email = null;

    #[Groups(['patient:read', 'patient:write'])]
    public ?string $address = null;

    #[Groups(['patient:read', 'patient:write'])]
    public ?string $profession = null;

    #[Groups(['patient:read', 'patient:write'])]
    public ?string $sportsActivity = null;

    #[Groups(['patient:read', 'patient:write'])]
    public ?string $notes = null;

    #[Groups(['patient:read', 'patient:write'])]
    public ?string $rate = null;

    #[Groups(['patient:read', 'patient:write'])]
    public ?string $allergies = null;

    #[Groups(['patient:read', 'patient:write'])]
    public ?string $medication = null;

    #[Groups(['patient:read', 'patient:write'])]
    public ?string $systemicDiseases = null;

    #[Groups(['patient:read', 'patient:write'])]
    public ?string $surgeries = null;

    #[Groups(['patient:read', 'patient:write'])]
    public ?string $accidents = null;

    #[Groups(['patient:read', 'patient:write'])]
    public ?string $injuries = null;

    #[Groups(['patient:read', 'patient:write'])]
    public ?string $bruxism = null;

    #[Groups(['patient:read', 'patient:write'])]
    public ?string $insoles = null;

    #[Groups(['patient:read', 'patient:write'])]
    public ?string $others = null;

    #[Groups(['patient:read', 'patient:write'])]
    public ?string $customer = null;

    #[Groups(['patient:read'])]
    public ?DateTimeImmutable $createdAt = null;

    /** @var array<int, mixed> */
    #[Groups(['patient:read'])]
    public array $records = [];

    public function __construct()
    {
    }
}
