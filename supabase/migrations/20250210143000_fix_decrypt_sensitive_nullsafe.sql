-- Make decrypt_sensitive null-safe when pgcrypto.key isn't configured
CREATE OR REPLACE FUNCTION public.decrypt_sensitive(p_input text)
RETURNS text AS $$
DECLARE
  k text;
BEGIN
  -- current_setting(..., true) returns NULL instead of throwing if not set
  k := current_setting('pgcrypto.key', true);
  IF k IS NULL OR k = '' THEN
    -- no key configured; return NULL so callers can handle absent keys gracefully
    RETURN NULL;
  END IF;

  -- pgp_sym_decrypt accepts bytea input + key
  RETURN pgp_sym_decrypt(p_input::bytea, k);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
