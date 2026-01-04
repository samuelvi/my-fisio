<?php

declare(strict_types=1);

namespace App\Infrastructure\Validator\Constraints;

use Symfony\Component\Validator\Constraint;

/**
 * @Annotation
 * @Target({"PROPERTY", "METHOD", "ANNOTATION"})
 */
#[\Attribute(\Attribute::TARGET_PROPERTY | \Attribute::TARGET_METHOD | \Attribute::TARGET_CLASS | \Attribute::IS_REPEATABLE)]
class UniqueCustomerTaxId extends Constraint
{
    public string $message = 'There is already a customer with this Tax ID.';

    public function getTargets(): string|array
    {
        return self::CLASS_CONSTRAINT;
    }
}
