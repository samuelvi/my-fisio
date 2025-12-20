<?php

declare(strict_types=1);

namespace App\Command\Migration;

final class LegacySqlParser
{
    /**
     * @return \Generator<array{table: string, values: array}>
     */
    public function parse(string $filePath): \Generator
    {
        $handle = fopen($filePath, 'r');
        if (!$handle) {
            throw new \RuntimeException(sprintf('Could not open file "%s"', $filePath));
        }

        $currentTable = null;

        try {
            while (($line = fgets($handle)) !== false) {
                $line = trim($line);

                if (empty($line) || str_starts_with($line, '--') || str_starts_with($line, '/*')) {
                    continue;
                }

                if (str_starts_with($line, 'INSERT INTO')) {
                    if (preg_match('/INSERT INTO `([^`]+)`/', $line, $matches)) {
                        $currentTable = $matches[1];
                    }
                }

                if ($currentTable && str_contains($line, 'VALUES')) {
                    // Determine if this is a single line insert or multi-line
                    // For simplicity, we assume standard mysqldump format where VALUES are followed by (...)
                    // We will extract the content between parentheses
                    
                    // This is a naive parser but sufficient for standard dumps
                    // It splits by "),(" which is the standard separator in extended inserts
                    
                    $valuesPart = substr($line, strpos($line, 'VALUES') + 6);
                    $valuesPart = rtrim($valuesPart, ';');
                    
                    // Remove the first '(' and last ')'
                    // Note: This naive splitting breaks if string content contains "),("
                    // A robust parser would need a state machine, but we try this first for speed
                    
                    // Better approach: regex to capture balanced parentheses is hard in pure regex.
                    // We will rely on the fact that strings are escaped in SQL dumps.
                    
                    // Let's iterate through the string to respect quotes
                    $rows = $this->parseValues($valuesPart);
                    
                    foreach ($rows as $row) {
                        yield [
                            'table' => $currentTable,
                            'values' => $row
                        ];
                    }
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

        // Input looks like: (1, 'text', NULL), (2, 'text2', ...
        $len = strlen($input);
        
        for ($i = 0; $i < $len; $i++) {
            $char = $input[$i];

            if ($escaped) {
                $currentValue .= $char;
                $escaped = false;
                continue;
            }

            if ($char === '\\') {
                $currentValue .= $char;
                $escaped = true;
                continue;
            }

            if ($char === "'" && !$escaped) {
                $inString = !$inString;
                $currentValue .= $char;
                continue;
            }

            if ($inString) {
                $currentValue .= $char;
                continue;
            }

            // Not in string
            if ($char === '(') {
                if ($parenthesisDepth > 0) {
                    $currentValue .= $char;
                }
                $parenthesisDepth++;
            } elseif ($char === ')') {
                $parenthesisDepth--;
                if ($parenthesisDepth === 0) {
                    // End of row
                    $currentRow[] = $this->cleanValue($currentValue);
                    $rows[] = $currentRow;
                    $currentRow = [];
                    $currentValue = '';
                    // Skip the comma after the closing parenthesis if it exists
                    if (isset($input[$i + 1]) && $input[$i + 1] === ',') {
                        $i++;
                    }
                } else {
                    $currentValue .= $char;
                }
            } elseif ($char === ',' && $parenthesisDepth === 1) {
                // Separator between values
                $currentRow[] = $this->cleanValue($currentValue);
                $currentValue = '';
            } else {
                // Regular character (whitespace or part of unquoted value like numbers/NULL)
                // Skip leading whitespace for values
                if ($currentValue === '' && ctype_space($char)) {
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
        if (strtoupper($value) === 'NULL') {
            return null;
        }
        if (str_starts_with($value, "'") && str_ends_with($value, "'")) {
            // Unquote and unescape
            $val = substr($value, 1, -1);
            // Simple unescape for common SQL escapes
            return str_replace(["\'", "\\\\", "\r", "\n"], ["'", "\\", "\r", "\n"], $val);
        }
        return $value;
    }
}