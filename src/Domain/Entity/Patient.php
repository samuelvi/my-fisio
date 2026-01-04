<?php

declare(strict_types=1);

namespace App\Domain\Entity;

use App\Domain\Enum\PatientStatus;
use App\Domain\Event\Patient\PatientUpdatedEvent;
use App\Domain\Model\AggregateRoot;
use DateTimeImmutable;
use DateTimeInterface;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

use function sprintf;

#[ORM\Entity]
#[ORM\Table(name: 'patients')]
class Patient
{
    use AggregateRoot;

    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(type: Types::INTEGER)]
    public ?int $id = null;

    #[ORM\Column(type: Types::STRING, length: 150, nullable: false)]
    public string $fullName;

    #[ORM\Column(type: Types::STRING, length: 50, nullable: false)]
    public string $firstName;

    #[ORM\Column(type: Types::STRING, length: 100, nullable: false)]
    public string $lastName;

    #[ORM\Column(type: Types::DATE_IMMUTABLE, nullable: true)]
    public ?DateTimeInterface $dateOfBirth = null;

    #[ORM\Column(type: Types::STRING, length: 15, nullable: true)]
    public ?string $taxId = null;

    #[ORM\Column(type: Types::STRING, length: 50, nullable: true)]
    public ?string $phone = null;

    #[ORM\Column(type: Types::DATE_IMMUTABLE, nullable: false)]
    public DateTimeInterface $createdAt;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    public ?string $address = null;

    #[ORM\Column(type: Types::STRING, length: 100, nullable: true)]
    public ?string $email = null;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    public ?string $profession = null;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    public ?string $sportsActivity = null;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    public ?string $notes = null;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    public ?string $rate = null;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    public ?string $allergies = null;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    public ?string $medication = null;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    public ?string $systemicDiseases = null;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    public ?string $surgeries = null;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    public ?string $accidents = null;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    public ?string $injuries = null;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    public ?string $bruxism = null;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    public ?string $insoles = null;

    #[ORM\Column(type: Types::STRING, length: 250, nullable: true)]
    public ?string $others = null;

    #[ORM\Column(type: Types::STRING, length: 20, options: ['default' => 'active'], enumType: PatientStatus::class)]
    public PatientStatus $status = PatientStatus::ACTIVE;

    #[ORM\ManyToOne(targetEntity: Customer::class)]
    #[ORM\JoinColumn(name: 'customer_id', referencedColumnName: 'id', nullable: true)]
    public ?Customer $customer = null;

    /**
     * @var Collection<int, Record>
     */
    #[ORM\OneToMany(mappedBy: 'patient', targetEntity: Record::class, cascade: ['persist', 'remove'])]
    public Collection $records;

    private function __construct(
        string $firstName,
        string $lastName,
        ?DateTimeInterface $dateOfBirth = null,
        ?string $taxId = null,
        ?string $phone = null,
        ?string $address = null,
        ?string $email = null,
        ?string $profession = null,
        ?string $sportsActivity = null,
        ?string $notes = null,
        ?string $rate = null,
        ?string $allergies = null,
        ?string $medication = null,
        ?string $systemicDiseases = null,
        ?string $surgeries = null,
        ?string $accidents = null,
        ?string $injuries = null,
        ?string $bruxism = null,
        ?string $insoles = null,
        ?string $others = null,
        PatientStatus $status = PatientStatus::ACTIVE,
    ) {
        $this->firstName = $firstName;
        $this->lastName = $lastName;
        $this->dateOfBirth = $dateOfBirth;
        $this->taxId = $taxId;
        $this->phone = $phone;
        $this->address = $address;
        $this->email = $email;
        $this->profession = $profession;
        $this->sportsActivity = $sportsActivity;
        $this->notes = $notes;
        $this->rate = $rate;
        $this->allergies = $allergies;
        $this->medication = $medication;
        $this->systemicDiseases = $systemicDiseases;
        $this->surgeries = $surgeries;
        $this->accidents = $accidents;
        $this->injuries = $injuries;
        $this->bruxism = $bruxism;
        $this->insoles = $insoles;
        $this->others = $others;
        $this->status = $status;
        
        $this->updateFullName();
        $this->createdAt = new DateTimeImmutable();
        $this->records = new ArrayCollection();
    }

    public function update(
        string $firstName,
        string $lastName,
        ?DateTimeInterface $dateOfBirth = null,
        ?string $taxId = null,
        ?string $phone = null,
        ?string $address = null,
        ?string $email = null,
        ?string $profession = null,
        ?string $sportsActivity = null,
        ?string $notes = null,
        ?string $rate = null,
        ?string $allergies = null,
        ?string $medication = null,
        ?string $systemicDiseases = null,
        ?string $surgeries = null,
        ?string $accidents = null,
        ?string $injuries = null,
        ?string $bruxism = null,
        ?string $insoles = null,
        ?string $others = null,
        PatientStatus $status = PatientStatus::ACTIVE,
    ): void {
        $changes = [];
        
        $fields = [
            'firstName' => $firstName,
            'lastName' => $lastName,
            'taxId' => $taxId,
            'phone' => $phone,
            'address' => $address,
            'email' => $email,
            'profession' => $profession,
            'sportsActivity' => $sportsActivity,
            'notes' => $notes,
            'rate' => $rate,
            'allergies' => $allergies,
            'medication' => $medication,
            'systemicDiseases' => $systemicDiseases,
            'surgeries' => $surgeries,
            'accidents' => $accidents,
            'injuries' => $injuries,
            'bruxism' => $bruxism,
            'insoles' => $insoles,
            'others' => $others,
        ];

        foreach ($fields as $field => $newValue) {
            $oldValue = $this->$field;
            if ($oldValue !== $newValue) {
                $changes[$field] = ['before' => $oldValue, 'after' => $newValue];
                $this->$field = $newValue;
            }
        }

        // Handle DateOfBirth (DateTime comparison)
        if ($this->dateOfBirth != $dateOfBirth) {
             $changes['dateOfBirth'] = [
                 'before' => $this->dateOfBirth?->format('Y-m-d'),
                 'after' => $dateOfBirth?->format('Y-m-d')
             ];
             $this->dateOfBirth = $dateOfBirth;
        }

        // Handle Status (Enum)
        if ($this->status !== $status) {
            $changes['status'] = [
                'before' => $this->status->value,
                'after' => $status->value
            ];
            $this->status = $status;
        }

        $this->updateFullName();

        if (!empty($changes)) {
            $this->recordEvent(new PatientUpdatedEvent((string) $this->id, [
                'changes' => $changes,
                'updatedAt' => (new \DateTimeImmutable())->format('Y-m-d H:i:s'),
            ]));
        }
    }

    public function recordCreatedEvent(): void
    {
        $changes = [
            'firstName' => ['before' => null, 'after' => $this->firstName],
            'lastName' => ['before' => null, 'after' => $this->lastName],
            'email' => ['before' => null, 'after' => $this->email],
            'taxId' => ['before' => null, 'after' => $this->taxId],
            'phone' => ['before' => null, 'after' => $this->phone],
            'address' => ['before' => null, 'after' => $this->address],
            'status' => ['before' => null, 'after' => $this->status->value],
            'createdAt' => ['before' => null, 'after' => $this->createdAt->format('Y-m-d H:i:s')],
        ];
        
        $this->recordEvent(new \App\Domain\Event\Patient\PatientCreatedEvent((string) $this->id, [
            'changes' => $changes
        ]));
    }

    public static function create(
        string $firstName,
        string $lastName,
        ?DateTimeInterface $dateOfBirth = null,
        ?string $taxId = null,
        ?string $phone = null,
        ?string $address = null,
        ?string $email = null,
        ?string $profession = null,
        ?string $sportsActivity = null,
        ?string $notes = null,
        ?string $rate = null,
        ?string $allergies = null,
        ?string $medication = null,
        ?string $systemicDiseases = null,
        ?string $surgeries = null,
        ?string $accidents = null,
        ?string $injuries = null,
        ?string $bruxism = null,
        ?string $insoles = null,
        ?string $others = null,
        PatientStatus $status = PatientStatus::ACTIVE,
    ): self {
        return new self(
            $firstName,
            $lastName,
            $dateOfBirth,
            $taxId,
            $phone,
            $address,
            $email,
            $profession,
            $sportsActivity,
            $notes,
            $rate,
            $allergies,
            $medication,
            $systemicDiseases,
            $surgeries,
            $accidents,
            $injuries,
            $bruxism,
            $insoles,
            $others,
            $status
        );
    }

    public function updateFullName(): void
    {
        $firstName = $this->firstName ?? '';
        $lastName = $this->lastName ?? '';
        $this->fullName = trim(sprintf('%s %s', $firstName, $lastName));
    }
}
