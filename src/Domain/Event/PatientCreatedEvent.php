<?php

declare(strict_types=1);

namespace App\Domain\Event;

use App\Domain\Entity\Patient;
use Symfony\Contracts\EventDispatcher\Event;

/**
 * Event dispatched when a patient is created
 */
class PatientCreatedEvent extends Event
{
    public const NAME = 'patient.created';

    public function __construct(
        private Patient $patient,
        private ?array $metadata = null
    ) {
    }

    public function getPatient(): Patient
    {
        return $this->patient;
    }

    public function getMetadata(): ?array
    {
        return $this->metadata;
    }
}
