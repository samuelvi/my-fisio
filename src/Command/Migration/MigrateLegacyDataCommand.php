<?php

declare(strict_types=1);

namespace App\Command\Migration;

use App\Domain\Entity\Application;
use App\Domain\Entity\User;
use App\Domain\Enum\PatientStatus;
use App\Infrastructure\Audit\AuditService;
use DateTime;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Exception;

use function in_array;
use function is_string;

use const JSON_ERROR_NONE;

use function sprintf;

use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsCommand(
    name: 'app:migrate-legacy-data',
    description: 'Migrates data from a legacy MariaDB dump to the new PostgreSQL schema using defined mappings',
)]
final class MigrateLegacyDataCommand extends Command
{
    private const TYPE_INT = 'int';
    private const TYPE_STRING = 'string';
    private const TYPE_BOOL = 'bool';
    private const TYPE_FLOAT = 'float';
    private const TYPE_DATE = 'date';
    private const TYPE_DATETIME = 'datetime';
    private const TYPE_JSON = 'json';
    private const TYPE_SERIALIZED = 'serialized';

    private const MAPPINGS = [
        'users' => [
            'target_table' => 'users',
            'columns' => [
                0 => ['legacy' => 'id', 'target' => 'id', 'type' => self::TYPE_INT],
                1 => ['legacy' => 'email', 'target' => 'email', 'type' => self::TYPE_STRING],
                2 => ['legacy' => 'roles', 'target' => 'roles', 'type' => self::TYPE_JSON],
                3 => ['legacy' => 'password', 'target' => 'password', 'type' => self::TYPE_STRING],
            ],
        ],
        'paciente' => [
            'target_table' => 'patients',
            'columns' => [
                0 => ['legacy' => 'paciente_id', 'target' => 'id', 'type' => self::TYPE_INT],
                1 => ['legacy' => 'nombre', 'target' => 'first_name', 'type' => self::TYPE_STRING],
                2 => ['legacy' => 'apellidos', 'target' => 'last_name', 'type' => self::TYPE_STRING],
                3 => ['legacy' => 'fecha_de_nacimiento', 'target' => 'date_of_birth', 'type' => self::TYPE_DATE],
                4 => ['legacy' => 'dni', 'target' => 'tax_id', 'type' => self::TYPE_STRING],
                5 => ['legacy' => 'telefono', 'target' => 'phone', 'type' => self::TYPE_STRING],
                6 => ['legacy' => 'fecha_de_creacion', 'target' => 'created_at', 'type' => self::TYPE_DATE],
                7 => ['legacy' => 'direccion', 'target' => 'address', 'type' => self::TYPE_STRING],
                8 => ['legacy' => 'email', 'target' => 'email', 'type' => self::TYPE_STRING],
                9 => ['legacy' => 'profesion', 'target' => 'profession', 'type' => self::TYPE_STRING],
                10 => ['legacy' => 'actividad_deportiva', 'target' => 'sports_activity', 'type' => self::TYPE_STRING],
                11 => ['legacy' => 'notas', 'target' => 'notes', 'type' => self::TYPE_STRING],
                12 => ['legacy' => 'tarifa', 'target' => 'rate', 'type' => self::TYPE_STRING],
                13 => ['legacy' => 'alergias', 'target' => 'allergies', 'type' => self::TYPE_STRING],
                14 => ['legacy' => 'medicacion', 'target' => 'medication', 'type' => self::TYPE_STRING],
                15 => ['legacy' => 'enfermedades_sistemicas', 'target' => 'systemic_diseases', 'type' => self::TYPE_STRING],
                16 => ['legacy' => 'intervenciones_quirurgicas', 'target' => 'surgeries', 'type' => self::TYPE_STRING],
                17 => ['legacy' => 'accidentes', 'target' => 'accidents', 'type' => self::TYPE_STRING],
                18 => ['legacy' => 'lesiones', 'target' => 'injuries', 'type' => self::TYPE_STRING],
                19 => ['legacy' => 'bruxismo', 'target' => 'bruxism', 'type' => self::TYPE_STRING],
                20 => ['legacy' => 'plantillas', 'target' => 'insoles', 'type' => self::TYPE_STRING],
                21 => ['legacy' => 'otros', 'target' => 'others', 'type' => self::TYPE_STRING],
            ],
        ],
        'historial' => [
            'target_table' => 'records',
            'columns' => [
                0 => ['legacy' => 'historial_id', 'target' => 'id', 'type' => self::TYPE_INT],
                1 => ['legacy' => 'paciente_id', 'target' => 'patient_id', 'type' => self::TYPE_INT],
                2 => ['legacy' => 'fecha_de_creacion', 'target' => 'created_at', 'type' => self::TYPE_DATE],
                3 => ['legacy' => 'motivo_consulta', 'target' => 'consultation_reason', 'type' => self::TYPE_STRING],
                4 => ['legacy' => 'aparicion', 'target' => 'onset', 'type' => self::TYPE_STRING],
                5 => ['legacy' => 'pruebas_rx', 'target' => 'radiology_tests', 'type' => self::TYPE_STRING],
                6 => ['legacy' => 'evolucion', 'target' => 'evolution', 'type' => self::TYPE_STRING],
                7 => ['legacy' => 'situacion_actual', 'target' => 'current_situation', 'type' => self::TYPE_STRING],
                8 => ['legacy' => 'baja_laboral', 'target' => 'sick_leave', 'type' => self::TYPE_BOOL],
                9 => ['legacy' => 'tratamiento_de_fisioterapia', 'target' => 'physiotherapy_treatment', 'type' => self::TYPE_STRING],
                10 => ['legacy' => 'tratamiento_medico', 'target' => 'medical_treatment', 'type' => self::TYPE_STRING],
                11 => ['legacy' => 'tratamiento_en casa', 'target' => 'home_treatment', 'type' => self::TYPE_STRING],
                12 => ['legacy' => 'notas', 'target' => 'notes', 'type' => self::TYPE_STRING],
            ],
        ],
        'event' => [
            'target_table' => 'appointments',
            'columns' => [
                0 => ['legacy' => 'evento_id', 'target' => 'id', 'type' => self::TYPE_INT],
                1 => ['legacy' => 'user_id', 'target' => 'user_id', 'type' => self::TYPE_INT],
                2 => ['legacy' => 'title', 'target' => 'title', 'type' => self::TYPE_STRING],
                3 => ['legacy' => 'allDay', 'target' => 'all_day', 'type' => self::TYPE_BOOL],
                4 => ['legacy' => 'event_start', 'target' => 'starts_at', 'type' => self::TYPE_DATETIME],
                5 => ['legacy' => 'event_end', 'target' => 'ends_at', 'type' => self::TYPE_DATETIME],
                15 => ['legacy' => 'color', 'target' => 'type', 'type' => self::TYPE_STRING],
                19 => ['legacy' => 'comentario', 'target' => 'notes', 'type' => self::TYPE_STRING],
            ],
        ],
        'factura' => [
            'target_table' => 'invoices',
            'columns' => [
                0 => ['legacy' => 'factura_id', 'target' => 'id', 'type' => self::TYPE_INT],
                1 => ['legacy' => 'numero', 'target' => 'number', 'type' => self::TYPE_STRING],
                2 => ['legacy' => 'fecha_de_factura', 'target' => 'date', 'type' => self::TYPE_DATETIME],
                3 => ['legacy' => 'total', 'target' => 'amount', 'type' => self::TYPE_FLOAT],
                4 => ['legacy' => 'nombre', 'target' => 'full_name', 'type' => self::TYPE_STRING],
                5 => ['legacy' => 'telefono', 'target' => 'phone', 'type' => self::TYPE_STRING],
                6 => ['legacy' => 'direccion', 'target' => 'address', 'type' => self::TYPE_STRING],
                7 => ['legacy' => 'email', 'target' => 'email', 'type' => self::TYPE_STRING],
                8 => ['legacy' => 'nif', 'target' => 'tax_id', 'type' => self::TYPE_STRING],
                9 => ['legacy' => 'fecha_de_creacion', 'target' => 'created_at', 'type' => self::TYPE_DATE],
            ],
        ],
        'factura_detalle' => [
            'target_table' => 'invoice_lines',
            'columns' => [
                0 => ['legacy' => 'factura_detalle_id', 'target' => 'id', 'type' => self::TYPE_INT],
                1 => ['legacy' => 'factura_id', 'target' => 'invoice_id', 'type' => self::TYPE_INT],
                2 => ['legacy' => 'precio', 'target' => 'price', 'type' => self::TYPE_FLOAT],
                3 => ['legacy' => 'total', 'target' => 'amount', 'type' => self::TYPE_FLOAT],
                4 => ['legacy' => 'concepto', 'target' => 'concept', 'type' => self::TYPE_STRING],
                5 => ['legacy' => 'cantidad', 'target' => 'quantity', 'type' => self::TYPE_INT],
                6 => ['legacy' => 'descripcion', 'target' => 'description', 'type' => self::TYPE_STRING],
            ],
        ],
        'contador' => [
            'target_table' => 'counters',
            'columns' => [
                0 => ['legacy' => 'nombre', 'target' => 'name', 'type' => self::TYPE_STRING],
                1 => ['legacy' => 'valor', 'target' => 'value', 'type' => self::TYPE_STRING],
            ],
        ],
    ];

