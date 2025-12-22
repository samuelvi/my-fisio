<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Doctrine\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20251222094000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Allow records.patient_id to be nullable for legacy imports';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE records ALTER patient_id DROP NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE records ALTER patient_id SET NOT NULL');
    }
}
