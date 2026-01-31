<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Doctrine\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260131080258 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // 1. Create applications table
        $this->addSql('CREATE TABLE applications (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        
        // 2. Insert default application
        $this->addSql("INSERT INTO applications (name) VALUES ('Default')");
        
        // 3. Add application_id column as NULLABLE first
        $this->addSql('ALTER TABLE users ADD application_id INT DEFAULT NULL');
        
        // 4. Link existing users to the default application
        $this->addSql("UPDATE users SET application_id = (SELECT id FROM applications WHERE name = 'Default' LIMIT 1)");
        
        // 5. Enforce NOT NULL and add constraints
        $this->addSql('ALTER TABLE users MODIFY application_id INT NOT NULL');
        $this->addSql('ALTER TABLE users ADD CONSTRAINT FK_1483A5E93E030ACD FOREIGN KEY (application_id) REFERENCES applications (id)');
        $this->addSql('CREATE INDEX IDX_1483A5E93E030ACD ON users (application_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP TABLE applications');
        $this->addSql('ALTER TABLE users DROP FOREIGN KEY FK_1483A5E93E030ACD');
        $this->addSql('DROP INDEX IDX_1483A5E93E030ACD ON users');
        $this->addSql('ALTER TABLE users DROP application_id');
    }
}
