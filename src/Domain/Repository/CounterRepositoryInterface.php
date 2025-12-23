<?php

declare(strict_types=1);

namespace App\Domain\Repository;

use App\Domain\Entity\Counter;

interface CounterRepositoryInterface
{
    public function findByName(string $name): ?Counter;

    /**
     * Atomically increments the counter and returns the new value.
     * Prevents race conditions during concurrent invoice generation.
     */
    public function incrementAndGetNext(string $name, string $initialValue): string;
}