<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\Validator;

use App\Domain\Repository\PatientRepositoryInterface;
use App\Infrastructure\Api\Resource\PatientResource;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\ConstraintValidator;
use Symfony\Component\Validator\Exception\UnexpectedTypeException;

class UniquePatientEmailValidator extends ConstraintValidator
{
    public function __construct(private PatientRepositoryInterface $patientRepository)
    {
    }

    public function validate(mixed $value, Constraint $constraint): void
    {
        if (!$constraint instanceof UniquePatientEmail) {
            throw new UnexpectedTypeException($constraint, UniquePatientEmail::class);
        }

        if (!$value instanceof PatientResource) {
            throw new UnexpectedTypeException($value, PatientResource::class);
        }

        if (empty($value->email)) {
            return;
        }

        if ($this->patientRepository->existsByEmail($value->email, $value->id)) {
            $this->context->buildViolation($constraint->message)
                ->setParameter('{{ value }}', $value->email)
                ->atPath('email')
                ->addViolation();
        }
    }
}