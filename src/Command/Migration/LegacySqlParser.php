<?php

declare(strict_types=1);

namespace App\Command\Migration;

use Generator;

use function is_resource;

use RuntimeException;

use function sprintf;
use function strlen;

final class LegacySqlParser
{
    private function __construct()
    {
    }

    public static function create(): self
    {
        return new self();
    }

    /**
     * @return Generator<array{table: string, values: array}>
     */
    public function parse(string $filePath): Generator
    {
        $handle = fopen($filePath, 'r');
        if (!$handle) {
            throw new RuntimeException(sprintf('Could not open file "%s"', $filePath));
        }

        $buffer = '';

        try {
            while (($line = fgets($handle)) !== false) {
                $line = trim($line);

                if (empty($line) || str_starts_with($line, '--') || str_starts_with($line, '/*')) {
                    continue;
                }

                $buffer .= $line;

                if (str_ends_with($line, ';')) {
                    if (preg_match('/INSERT INTO `([^`]+)`(?:\s*\([^)]+\))?\s*VALUES\s*(.*);$/i', $buffer, $matches)) {
                        $tableName = $matches[1];
                        $valuesPart = $matches[2];

                        $rows = $this->parseValues($valuesPart);

                        foreach ($rows as $row) {
                            yield [
                                'table' => $tableName,
                                'values' => $row,
                            ];
                        }
                    }
                    $buffer = '';
                }
            }
        } finally {
            if (is_resource($handle)) {
                fclose($handle);
            }
        }
    }

    private function parseValues(string $input): array
    {
        $rows = [];
        $currentValue = '';
        $currentRow = [];
        $inString = false;
        $escaped = false;
        $parenthesisDepth = 0;

        $len = strlen($input);

        for ($i = 0; $i < $len; ++$i) {
            $char = $input[$i];

            if ($escaped) {
                $currentValue .= $char;
                $escaped = false;

                continue;
            }

            if ('\\' === $char) {
                $currentValue .= $char;
                $escaped = true;

                continue;
            }

            if ("'" === $char && !$escaped) {
                $inString = !$inString;
                $currentValue .= $char;

                continue;
            }

            if ($inString) {
                $currentValue .= $char;

                continue;
            }

            if ('(' === $char) {
                if ($parenthesisDepth > 0) {
                    $currentValue .= $char;
                }
                ++$parenthesisDepth;
            } elseif (')' === $char) {
                --$parenthesisDepth;
                if (0 === $parenthesisDepth) {
                    $currentRow[] = $this->cleanValue($currentValue);
                    $rows[] = $currentRow;
                    $currentRow = [];
                    $currentValue = '';
                    if (isset($input[$i + 1]) && ',' === $input[$i + 1]) {
                        ++$i;
                    }
                } else {
                    $currentValue .= $char;
                }
            } elseif (',' === $char && 1 === $parenthesisDepth) {
                $currentRow[] = $this->cleanValue($currentValue);
                $currentValue = '';
            } else {
                if ('' === $currentValue && ctype_space($char)) {
                    continue;
                }
                $currentValue .= $char;
            }
        }

        return $rows;
    }

    private function cleanValue(string $value): ?string
    {
        $value = trim($value);
        if ('NULL' === strtoupper($value)) {
            return null;
        }
        if (str_starts_with($value, "'") && str_ends_with($value, "'")) {
            $val = substr($value, 1, -1);

            return str_replace(["\'", '\\\\', "\r", "\n"], ["'", '\\', "\r", "\n"], $val);
        }

        return $value;
    }
}