    private readonly LegacySqlParser $parser;

    private ?string $hashedDefaultPassword = null;

    private array $validPatientIds = [];

    private ?int $defaultApplicationId = null;

    public function __construct(
        private readonly EntityManagerInterface      $entityManager,
        private readonly string                      $projectDir,
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly AuditService                $auditService,
    )
    {
        parent::__construct();
        $this->parser = LegacySqlParser::create();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $dumpFile = $this->projectDir . '/private/db5018529229_hosting-data_io.sql';

        if (!file_exists($dumpFile)) {
            $io->error(sprintf('Dump file not found at "%s"', $dumpFile));

            return Command::FAILURE;
        }

        // Disable audit trail for batch migration operations
        $this->auditService->disable();

        try {
            $io->title('Migrating Legacy Data');

            $connection = $this->entityManager->getConnection();

            $io->text('Cleaning existing data...');
            // MariaDB: Disable foreign key checks to allow truncating tables with foreign keys
            $connection->executeStatement('SET FOREIGN_KEY_CHECKS = 0');
            $connection->executeStatement('TRUNCATE TABLE appointments');
            $connection->executeStatement('TRUNCATE TABLE records');
            $connection->executeStatement('TRUNCATE TABLE customers');
            $connection->executeStatement('TRUNCATE TABLE patients');
            $connection->executeStatement('TRUNCATE TABLE invoices');
            $connection->executeStatement('TRUNCATE TABLE invoice_lines');
            $connection->executeStatement('TRUNCATE TABLE counters');
            $connection->executeStatement('TRUNCATE TABLE users');
            $connection->executeStatement('TRUNCATE TABLE applications');
            $connection->executeStatement('SET FOREIGN_KEY_CHECKS = 1');

            $io->text('Creating default application...');
            $connection->executeStatement("INSERT INTO applications (name) VALUES ('Default')");
            $this->defaultApplicationId = (int)$connection->lastInsertId();

            $io->text('Reading dump file and grouping data...');
        $dataByTable = [
            'users' => [],
            'paciente' => [],
            'historial' => [],
            'event' => [],
            'factura' => [],
            'factura_detalle' => [],
            'contador' => [],
        ];

        foreach ($this->parser->parse($dumpFile) as $entry) {
            $tableName = $entry['table'];
            if (isset($dataByTable[$tableName])) {
                $dataByTable[$tableName][] = $entry['values'];
            }
        }

        $io->text('Importing data in correct order...');
        $stats = [];
        $order = ['users', 'paciente', 'historial', 'event', 'factura', 'factura_detalle', 'contador'];

        foreach ($order as $tableName) {
            $io->text("Importing $tableName...");
            $count = 0;
            $connection->beginTransaction();
            foreach ($dataByTable[$tableName] as $values) {
                try {
                    $this->processRow($connection, $tableName, $values);

                    // Track valid patient IDs for referential integrity
                    if ('paciente' === $tableName) {
                        $this->validPatientIds[] = (int)$values[0];
                    }

                    ++$count;
                } catch (Exception $e) {
                    // silent
                }
            }
            if ($connection->isTransactionActive()) {
                $connection->commit();
            }
            $stats[$tableName] = $count;
        }

        $io->text('Resetting sequences...');
        foreach (['users', 'patients', 'records', 'appointments', 'invoices', 'invoice_lines', 'counters'] as $table) {
            $this->resetSequence($connection, $table);
        }

            $io->success('Migration completed successfully.');
            $io->table(
                ['Table', 'Count'],
                array_map(fn($k, $v) => [$k, $v], array_keys($stats), array_values($stats)),
            );

            return Command::SUCCESS;
        } finally {
            // Re-enable audit trail
            $this->auditService->enable();
        }
    }

