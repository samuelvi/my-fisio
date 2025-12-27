<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Doctrine\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251227144758 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // Apply case_insensitive collation to searchable columns
        $this->addSql('ALTER TABLE patients ALTER COLUMN full_name TYPE VARCHAR(150) COLLATE case_insensitive');
        $this->addSql('ALTER TABLE patients ALTER COLUMN first_name TYPE VARCHAR(50) COLLATE case_insensitive');
        $this->addSql('ALTER TABLE patients ALTER COLUMN last_name TYPE VARCHAR(100) COLLATE case_insensitive');
        $this->addSql('ALTER TABLE patients ALTER COLUMN email TYPE VARCHAR(100) COLLATE case_insensitive');
    }

    public function down(Schema $schema): void
    {
        // Revert to default collation
        $this->addSql('ALTER TABLE patients ALTER COLUMN full_name TYPE VARCHAR(150)');
        $this->addSql('ALTER TABLE patients ALTER COLUMN first_name TYPE VARCHAR(50)');
        $this->addSql('ALTER TABLE patients ALTER COLUMN last_name TYPE VARCHAR(100)');
        $this->addSql('ALTER TABLE patients ALTER COLUMN email TYPE VARCHAR(100)');
    }
}
