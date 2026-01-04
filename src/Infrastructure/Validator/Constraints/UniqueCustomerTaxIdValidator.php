<?php

declare(strict_types=1);

namespace App\Infrastructure\Validator\Constraints;

use App\Domain\Repository\CustomerRepositoryInterface;
use App\Infrastructure\Api\Resource\CustomerResource;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\ConstraintValidator;
use Symfony\Component\Validator\Exception\UnexpectedTypeException;

class UniqueCustomerTaxIdValidator extends ConstraintValidator
{
    public function __construct(
        private readonly CustomerRepositoryInterface $customerRepository,
    ) {
    }

    public function validate(mixed $value, Constraint $constraint): void
    {
        if (!$constraint instanceof UniqueCustomerTaxId) {
            throw new UnexpectedTypeException($constraint, UniqueCustomerTaxId::class);
        }

        if (!$value instanceof CustomerResource) {
            return;
        }

        if (empty($value->taxId)) {
            return;
        }

        $existing = $this->customerRepository->findOneByTaxId($value->taxId);

        if ($existing && $existing->id !== $value->id) {
            $this->context->buildViolation($constraint->message)
                ->atPath('taxId')
                ->addViolation();
        }
    }
}
