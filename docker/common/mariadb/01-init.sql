-- MariaDB Initialization Script
-- This script runs automatically when the MariaDB container is created for the first time
-- Files in docker-entrypoint-initdb.d/ are executed in alphabetical order

-- MariaDB does not require special extensions like PostgreSQL (unaccent, pg_trgm, etc.)
-- Instead, we use standard SQL features and MariaDB collations for text searching

-- Set default character set and collation for better text handling
-- utf8mb4 supports full Unicode including emojis
-- utf8mb4_unicode_ci provides case-insensitive and accent-insensitive comparisons
ALTER DATABASE physiotherapy_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Note: This file is intentionally minimal
-- Add custom initialization SQL here if needed in the future
