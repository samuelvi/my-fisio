<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Doctrine\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251230103734 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE appointments (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, title VARCHAR(255) DEFAULT NULL, all_day TINYINT DEFAULT NULL, starts_at DATETIME NOT NULL, ends_at DATETIME NOT NULL, type VARCHAR(255) DEFAULT NULL, notes LONGTEXT DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, patient_id INT DEFAULT NULL, INDEX IDX_6A41727A6B899279 (patient_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE counters (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(50) NOT NULL, value LONGTEXT NOT NULL, UNIQUE INDEX UNIQ_451114915E237E06 (name), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE customers (id INT AUTO_INCREMENT NOT NULL, first_name VARCHAR(100) NOT NULL, last_name VARCHAR(100) NOT NULL, full_name VARCHAR(255) DEFAULT NULL, tax_id VARCHAR(20) NOT NULL, email VARCHAR(180) DEFAULT NULL, phone VARCHAR(50) DEFAULT NULL, billing_address LONGTEXT DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE invoice_lines (id INT AUTO_INCREMENT NOT NULL, concept VARCHAR(255) DEFAULT NULL, description LONGTEXT DEFAULT NULL, quantity INT NOT NULL, price DOUBLE PRECISION NOT NULL, amount DOUBLE PRECISION NOT NULL, invoice_id INT NOT NULL, INDEX IDX_72DBDC232989F1FD (invoice_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE invoices (id INT AUTO_INCREMENT NOT NULL, number VARCHAR(20) NOT NULL, date DATETIME NOT NULL, amount DOUBLE PRECISION NOT NULL, full_name VARCHAR(255) NOT NULL, phone VARCHAR(50) DEFAULT NULL, address VARCHAR(250) DEFAULT NULL, email VARCHAR(100) DEFAULT NULL, tax_id VARCHAR(15) DEFAULT NULL, created_at DATE NOT NULL, customer_id INT DEFAULT NULL, INDEX IDX_6A2F2F959395C3F3 (customer_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE patients (id INT AUTO_INCREMENT NOT NULL, full_name VARCHAR(150) NOT NULL, first_name VARCHAR(50) NOT NULL, last_name VARCHAR(100) NOT NULL, date_of_birth DATE DEFAULT NULL, tax_id VARCHAR(15) DEFAULT NULL, phone VARCHAR(50) DEFAULT NULL, created_at DATE NOT NULL, address VARCHAR(250) DEFAULT NULL, email VARCHAR(100) DEFAULT NULL, profession VARCHAR(250) DEFAULT NULL, sports_activity VARCHAR(250) DEFAULT NULL, notes VARCHAR(250) DEFAULT NULL, rate VARCHAR(250) DEFAULT NULL, allergies VARCHAR(250) DEFAULT NULL, medication VARCHAR(250) DEFAULT NULL, systemic_diseases VARCHAR(250) DEFAULT NULL, surgeries VARCHAR(250) DEFAULT NULL, accidents VARCHAR(250) DEFAULT NULL, injuries VARCHAR(250) DEFAULT NULL, bruxism VARCHAR(250) DEFAULT NULL, insoles VARCHAR(250) DEFAULT NULL, others VARCHAR(250) DEFAULT NULL, status VARCHAR(20) DEFAULT \'active\' NOT NULL, customer_id INT DEFAULT NULL, INDEX IDX_2CCC2E2C9395C3F3 (customer_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE records (id INT AUTO_INCREMENT NOT NULL, created_at DATE NOT NULL, consultation_reason LONGTEXT DEFAULT NULL, onset LONGTEXT DEFAULT NULL, radiology_tests LONGTEXT DEFAULT NULL, evolution LONGTEXT DEFAULT NULL, current_situation LONGTEXT DEFAULT NULL, sick_leave TINYINT DEFAULT NULL, physiotherapy_treatment LONGTEXT NOT NULL, medical_treatment LONGTEXT DEFAULT NULL, home_treatment LONGTEXT DEFAULT NULL, notes LONGTEXT DEFAULT NULL, patient_id INT DEFAULT NULL, INDEX IDX_9C9D58466B899279 (patient_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE users (id INT AUTO_INCREMENT NOT NULL, email VARCHAR(180) NOT NULL, roles JSON NOT NULL, password VARCHAR(255) NOT NULL, UNIQUE INDEX UNIQ_1483A5E9E7927C74 (email), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE appointments ADD CONSTRAINT FK_6A41727A6B899279 FOREIGN KEY (patient_id) REFERENCES patients (id)');
        $this->addSql('ALTER TABLE invoice_lines ADD CONSTRAINT FK_72DBDC232989F1FD FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE invoices ADD CONSTRAINT FK_6A2F2F959395C3F3 FOREIGN KEY (customer_id) REFERENCES customers (id)');
        $this->addSql('ALTER TABLE patients ADD CONSTRAINT FK_2CCC2E2C9395C3F3 FOREIGN KEY (customer_id) REFERENCES customers (id)');
        $this->addSql('ALTER TABLE records ADD CONSTRAINT FK_9C9D58466B899279 FOREIGN KEY (patient_id) REFERENCES patients (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE appointments DROP FOREIGN KEY FK_6A41727A6B899279');
        $this->addSql('ALTER TABLE invoice_lines DROP FOREIGN KEY FK_72DBDC232989F1FD');
        $this->addSql('ALTER TABLE invoices DROP FOREIGN KEY FK_6A2F2F959395C3F3');
        $this->addSql('ALTER TABLE patients DROP FOREIGN KEY FK_2CCC2E2C9395C3F3');
        $this->addSql('ALTER TABLE records DROP FOREIGN KEY FK_9C9D58466B899279');
        $this->addSql('DROP TABLE appointments');
        $this->addSql('DROP TABLE counters');
        $this->addSql('DROP TABLE customers');
        $this->addSql('DROP TABLE invoice_lines');
        $this->addSql('DROP TABLE invoices');
        $this->addSql('DROP TABLE patients');
        $this->addSql('DROP TABLE records');
        $this->addSql('DROP TABLE users');
    }
}
