<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Doctrine\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20251224120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add trigram indexes to speed up fuzzy patient search.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_patients_full_name_trgm ON patients USING GIN (full_name gin_trgm_ops)');
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_patients_first_name_trgm ON patients USING GIN (first_name gin_trgm_ops)');
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_patients_last_name_trgm ON patients USING GIN (last_name gin_trgm_ops)');
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_patients_email_trgm ON patients USING GIN (email gin_trgm_ops)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX IF EXISTS idx_patients_email_trgm');
        $this->addSql('DROP INDEX IF EXISTS idx_patients_last_name_trgm');
        $this->addSql('DROP INDEX IF EXISTS idx_patients_first_name_trgm');
        $this->addSql('DROP INDEX IF EXISTS idx_patients_full_name_trgm');
    }
}