    private function processRow(Connection $connection, string $legacyTable, array $row): void
    {
        $config = self::MAPPINGS[$legacyTable];
        $targetTable = $config['target_table'];
        $columns = $config['columns'];

        $targetColumns = [];
        $queryValues = [];
        $parameters = [];

        if ('appointments' === $targetTable) {
            $targetColumns[] = 'created_at';
            $queryValues[] = ':created_at';
            $parameters['created_at'] = $this->transformValue($row[4] ?? null, self::TYPE_DATETIME) ?? new DateTime()->format('Y-m-d H:i:s');

            // Legacy events don't have a patient_id, they will be NULL (deterministic)
            $targetColumns[] = 'patient_id';
            $queryValues[] = ':patient_id';
            $parameters['patient_id'] = null;
        }

        if ('users' === $targetTable) {
            $targetColumns[] = 'application_id';
            $queryValues[] = ':application_id';
            $parameters['application_id'] = $this->defaultApplicationId;
        }

        foreach ($columns as $index => $colConfig) {
            $rawValue = $row[$index] ?? null;
//            if ('users' === $targetTable && 'password' === $colConfig['target']) {
//                $rawValue = $this->getDefaultHashedPassword($row[1] ?? null);
//            }

            $targetColumns[] = $colConfig['target'];
            $paramName = $colConfig['target'];
            $queryValues[] = ':' . $paramName;

            $value = $this->transformValue($rawValue, $colConfig['type']);

            if ('appointments' === $targetTable && 'type' === $colConfig['target']) {
                if ('cita' === $value) {
                    $value = 'appointment';
                } elseif ('otros' === $value) {
                    $value = 'other';
                }
            }

            if ('counters' === $targetTable && 'name' === $colConfig['target']) {
                if (is_string($value) && str_starts_with($value, 'invoice_')) {
                    $value = 'invoices_' . substr($value, 8);
                }
            }

            $parameters[$paramName] = $value;
        }

        if ('patients' === $targetTable) {
            if (empty($parameters['created_at'])) {
                $parameters['created_at'] = new DateTime()->format('Y-m-d');
            }
            $targetColumns[] = 'status';
            $queryValues[] = ':status';
            $parameters['status'] = PatientStatus::ACTIVE->value;

            // Atomic calculation of full_name for the new column
            $targetColumns[] = 'full_name';
            $queryValues[] = ':full_name';
            $parameters['full_name'] = trim(sprintf('%s %s', $parameters['first_name'] ?? '', $parameters['last_name'] ?? ''));
        }

        if ('records' === $targetTable && empty($parameters['created_at'])) {
            $parameters['created_at'] = new DateTime()->format('Y-m-d');
        }

        if ('invoices' === $targetTable) {
            // Legacy invoices don't have currency field, use default from environment
            $targetColumns[] = 'currency';
            $queryValues[] = ':currency';
            $parameters['currency'] = $_ENV['DEFAULT_CURRENCY'] ?? 'EUR';
        }

        $sql = sprintf(
            'INSERT INTO %s (%s) VALUES (%s)',
            $targetTable,
            implode(', ', $targetColumns),
            implode(', ', $queryValues),
        );

        $connection->executeStatement('SAVEPOINT migration_row');

        try {
            $connection->executeStatement($sql, $parameters);
            $connection->executeStatement('RELEASE SAVEPOINT migration_row');
        } catch (Exception $e) {
            $connection->executeStatement('ROLLBACK TO SAVEPOINT migration_row');

            throw $e;
        }
    }

