<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Doctrine\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20251217000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create appointments table for managing appointment scheduling';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('
            CREATE TABLE appointments (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                title VARCHAR(255) DEFAULT NULL,
                all_day BOOLEAN DEFAULT NULL,
                starts_at TIMESTAMP NOT NULL,
                ends_at TIMESTAMP NOT NULL,
                url VARCHAR(255) DEFAULT NULL,
                class_name VARCHAR(255) DEFAULT NULL,
                editable BOOLEAN DEFAULT NULL,
                start_editable BOOLEAN DEFAULT NULL,
                duration_editable BOOLEAN DEFAULT NULL,
                rendering VARCHAR(255) DEFAULT NULL,
                overlap BOOLEAN DEFAULT NULL,
                constraint_id INTEGER DEFAULT NULL,
                source VARCHAR(255) DEFAULT NULL,
                color VARCHAR(255) DEFAULT NULL,
                background_color VARCHAR(255) DEFAULT NULL,
                text_color VARCHAR(255) DEFAULT NULL,
                custom_fields JSON DEFAULT NULL,
                notes TEXT DEFAULT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT NULL
            )
        ');

        $this->addSql('CREATE INDEX idx_appointments_user_id ON appointments (user_id)');
        $this->addSql('CREATE INDEX idx_appointments_starts_at ON appointments (starts_at)');
        $this->addSql('CREATE INDEX idx_appointments_ends_at ON appointments (ends_at)');

        $this->addSql('COMMENT ON TABLE appointments IS \'Appointment scheduling and calendar events\'');
        $this->addSql('COMMENT ON COLUMN appointments.user_id IS \'Reference to the user who owns this appointment\'');
        $this->addSql('COMMENT ON COLUMN appointments.all_day IS \'Whether the appointment spans the entire day\'');
        $this->addSql('COMMENT ON COLUMN appointments.starts_at IS \'Appointment start date and time\'');
        $this->addSql('COMMENT ON COLUMN appointments.ends_at IS \'Appointment end date and time\'');
        $this->addSql('COMMENT ON COLUMN appointments.custom_fields IS \'Additional custom fields stored as JSON\'');
        $this->addSql('COMMENT ON COLUMN appointments.notes IS \'Additional notes or comments about the appointment\'');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE IF EXISTS appointments');
    }
}
