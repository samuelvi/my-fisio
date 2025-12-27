-- PostgreSQL Extensions Initialization Script
-- This script runs automatically when the PostgreSQL container is created for the first time
-- Files in docker-entrypoint-initdb.d/ are executed in alphabetical order

-- Enable unaccent extension for accent-insensitive text searches
-- Used by generated columns: full_name_normalized = unaccent(LOWER(full_name))
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Enable pg_trgm extension for fuzzy/similarity searches (trigram matching)
-- Used for: similarity operator (%), levenshtein distance
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enable fuzzystrmatch extension for Levenshtein distance calculations
-- Used for: fuzzy patient searches with typo tolerance
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

-- Verify extensions are installed
DO $$
BEGIN
    RAISE NOTICE '✅ PostgreSQL extensions initialized successfully:';
    RAISE NOTICE '   - unaccent: Accent-insensitive searches';
    RAISE NOTICE '   - pg_trgm: Trigram similarity matching';
    RAISE NOTICE '   - fuzzystrmatch: Levenshtein distance (typo tolerance)';
END $$;
