<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Doctrine\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Create Event Store Table
 */
final class Version20260105000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Creates the event_store table for event sourcing';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE event_store (
            id BIGINT AUTO_INCREMENT NOT NULL,
            aggregate_id VARCHAR(36) NOT NULL,
            event_name VARCHAR(255) NOT NULL,
            payload JSON NOT NULL,
            occurred_on DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            version INT NOT NULL,
            INDEX idx_es_aggregate_id (aggregate_id),
            INDEX idx_es_event_name (event_name),
            INDEX idx_es_occurred_on (occurred_on),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE event_store');
    }
}
