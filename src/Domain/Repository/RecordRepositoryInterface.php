<?php

declare(strict_types=1);

namespace App\Domain\Repository;

use App\Domain\Entity\Record;

interface RecordRepositoryInterface
{
    public function get(int $id): Record;

    public function save(Record $record): void;

    public function delete(Record $record): void;
}
