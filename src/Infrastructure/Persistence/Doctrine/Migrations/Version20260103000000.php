<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Doctrine\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Audit System Migration - Creates audit_trail and domain_events tables
 *
 * This migration implements a two-table audit system:
 * - audit_trail: Technical changes for compliance (GDPR, SOX, HIPAA)
 * - domain_events: Business events following Event Sourcing patterns
 */
final class Version20260103000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Creates audit_trail and domain_events tables for the audit system';
    }

    public function up(Schema $schema): void
    {
        // Create audit_trail table (compliance and debugging)
        $this->addSql('
            CREATE TABLE audit_trail (
                id BIGINT AUTO_INCREMENT NOT NULL,
                entity_type VARCHAR(100) NOT NULL,
                entity_id VARCHAR(100) NOT NULL,
                operation VARCHAR(20) NOT NULL,
                changes JSON NOT NULL,
                changed_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
                changed_by INT DEFAULT NULL,
                ip_address VARCHAR(45) DEFAULT NULL,
                user_agent LONGTEXT DEFAULT NULL,
                INDEX idx_entity (entity_type, entity_id, changed_at),
                INDEX idx_operation (operation, changed_at),
                INDEX idx_changed_by (changed_by, changed_at),
                INDEX idx_changed_at (changed_at),
                INDEX IDX_6A31EBED895FB3A1 (changed_by),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        ');

        $this->addSql('
            ALTER TABLE audit_trail
            ADD CONSTRAINT FK_6A31EBED895FB3A1
            FOREIGN KEY (changed_by)
            REFERENCES users (id)
            ON DELETE SET NULL
        ');

        // Create domain_events table (event sourcing)
        $this->addSql('
            CREATE TABLE domain_events (
                id BIGINT AUTO_INCREMENT NOT NULL,
                event_id VARCHAR(36) NOT NULL,
                event_name VARCHAR(255) NOT NULL,
                event_version INT NOT NULL,
                aggregate_type VARCHAR(100) NOT NULL,
                aggregate_id VARCHAR(100) NOT NULL,
                payload JSON NOT NULL,
                metadata JSON DEFAULT NULL,
                occurred_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
                recorded_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
                user_id INT DEFAULT NULL,
                correlation_id VARCHAR(36) DEFAULT NULL,
                causation_id VARCHAR(36) DEFAULT NULL,
                UNIQUE INDEX UNIQ_E11C4F1671F7E88B (event_id),
                INDEX idx_aggregate_stream (aggregate_type, aggregate_id, occurred_at),
                INDEX idx_event_name (event_name, occurred_at),
                INDEX idx_occurred (occurred_at),
                INDEX idx_correlation (correlation_id),
                INDEX IDX_E11C4F16A76ED395 (user_id),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        ');

        $this->addSql('
            ALTER TABLE domain_events
            ADD CONSTRAINT FK_E11C4F16A76ED395
            FOREIGN KEY (user_id)
            REFERENCES users (id)
            ON DELETE SET NULL
        ');
    }

    public function down(Schema $schema): void
    {
        // Drop domain_events table
        $this->addSql('ALTER TABLE domain_events DROP FOREIGN KEY FK_E11C4F16A76ED395');
        $this->addSql('DROP TABLE domain_events');

        // Drop audit_trail table
        $this->addSql('ALTER TABLE audit_trail DROP FOREIGN KEY FK_6A31EBED895FB3A1');
        $this->addSql('DROP TABLE audit_trail');
    }
}
