<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Doctrine\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Creates cache_items table for Symfony PDO cache adapter.
 * Used for rate limiting and general caching in production (shared hosting without Redis/APCu).
 */
final class Version20260125000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Creates cache_items table for PDO cache adapter (rate limiting)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE cache_items (
            item_id VARBINARY(255) NOT NULL,
            item_data MEDIUMBLOB NOT NULL,
            item_lifetime INT UNSIGNED DEFAULT NULL,
            item_time INT UNSIGNED NOT NULL,
            PRIMARY KEY (item_id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_bin` ENGINE = InnoDB');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE cache_items');
    }
}
