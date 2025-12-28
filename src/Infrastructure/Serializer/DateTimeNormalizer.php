<?php

declare(strict_types=1);

namespace App\Infrastructure\Serializer;

use DateTimeInterface;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

/**
 * Custom normalizer that serializes DateTime without timezone suffix
 * to avoid timezone conversion issues in the frontend.
 */
final class DateTimeNormalizer implements NormalizerInterface
{
    public function normalize(mixed $object, ?string $format = null, array $context = []): string
    {
        /** @var DateTimeInterface $object */

        // Check if this is a DATE field (time is midnight)
        $hour = (int) $object->format('H');
        $minute = (int) $object->format('i');
        $second = (int) $object->format('s');

        if ($hour === 0 && $minute === 0 && $second === 0) {
            // Return date only format: YYYY-MM-DD (no time, no timezone)
            return $object->format('Y-m-d');
        }

        // Return datetime in format: YYYY-MM-DDTHH:MM:SS (no timezone suffix)
        return $object->format('Y-m-d\TH:i:s');
    }

    public function supportsNormalization(mixed $data, ?string $format = null, array $context = []): bool
    {
        return $data instanceof DateTimeInterface;
    }

    public function getSupportedTypes(?string $format): array
    {
        return [
            DateTimeInterface::class => true,
        ];
    }
}
