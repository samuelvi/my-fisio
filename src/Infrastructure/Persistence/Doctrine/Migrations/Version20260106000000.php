<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Doctrine\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260106000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Adds indexes to starts_at and ends_at columns in appointments table for performance.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE INDEX idx_appointments_starts_at ON appointments (starts_at)');
        $this->addSql('CREATE INDEX idx_appointments_ends_at ON appointments (ends_at)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX idx_appointments_starts_at ON appointments');
        $this->addSql('DROP INDEX idx_appointments_ends_at ON appointments');
    }
}
