<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Doctrine\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20251227150000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create case_insensitive collation';
    }

    public function up(Schema $schema): void
    {
        // Create the collation if it doesn't exist
        $this->addSql("CREATE COLLATION IF NOT EXISTS case_insensitive (provider = icu, locale = 'und-u-ks-level2', deterministic = false)");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP COLLATION IF EXISTS case_insensitive');
    }
}
