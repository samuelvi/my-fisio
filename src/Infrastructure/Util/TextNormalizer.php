<?php

declare(strict_types=1);

namespace App\Infrastructure\Util;

use function iconv;
use function strtolower;

/**
 * Utility class for normalizing text for case-insensitive and accent-insensitive searches.
 *
 * This normalization matches the database generated columns that use unaccent(LOWER(text))
 */
final class TextNormalizer
{
    /**
     * Normalizes text by removing accents and converting to lowercase.
     *
     * This matches the PostgreSQL expression: unaccent(LOWER(text))
     *
     * @param string $text The text to normalize
     * @return string The normalized text (lowercase, no accents)
     */
    public static function normalize(string $text): string
    {
        // Convert to lowercase
        $text = strtolower($text);

        // Remove accents using iconv transliteration
        // This converts accented characters to their ASCII equivalents
        // Example: "García" -> "garcia", "José" -> "jose"
        $normalized = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text);

        // If iconv fails, return the lowercase version
        return $normalized !== false ? $normalized : $text;
    }

    /**
     * Prepares a search term for use in LIKE queries against normalized columns.
     *
     * @param string $searchTerm The user's search input
     * @return string The normalized search term ready for LIKE query
     */
    public static function prepareSearchTerm(string $searchTerm): string
    {
        return '%' . self::normalize($searchTerm) . '%';
    }
}
