<?php

declare(strict_types=1);

namespace App\Command\Migration;

use DateTime;
use Doctrine\ORM\EntityManagerInterface;
use Exception;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:migrate-legacy-data',
    description: 'Migrates data from a legacy MariaDB dump to the new PostgreSQL schema using defined mappings',
)]
final class MigrateLegacyDataCommand extends Command
{
    // Define types for transformation
    private const TYPE_INT = 'int';
    private const TYPE_STRING = 'string';
    private const TYPE_BOOL = 'bool';
    private const TYPE_DATE = 'date';
    private const TYPE_DATETIME = 'datetime';
    private const TYPE_JSON = 'json';
    private const TYPE_SERIALIZED = 'serialized'; // PHP Serialized -> JSON

    private const MAPPINGS = [
        'users' => [
            'target_table' => 'users',
            'columns' => [
                0 => ['legacy' => 'id', 'target' => 'id', 'type' => self::TYPE_INT],
                1 => ['legacy' => 'email', 'target' => 'email', 'type' => self::TYPE_STRING],
                2 => ['legacy' => 'roles', 'target' => 'roles', 'type' => self::TYPE_JSON],
                3 => ['legacy' => 'password', 'target' => 'password', 'type' => self::TYPE_STRING],
            ]
        ],
        'paciente' => [
            'target_table' => 'patients',
            'columns' => [
                0 => ['legacy' => 'paciente_id', 'target' => 'id', 'type' => self::TYPE_INT],
                1 => ['legacy' => 'nombre', 'target' => 'first_name', 'type' => self::TYPE_STRING],
                2 => ['legacy' => 'apellidos', 'target' => 'last_name', 'type' => self::TYPE_STRING],
                3 => ['legacy' => 'fecha_de_nacimiento', 'target' => 'date_of_birth', 'type' => self::TYPE_DATE],
                4 => ['legacy' => 'dni', 'target' => 'identity_document', 'type' => self::TYPE_STRING],
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
            ]
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
                11 => ['legacy' => 'tratamiento_en_casa', 'target' => 'home_treatment', 'type' => self::TYPE_STRING],
                12 => ['legacy' => 'notas', 'target' => 'notes', 'type' => self::TYPE_STRING],
            ]
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
                6 => ['legacy' => 'url', 'target' => 'url', 'type' => self::TYPE_STRING],
                7 => ['legacy' => 'className', 'target' => 'class_name', 'type' => self::TYPE_STRING],
                8 => ['legacy' => 'editable', 'target' => 'editable', 'type' => self::TYPE_BOOL],
                9 => ['legacy' => 'strartEditable', 'target' => 'start_editable', 'type' => self::TYPE_BOOL],
                10 => ['legacy' => 'durationEditable', 'target' => 'duration_editable', 'type' => self::TYPE_BOOL],
                11 => ['legacy' => 'rendering', 'target' => 'rendering', 'type' => self::TYPE_STRING],
                12 => ['legacy' => 'overlap', 'target' => 'overlap', 'type' => self::TYPE_BOOL],
                13 => ['legacy' => 'event_constraint', 'target' => 'constraint_id', 'type' => self::TYPE_INT],
                14 => ['legacy' => 'event_source', 'target' => 'source', 'type' => self::TYPE_STRING],
                15 => ['legacy' => 'color', 'target' => 'color', 'type' => self::TYPE_STRING],
                16 => ['legacy' => 'backgroundColor', 'target' => 'background_color', 'type' => self::TYPE_STRING],
                17 => ['legacy' => 'textColor', 'target' => 'text_color', 'type' => self::TYPE_STRING],
                18 => ['legacy' => 'customFields', 'target' => 'custom_fields', 'type' => self::TYPE_SERIALIZED],
                19 => ['legacy' => 'comentario', 'target' => 'notes', 'type' => self::TYPE_STRING],
            ]
        ],
    ];

    private readonly LegacySqlParser $parser;

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly string $projectDir
    ) {
        parent::__construct();
        $this->parser = new LegacySqlParser();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $dumpFile = $this->projectDir . '/private/dump.sql';

        if (!file_exists($dumpFile)) {
            $io->error(sprintf('Dump file not found at "%s"', $dumpFile));
            return Command::FAILURE;
        }

        $io->title('Migrating Legacy Data');
        
        $connection = $this->entityManager->getConnection();
        $connection->beginTransaction();

        try {
            $io->text('Cleaning existing data...');
            // TRUNCATE order matters due to foreign keys
            $connection->executeStatement('TRUNCATE TABLE appointments, records, customers, patients RESTART IDENTITY CASCADE');
            $connection->executeStatement('TRUNCATE TABLE users RESTART IDENTITY CASCADE');

            $io->text('Reading dump file...');
            
            $stats = ['users' => 0, 'paciente' => 0, 'historial' => 0, 'event' => 0];

            foreach ($this->parser->parse($dumpFile) as $entry) {
                $legacyTable = $entry['table'];
                $values = $entry['values'];

                if (!isset(self::MAPPINGS[$legacyTable])) {
                    continue;
                }

                $this->processRow($connection, $legacyTable, $values);
                $stats[$legacyTable]++;
            }

            // Reset sequences
            $io->text('Resetting sequences...');
            $this->resetSequence($connection, 'users');
            $this->resetSequence($connection, 'patients');
            $this->resetSequence($connection, 'records');
            $this->resetSequence($connection, 'appointments');
            $this->resetSequence($connection, 'customers');

            $connection->commit();
            
            $io->success('Migration completed successfully.');
            $io->table(
                ['Legacy Table', 'Imported Rows'],
                [
                    ['users', $stats['users']],
                    ['paciente', $stats['paciente']],
                    ['historial', $stats['historial']],
                    ['event', $stats['event']],
                ]
            );
            
            return Command::SUCCESS;
        } catch (Exception $e) {
            $connection->rollBack();
            $io->error('Migration failed: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }

    private function processRow($connection, string $legacyTable, array $row): void
    {
        $config = self::MAPPINGS[$legacyTable];
        $targetTable = $config['target_table'];
        $columns = $config['columns'];

        $targetColumns = [];
        $queryValues = [];
        $parameters = [];

        // Special handling for appointments created_at which doesn't exist in legacy
        if ($targetTable === 'appointments') {
            $targetColumns[] = 'created_at';
            $queryValues[] = ':created_at';
            // Use event_start (index 4) as created_at
            $parameters['created_at'] = $this->transformValue($row[4], self::TYPE_DATETIME);
        }

        foreach ($columns as $index => $colConfig) {
            // Handle cases where row might have fewer columns than expected (though unlikely in dump)
            $rawValue = $row[$index] ?? null;
            
            $targetColumns[] = $colConfig['target'];
            $paramName = $colConfig['target'];
            $queryValues[] = ':' . $paramName;
            
            $parameters[$paramName] = $this->transformValue($rawValue, $colConfig['type']);
        }

        // Special handling for user_id in appointments if it's missing or null
        if ($targetTable === 'appointments' && empty($parameters['user_id'])) {
             if (empty($parameters['user_id'])) {
                 $parameters['user_id'] = 1; // Default admin
             }
        }
        
        // Special handling for patients: created_at fallback
        if ($targetTable === 'patients' && empty($parameters['created_at'])) {
            $parameters['created_at'] = (new DateTime())->format('Y-m-d');
        }

        // Special handling for records: created_at fallback
        if ($targetTable === 'records' && empty($parameters['created_at'])) {
            $parameters['created_at'] = (new DateTime())->format('Y-m-d');
        }

        $sql = sprintf(
            'INSERT INTO %s (%s) VALUES (%s)',
            $targetTable,
            implode(', ', $targetColumns),
            implode(', ', $queryValues)
        );

        $connection->executeStatement($sql, $parameters);
    }

    private function transformValue(mixed $value, string $type): mixed
    {
        if ($value === null || $value === 'NULL') {
            return null;
        }

        return match ($type) {
            self::TYPE_INT => (int) $value,
            self::TYPE_BOOL => (bool) $value, // '1' -> true, '0' -> false
            self::TYPE_DATE => $this->formatDate($value),
            self::TYPE_DATETIME => $this->formatDate($value),
            self::TYPE_JSON => $this->isValidJson($value) ? $value : json_encode([]), // Ensure valid JSON
            self::TYPE_SERIALIZED => $this->convertSerializedToJson($value),
            default => (string) $value,
        };
    }

    private function formatDate(?string $date): ?string
    {
        if (!$date || $date === '0000-00-00' || $date === '0000-00-00 00:00:00') {
            return null;
        }
        return $date;
    }

    private function convertSerializedToJson(?string $value): ?string
    {
        if (!$value) {
            return null;
        }
        
        // Try to unserialize PHP serialized string with restricted classes
        $data = @unserialize($value, ['allowed_classes' => false]);
        
        if ($data === false && $value !== 'b:0;') {
            return json_encode([]); // Failed to unserialize
        }
        
        return json_encode($data);
    }

    private function isValidJson(string $string): bool
    {
        json_decode($string);
        return json_last_error() === JSON_ERROR_NONE;
    }

    private function resetSequence($connection, string $table): void
    {
        $sql = sprintf("SELECT setval('%s_id_seq', (SELECT MAX(id) FROM %s))", $table, $table);
        try {
            $connection->executeQuery($sql);
        } catch (Exception $e) {
            // Ignore if table is empty or seq doesn't exist
        }
    }
}
