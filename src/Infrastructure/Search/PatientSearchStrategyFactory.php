<?php

declare(strict_types=1);

namespace App\Infrastructure\Search;

use Doctrine\DBAL\Connection;
use Doctrine\DBAL\Platforms\MariaDBPlatform;
use Doctrine\DBAL\Platforms\MySQLPlatform;
use Doctrine\DBAL\Platforms\SQLitePlatform;
use RuntimeException;

use function get_class;
use function sprintf;

/**
 * Factory for creating the appropriate patient search strategy
 * based on the current database platform.
 */
final class PatientSearchStrategyFactory
{
    /**
     * Create the appropriate search strategy for the current database platform.
     *
     * @param Connection $connection The database connection
     * @return PatientSearchStrategyInterface The search strategy
     * @throws RuntimeException If the database platform is not supported
     */
    public static function create(Connection $connection): PatientSearchStrategyInterface
    {
        $platform = $connection->getDatabasePlatform();
        $platformClass = get_class($platform);

        return match (true) {
            $platform instanceof MariaDBPlatform,
            $platform instanceof MySQLPlatform,
            $platform instanceof SQLitePlatform => new MariaDBPatientSearchStrategy(),
            default => throw new RuntimeException(
                sprintf(
                    'Unsupported database platform "%s". Supported platforms: MariaDB, MySQL.',
                    $platformClass
                )
            ),
        };
    }
}
