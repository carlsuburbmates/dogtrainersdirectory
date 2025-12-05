-- Add decrypt_sensitive overload that accepts an explicit key argument
CREATE OR REPLACE FUNCTION public.decrypt_sensitive(p_input text, p_key text)
RETURNS text AS $$
DECLARE
  k text;
BEGIN
  -- If explicit key provided, prefer it
  IF p_key IS NOT NULL AND p_key <> '' THEN
    RETURN pgp_sym_decrypt(p_input::bytea, p_key);
  END IF;

  -- fallback to GUC if set (null-safe)
  k := current_setting('pgcrypto.key', true);
  IF k IS NULL OR k = '' THEN
    RETURN NULL;
  END IF;

  RETURN pgp_sym_decrypt(p_input::bytea, k);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
