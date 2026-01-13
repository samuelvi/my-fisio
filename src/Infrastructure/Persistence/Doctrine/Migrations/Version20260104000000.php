<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Doctrine\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Initial Database Schema - Consolidated Migration
 *
 * Creates all tables for the physiotherapy management system:
 * - Core entities: patients, appointments, records, invoices, customers
 * - System tables: users, counters
 * - Audit: audit_trail (for compliance and debugging)
 */
final class Version20260104000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Creates all database tables for the physiotherapy management system';
    }

    public function up(Schema $schema): void
    {
        // Core tables
        $this->addSql('CREATE TABLE appointments (
            id INT AUTO_INCREMENT NOT NULL,
            user_id INT NOT NULL,
            patient_id INT DEFAULT NULL,
            title VARCHAR(255) DEFAULT NULL,
            all_day TINYINT DEFAULT NULL,
            starts_at DATETIME NOT NULL,
            ends_at DATETIME NOT NULL,
            type VARCHAR(255) DEFAULT NULL,
            notes LONGTEXT DEFAULT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME DEFAULT NULL,
            INDEX IDX_6A41727A6B899279 (patient_id),
            PRIMARY KEY (id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('CREATE TABLE counters (
            id INT AUTO_INCREMENT NOT NULL,
            name VARCHAR(50) NOT NULL,
            value LONGTEXT NOT NULL,
            UNIQUE INDEX UNIQ_451114915E237E06 (name),
            PRIMARY KEY (id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('CREATE TABLE customers (
            id INT AUTO_INCREMENT NOT NULL,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            full_name VARCHAR(255) DEFAULT NULL,
            tax_id VARCHAR(20) NOT NULL,
            email VARCHAR(180) DEFAULT NULL,
            phone VARCHAR(50) DEFAULT NULL,
            billing_address LONGTEXT DEFAULT NULL,
            created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            updated_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            UNIQUE INDEX UNIQ_62534E21D7E96D (tax_id),
            PRIMARY KEY (id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('CREATE TABLE invoice_lines (
            id INT AUTO_INCREMENT NOT NULL,
            invoice_id INT NOT NULL,
            concept VARCHAR(255) DEFAULT NULL,
            description LONGTEXT DEFAULT NULL,
            quantity INT NOT NULL,
            price DOUBLE PRECISION NOT NULL,
            amount DOUBLE PRECISION NOT NULL,
            INDEX IDX_72DBDC232989F1FD (invoice_id),
            PRIMARY KEY (id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('CREATE TABLE invoices (
            id INT AUTO_INCREMENT NOT NULL,
            customer_id INT DEFAULT NULL,
            number VARCHAR(20) NOT NULL,
            date DATETIME NOT NULL,
            amount DOUBLE PRECISION NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            phone VARCHAR(50) DEFAULT NULL,
            address VARCHAR(250) DEFAULT NULL,
            email VARCHAR(100) DEFAULT NULL,
            tax_id VARCHAR(15) DEFAULT NULL,
            currency VARCHAR(3) NOT NULL,
            created_at DATE NOT NULL,
            INDEX IDX_6A2F2F959395C3F3 (customer_id),
            PRIMARY KEY (id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('CREATE TABLE patients (
            id INT AUTO_INCREMENT NOT NULL,
            customer_id INT DEFAULT NULL,
            full_name VARCHAR(150) NOT NULL,
            first_name VARCHAR(50) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            date_of_birth DATE DEFAULT NULL,
            tax_id VARCHAR(15) DEFAULT NULL,
            phone VARCHAR(50) DEFAULT NULL,
            created_at DATE NOT NULL,
            address VARCHAR(250) DEFAULT NULL,
            email VARCHAR(100) DEFAULT NULL,
            profession VARCHAR(250) DEFAULT NULL,
            sports_activity VARCHAR(250) DEFAULT NULL,
            notes VARCHAR(250) DEFAULT NULL,
            rate VARCHAR(250) DEFAULT NULL,
            allergies VARCHAR(250) DEFAULT NULL,
            medication VARCHAR(250) DEFAULT NULL,
            systemic_diseases VARCHAR(250) DEFAULT NULL,
            surgeries VARCHAR(250) DEFAULT NULL,
            accidents VARCHAR(250) DEFAULT NULL,
            injuries VARCHAR(250) DEFAULT NULL,
            bruxism VARCHAR(250) DEFAULT NULL,
            insoles VARCHAR(250) DEFAULT NULL,
            others VARCHAR(250) DEFAULT NULL,
            status VARCHAR(20) DEFAULT \'active\' NOT NULL,
            INDEX IDX_2CCC2E2C9395C3F3 (customer_id),
            PRIMARY KEY (id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('CREATE TABLE records (
            id INT AUTO_INCREMENT NOT NULL,
            patient_id INT DEFAULT NULL,
            created_at DATE NOT NULL,
            consultation_reason LONGTEXT DEFAULT NULL,
            onset LONGTEXT DEFAULT NULL,
            radiology_tests LONGTEXT DEFAULT NULL,
            evolution LONGTEXT DEFAULT NULL,
            current_situation LONGTEXT DEFAULT NULL,
            sick_leave TINYINT DEFAULT NULL,
            physiotherapy_treatment LONGTEXT NOT NULL,
            medical_treatment LONGTEXT DEFAULT NULL,
            home_treatment LONGTEXT DEFAULT NULL,
            notes LONGTEXT DEFAULT NULL,
            INDEX IDX_9C9D58466B899279 (patient_id),
            PRIMARY KEY (id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('CREATE TABLE users (
            id INT AUTO_INCREMENT NOT NULL,
            email VARCHAR(180) NOT NULL,
            roles JSON NOT NULL,
            password VARCHAR(255) NOT NULL,
            UNIQUE INDEX UNIQ_1483A5E9E7927C74 (email),
            PRIMARY KEY (id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        // Audit table
        $this->addSql('CREATE TABLE audit_trail (
            id BIGINT AUTO_INCREMENT NOT NULL,
            changed_by INT DEFAULT NULL,
            entity_type VARCHAR(100) NOT NULL,
            entity_id VARCHAR(100) NOT NULL,
            operation VARCHAR(20) NOT NULL,
            changes JSON NOT NULL,
            changed_at DATETIME NOT NULL,
            ip_address VARCHAR(45) DEFAULT NULL,
            user_agent LONGTEXT DEFAULT NULL,
            INDEX idx_entity (entity_type, entity_id, changed_at),
            INDEX idx_operation (operation, changed_at),
            INDEX idx_changed_by (changed_by, changed_at),
            INDEX idx_changed_at (changed_at),
            INDEX IDX_B523E17810BC6D9F (changed_by),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        // Event Store table (for event sourcing)
        $this->addSql('CREATE TABLE event_store (
            id BIGINT AUTO_INCREMENT NOT NULL,
            aggregate_id VARCHAR(36) NOT NULL,
            event_name VARCHAR(255) NOT NULL,
            payload JSON NOT NULL,
            occurred_on DATETIME NOT NULL,
            version INT NOT NULL,
            INDEX idx_es_aggregate_id (aggregate_id),
            INDEX idx_es_event_name (event_name),
            INDEX idx_es_occurred_on (occurred_on),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        // Performance indexes for appointments
        $this->addSql('CREATE INDEX idx_appointments_starts_at ON appointments (starts_at)');
        $this->addSql('CREATE INDEX idx_appointments_ends_at ON appointments (ends_at)');

        // Foreign keys
        $this->addSql('ALTER TABLE appointments ADD CONSTRAINT FK_6A41727A6B899279 FOREIGN KEY (patient_id) REFERENCES patients (id)');
        $this->addSql('ALTER TABLE invoice_lines ADD CONSTRAINT FK_72DBDC232989F1FD FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE invoices ADD CONSTRAINT FK_6A2F2F959395C3F3 FOREIGN KEY (customer_id) REFERENCES customers (id)');
        $this->addSql('ALTER TABLE patients ADD CONSTRAINT FK_2CCC2E2C9395C3F3 FOREIGN KEY (customer_id) REFERENCES customers (id)');
        $this->addSql('ALTER TABLE records ADD CONSTRAINT FK_9C9D58466B899279 FOREIGN KEY (patient_id) REFERENCES patients (id)');
        $this->addSql('ALTER TABLE audit_trail ADD CONSTRAINT FK_B523E17810BC6D9F FOREIGN KEY (changed_by) REFERENCES users (id) ON DELETE SET NULL');
    }

    public function down(Schema $schema): void
    {
        // Drop indexes
        $this->addSql('DROP INDEX idx_appointments_starts_at ON appointments');
        $this->addSql('DROP INDEX idx_appointments_ends_at ON appointments');

        // Drop foreign keys
        $this->addSql('ALTER TABLE appointments DROP FOREIGN KEY FK_6A41727A6B899279');
        $this->addSql('ALTER TABLE invoice_lines DROP FOREIGN KEY FK_72DBDC232989F1FD');
        $this->addSql('ALTER TABLE invoices DROP FOREIGN KEY FK_6A2F2F959395C3F3');
        $this->addSql('ALTER TABLE patients DROP FOREIGN KEY FK_2CCC2E2C9395C3F3');
        $this->addSql('ALTER TABLE records DROP FOREIGN KEY FK_9C9D58466B899279');
        $this->addSql('ALTER TABLE audit_trail DROP FOREIGN KEY FK_B523E17810BC6D9F');

        // Drop tables
        $this->addSql('DROP TABLE appointments');
        $this->addSql('DROP TABLE counters');
        $this->addSql('DROP TABLE customers');
        $this->addSql('DROP TABLE invoice_lines');
        $this->addSql('DROP TABLE invoices');
        $this->addSql('DROP TABLE patients');
        $this->addSql('DROP TABLE records');
        $this->addSql('DROP TABLE users');
        $this->addSql('DROP TABLE audit_trail');
        $this->addSql('DROP TABLE event_store');
    }
}
