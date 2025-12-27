<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Doctrine\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251227153016 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Remove case_insensitive collation from patient columns to support LIKE searches';
    }

    public function up(Schema $schema): void
    {
        // Remove nondeterministic collation from columns that need LIKE searches
        $this->addSql('ALTER TABLE patients ALTER COLUMN full_name TYPE VARCHAR(150)');
        $this->addSql('ALTER TABLE patients ALTER COLUMN first_name TYPE VARCHAR(50)');
        $this->addSql('ALTER TABLE patients ALTER COLUMN last_name TYPE VARCHAR(100)');
        $this->addSql('ALTER TABLE patients ALTER COLUMN email TYPE VARCHAR(100)');
    }

    public function down(Schema $schema): void
    {
        // Restore case_insensitive collation
        $this->addSql('ALTER TABLE patients ALTER COLUMN full_name TYPE VARCHAR(150) COLLATE "case_insensitive"');
        $this->addSql('ALTER TABLE patients ALTER COLUMN first_name TYPE VARCHAR(50) COLLATE "case_insensitive"');
        $this->addSql('ALTER TABLE patients ALTER COLUMN last_name TYPE VARCHAR(100) COLLATE "case_insensitive"');
        $this->addSql('ALTER TABLE patients ALTER COLUMN email TYPE VARCHAR(100) COLLATE "case_insensitive"');
    }
}
