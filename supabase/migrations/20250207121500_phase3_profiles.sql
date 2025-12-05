-- Phase 3 updates: directory + profile support
CREATE OR REPLACE FUNCTION search_trainers(
    user_lat DECIMAL DEFAULT NULL,
    user_lng DECIMAL DEFAULT NULL,
    age_filters age_specialty[] DEFAULT NULL,
    issue_filters behavior_issue[] DEFAULT NULL,
    service_type_filter service_type DEFAULT NULL,
    verified_only BOOLEAN DEFAULT FALSE,
    rescue_only BOOLEAN DEFAULT FALSE,
    distance_filter TEXT DEFAULT 'any',
    price_max NUMERIC DEFAULT NULL,
    search_term TEXT DEFAULT NULL,
    result_limit INTEGER DEFAULT 50,
    result_offset INTEGER DEFAULT 0
) RETURNS TABLE (
    business_id INTEGER,
    business_name TEXT,
    business_email TEXT,
    business_phone TEXT,
    business_website TEXT,
    business_address TEXT,
    business_bio TEXT,
    business_pricing TEXT,
    featured_until TIMESTAMP WITH TIME ZONE,
    is_featured BOOLEAN,
    pricing_min_rate NUMERIC,
    abn_verified BOOLEAN,
    verification_status verification_status,
    suburb_name TEXT,
    council_name TEXT,
    region region,
    distance_km DECIMAL,
    average_rating DECIMAL,
    review_count INTEGER,
    age_specialties age_specialty[],
    behavior_issues behavior_issue[],
    services service_type[]
) AS $$
DECLARE
    search_pattern TEXT := CASE 
        WHEN search_term IS NULL OR LENGTH(TRIM(search_term)) = 0 THEN NULL
        ELSE '%' || TRIM(search_term) || '%'
    END;
BEGIN
    RETURN QUERY
    WITH trainer_base AS (
        SELECT 
            b.id as business_id,
            b.name as business_name,
            decrypt_sensitive(b.email_encrypted) as business_email,
            decrypt_sensitive(b.phone_encrypted) as business_phone,
            b.website as business_website,
            b.address as business_address,
            b.bio as business_bio,
            b.pricing as business_pricing,
            b.featured_until,
            (b.featured_until IS NOT NULL AND b.featured_until > NOW()) as is_featured,
            CASE 
                WHEN b.pricing IS NULL THEN NULL
                ELSE NULLIF((regexp_match(b.pricing, '([0-9]+(?:\\.[0-9]+)?)'))[1], '')::NUMERIC
            END as pricing_min_rate,
            b.abn_verified,
            b.verification_status,
            s.name as suburb_name,
            c.name as council_name,
            c.region,
            CASE 
                WHEN user_lat IS NULL OR user_lng IS NULL THEN NULL
                ELSE calculate_distance(user_lat, user_lng, s.latitude, s.longitude)
            END as distance_km,
            COALESCE(AVG(r.rating), 0) as average_rating,
            COUNT(r.id) as review_count,
            COALESCE(ARRAY_REMOVE(ARRAY_AGG(DISTINCT ts.age_specialty), NULL), ARRAY[]::age_specialty[]) as age_specialties,
            COALESCE(ARRAY_REMOVE(ARRAY_AGG(DISTINCT tbi.behavior_issue), NULL), ARRAY[]::behavior_issue[]) as behavior_issues,
            COALESCE(ARRAY_REMOVE(ARRAY_AGG(DISTINCT tsvc.service_type), NULL), ARRAY[]::service_type[]) as services
        FROM businesses b
        JOIN suburbs s ON b.suburb_id = s.id
        JOIN councils c ON s.council_id = c.id
        LEFT JOIN reviews r ON b.id = r.business_id AND r.is_approved = true
        LEFT JOIN trainer_specializations ts ON b.id = ts.business_id
        LEFT JOIN trainer_behavior_issues tbi ON b.id = tbi.business_id
        LEFT JOIN trainer_services tsvc ON b.id = tsvc.business_id
        WHERE 
            b.is_active = true 
            AND b.is_deleted = false
            AND b.resource_type IN ('trainer', 'behaviour_consultant')
        GROUP BY 
            b.id, b.name, b.email_encrypted, b.phone_encrypted, b.website, 
            b.address, b.bio, b.pricing, b.featured_until, b.abn_verified, b.verification_status,
            s.name, c.name, c.region, s.latitude, s.longitude
    )
    SELECT *
    FROM trainer_base tb
    WHERE
        (age_filters IS NULL OR tb.age_specialties && age_filters)
        AND (issue_filters IS NULL OR tb.behavior_issues && issue_filters)
        AND (service_type_filter IS NULL OR service_type_filter = ANY(tb.services))
        AND (verified_only = false OR tb.abn_verified = true)
        AND (rescue_only = false OR ARRAY['rescue_dogs']::age_specialty[] && tb.age_specialties)
        AND (
            user_lat IS NULL 
            OR distance_filter IS NULL 
            OR distance_filter = 'any'
            OR (distance_filter = '0-5' AND tb.distance_km <= 5)
            OR (distance_filter = '5-15' AND tb.distance_km > 5 AND tb.distance_km <= 15)
            OR (distance_filter = 'greater' AND tb.distance_km > 15)
        )
        AND (
            price_max IS NULL 
            OR tb.pricing_min_rate IS NULL 
            OR tb.pricing_min_rate <= price_max
        )
        AND (
            search_pattern IS NULL
            OR tb.business_name ILIKE search_pattern
            OR tb.suburb_name ILIKE search_pattern
            OR tb.council_name ILIKE search_pattern
            OR EXISTS (
                SELECT 1 FROM unnest(tb.behavior_issues) bi
                WHERE bi::text ILIKE search_pattern
            )
            OR EXISTS (
                SELECT 1 FROM unnest(tb.age_specialties) ag
                WHERE ag::text ILIKE search_pattern
            )
        )
    ORDER BY 
        tb.abn_verified DESC,
        tb.distance_km NULLS LAST,
        tb.average_rating DESC,
        tb.business_name ASC
    LIMIT result_limit
    OFFSET result_offset;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_trainer_profile(p_business_id INTEGER)
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
        decrypt_sensitive(b.email_encrypted),
        decrypt_sensitive(b.phone_encrypted),
        b.bio,
        b.pricing,
        b.featured_until,
        s.name,
        s.postcode,
        c.name,
        c.region,
        COALESCE(AVG(r.rating), 0),
        COUNT(r.id),
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
