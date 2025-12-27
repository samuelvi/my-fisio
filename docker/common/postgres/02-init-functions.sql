-- Custom IMMUTABLE functions for generated columns
-- These wrapper functions allow using unaccent() in GENERATED columns

-- Function: lower_unaccent(text)
-- Converts text to lowercase and removes accents
-- Marked as IMMUTABLE to allow use in GENERATED columns
CREATE OR REPLACE FUNCTION lower_unaccent(text)
RETURNS text
LANGUAGE sql
IMMUTABLE PARALLEL SAFE STRICT
AS $$
    SELECT unaccent(LOWER($1));
$$;

-- Add comment for documentation
COMMENT ON FUNCTION lower_unaccent(text) IS
'Converts text to lowercase and removes accents. Marked as IMMUTABLE for use in GENERATED columns.';
