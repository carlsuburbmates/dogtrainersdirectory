-- Add key-aware encrypt_sensitive helper to match decrypt_sensitive usage
CREATE OR REPLACE FUNCTION public.encrypt_sensitive(p_input text, p_key text)
RETURNS text AS $$
DECLARE
  k text;
BEGIN
  IF p_input IS NULL THEN
    RETURN NULL;
  END IF;

  IF p_key IS NOT NULL AND p_key <> '' THEN
    RETURN pgp_sym_encrypt(p_input::text, p_key);
  END IF;

  k := current_setting('pgcrypto.key', true);
  IF k IS NULL OR k = '' THEN
    RETURN NULL;
  END IF;

  RETURN pgp_sym_encrypt(p_input::text, k);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
