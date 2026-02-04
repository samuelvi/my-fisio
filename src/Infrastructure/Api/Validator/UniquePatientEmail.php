<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\Validator;

use Symfony\Component\Validator\Constraint;

#[\Attribute]
class UniquePatientEmail extends Constraint
{
    public string $message = 'The email "{{ value }}" is already used.';

    public function getTargets(): string|array
    {
        return self::CLASS_CONSTRAINT;
    }
}
