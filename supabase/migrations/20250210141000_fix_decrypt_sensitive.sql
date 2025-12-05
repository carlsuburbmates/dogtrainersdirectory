-- Fix decrypt_sensitive to pass bytea to pgp_sym_decrypt
CREATE OR REPLACE FUNCTION public.decrypt_sensitive(p_input text)
RETURNS text AS $$
BEGIN
  -- ensure we call the pgp_sym_decrypt variant that accepts bytea + key
  RETURN pgp_sym_decrypt(p_input::bytea, current_setting('pgcrypto.key'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;
