-- Add optional p_key to get_trainer_profile and forward to decrypt_sensitive
DROP FUNCTION IF EXISTS public.get_trainer_profile(integer);

CREATE OR REPLACE FUNCTION get_trainer_profile(p_business_id INTEGER, p_key TEXT DEFAULT NULL)
RETURNS TABLE (
    business_id INTEGER,
    business_name TEXT,
    abn_verified BOOLEAN,
    verification_status verification_status,
    address TEXT,
    website TEXT,
    email TEXT,
    phone TEXT,
    bio TEXT,
    pricing TEXT,
    featured_until TIMESTAMP WITH TIME ZONE,
    suburb_name TEXT,
    suburb_postcode TEXT,
    council_name TEXT,
    region region,
    average_rating NUMERIC,
    review_count INTEGER,
    age_specialties age_specialty[],
    behavior_issues behavior_issue[],
    services service_type[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.id,
        b.name,
        b.abn_verified,
        b.verification_status,
        b.address,
        b.website,
        decrypt_sensitive(b.email_encrypted, p_key),
        decrypt_sensitive(b.phone_encrypted, p_key),
        b.bio,
        b.pricing,
        b.featured_until,
        s.name,
        s.postcode,
        c.name,
        c.region,
        COALESCE(AVG(r.rating), 0),
        COUNT(r.id)::INTEGER,
        COALESCE(ARRAY_REMOVE(ARRAY_AGG(DISTINCT ts.age_specialty), NULL), ARRAY[]::age_specialty[]),
        COALESCE(ARRAY_REMOVE(ARRAY_AGG(DISTINCT tbi.behavior_issue), NULL), ARRAY[]::behavior_issue[]),
        COALESCE(ARRAY_REMOVE(ARRAY_AGG(DISTINCT tsvc.service_type), NULL), ARRAY[]::service_type[])
    FROM businesses b
    JOIN suburbs s ON b.suburb_id = s.id
    JOIN councils c ON s.council_id = c.id
    LEFT JOIN reviews r ON b.id = r.business_id AND r.is_approved = true
    LEFT JOIN trainer_specializations ts ON b.id = ts.business_id
    LEFT JOIN trainer_behavior_issues tbi ON b.id = tbi.business_id
    LEFT JOIN trainer_services tsvc ON b.id = tsvc.business_id
    WHERE 
        b.id = p_business_id
        AND b.is_active = true
        AND b.is_deleted = false
    GROUP BY 
        b.id, b.name, b.abn_verified, b.verification_status, b.address, b.website,
        b.email_encrypted, b.phone_encrypted, b.bio, b.pricing, b.featured_until,
        s.name, s.postcode, c.name, c.region;
END;
$$ LANGUAGE plpgsql;