    private function transformValue(mixed $value, string $type): mixed
    {
        if (null === $value || 'NULL' === $value) {
            return null;
        }

        return match ($type) {
            self::TYPE_INT => (int)$value,
            self::TYPE_FLOAT => (float)$value,
            self::TYPE_BOOL => ('' === $value || '0' === $value || 0 === $value || false === $value) ? 0 : 1,
            self::TYPE_DATE,
            self::TYPE_DATETIME => $this->formatDate((string)$value),
            self::TYPE_JSON => $this->isValidJson((string)$value) ? $value : json_encode([]),
            self::TYPE_SERIALIZED => $this->convertSerializedToJson((string)$value),
            default => (string)$value,
        };
    }

    private function formatDate(?string $date): ?string
    {
        if (!$date || '0000-00-00' === $date || '0000-00-00 00:00:00' === $date || 'NULL' === $date) {
            return null;
        }

        return $date;
    }

    private function convertSerializedToJson(?string $value): string
    {
        if (!$value || 'NULL' === $value) {
            return (string)json_encode([]);
        }
        $data = @unserialize($value);

        return (string)json_encode(false !== $data ? $data : []);
    }

    private function isValidJson(string $string): bool
    {
        json_decode($string);

        return JSON_ERROR_NONE === json_last_error();
    }

    private function resetSequence(Connection $connection, string $table): void
    {
        // MariaDB: Reset AUTO_INCREMENT to MAX(id) + 1
        try {
            $maxId = $connection->fetchOne("SELECT MAX(id) FROM $table");
            if ($maxId !== null && $maxId !== false) {
                $nextId = (int)$maxId + 1;
                $connection->executeStatement("ALTER TABLE $table AUTO_INCREMENT = $nextId");
            }
        } catch (Exception $e) {
            // Silent: table might not exist or have no rows
        }
    }

    private function getDefaultHashedPassword(?string $email): string
    {
        if (null !== $this->hashedDefaultPassword) {
            return $this->hashedDefaultPassword;
        }

        $user = User::create(email: $email ?? 'legacy@example.com', password: 'password');
        $this->hashedDefaultPassword = $this->passwordHasher->hashPassword($user, 'password');

        return $this->hashedDefaultPassword;
    }
}
