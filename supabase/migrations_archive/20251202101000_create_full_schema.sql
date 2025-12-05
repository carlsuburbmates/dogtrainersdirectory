-- Migration: canonical initial schema for the project (idempotent)
-- This migration is generated to ensure `supabase/migrations/` contains the canonical project schema.
-- It mirrors the current `supabase/schema.sql` but uses IF NOT EXISTS for safe reapplication in CI.

-- Ensure pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create Enums
CREATE TYPE IF NOT EXISTS region AS ENUM (
    'Inner City',
    'Northern',
    'Eastern',
    'South Eastern',
    'Western'
);

CREATE TYPE IF NOT EXISTS user_role AS ENUM (
    'trainer',
    'admin'
);

CREATE TYPE IF NOT EXISTS verification_status AS ENUM (
    'pending',
    'verified',
    'rejected',
    'manual_review'
);

CREATE TYPE IF NOT EXISTS age_specialty AS ENUM (
    'puppies_0_6m',
    'adolescent_6_18m',
    'adult_18m_7y',
    'senior_7y_plus',
    'rescue_dogs'
);

CREATE TYPE IF NOT EXISTS behavior_issue AS ENUM (
    'pulling_on_lead',
    'separation_anxiety',
    'excessive_barking',
    'dog_aggression',
    'leash_reactivity',
    'jumping_up',
    'destructive_behaviour',
    'recall_issues',
    'anxiety_general',
    'resource_guarding',
    'mouthing_nipping_biting',
    'rescue_dog_support',
    'socialisation'
);

CREATE TYPE IF NOT EXISTS service_type AS ENUM (
    'puppy_training',
    'obedience_training',
    'behaviour_consultations',
    'group_classes',
    'private_training'
);

CREATE TYPE IF NOT EXISTS resource_type AS ENUM (
    'trainer',
    'behaviour_consultant',
    'emergency_vet',
    'urgent_care',
    'emergency_shelter'
);

-- Decrypt helper function (idempotent)
CREATE OR REPLACE FUNCTION decrypt_sensitive(text) RETURNS text AS $$
BEGIN
  RETURN pgp_sym_decrypt($1::text, current_setting('pgcrypto.key'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Councils
CREATE TABLE IF NOT EXISTS councils (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    region region NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suburbs
CREATE TABLE IF NOT EXISTS suburbs (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    postcode TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    council_id INTEGER REFERENCES councils(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, council_id)
);

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'trainer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Businesses
CREATE TABLE IF NOT EXISTS businesses (
    id SERIAL PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    website TEXT,
    address TEXT,
    suburb_id INTEGER REFERENCES suburbs(id),
    bio TEXT,
    pricing TEXT,
    emergency_hours TEXT,
    emergency_phone TEXT,
    emergency_services TEXT[],
    cost_indicator TEXT,
    capacity_notes TEXT,
    abn TEXT,
    abn_verified BOOLEAN DEFAULT FALSE,
    verification_status verification_status DEFAULT 'pending',
    resource_type resource_type NOT NULL DEFAULT 'trainer',
    phone_encrypted TEXT,
    email_encrypted TEXT,
    abn_encrypted TEXT,
    is_scaffolded BOOLEAN DEFAULT FALSE,
    is_claimed BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    featured_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trainer specializations
CREATE TABLE IF NOT EXISTS trainer_specializations (
    id SERIAL PRIMARY KEY,
    business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
    age_specialty age_specialty NOT NULL,
    UNIQUE(business_id, age_specialty)
);

-- Trainer behavior issues
CREATE TABLE IF NOT EXISTS trainer_behavior_issues (
    id SERIAL PRIMARY KEY,
    business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
    behavior_issue behavior_issue NOT NULL,
    UNIQUE(business_id, behavior_issue)
);

-- Trainer services
CREATE TABLE IF NOT EXISTS trainer_services (
    id SERIAL PRIMARY KEY,
    business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
    service_type service_type NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    UNIQUE(business_id, service_type)
);

-- Constraint function + trigger (idempotent)
CREATE OR REPLACE FUNCTION enforce_trainer_requires_specialization()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.resource_type = 'trainer') THEN
        PERFORM 1 FROM trainer_specializations ts WHERE ts.business_id = NEW.id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Trainer businesses must have at least one specialization.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the constraint trigger (DEFERRABLE is required for semantics)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trainer_requires_specialization_trg'
    ) THEN
        CREATE CONSTRAINT TRIGGER trainer_requires_specialization_trg
        AFTER INSERT OR UPDATE ON businesses
        DEFERRABLE INITIALLY DEFERRED
        FOR EACH ROW
        EXECUTE FUNCTION enforce_trainer_requires_specialization();
    END IF;
END$$;

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
    reviewer_name TEXT NOT NULL,
    reviewer_email TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    content TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emergency resources
CREATE TABLE IF NOT EXISTS emergency_resources (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    resource_type resource_type NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    website TEXT,
    address TEXT,
    suburb_id INTEGER REFERENCES suburbs(id),
    is_24_hour BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Featured placements
CREATE TABLE IF NOT EXISTS featured_placements (
    id SERIAL PRIMARY KEY,
    business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
    lga_id INTEGER REFERENCES councils(id),
    stripe_checkout_session_id TEXT UNIQUE,
    stripe_payment_intent_id TEXT UNIQUE,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Featured placement queue
CREATE TABLE IF NOT EXISTS featured_placement_queue (
    id SERIAL PRIMARY KEY,
    business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
    lga_id INTEGER REFERENCES councils(id),
    stripe_payment_intent_id TEXT UNIQUE,
    queue_position INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ABN verification records (idempotent)
CREATE TABLE IF NOT EXISTS abn_verifications (
    id SERIAL PRIMARY KEY,
    business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
    abn TEXT NOT NULL,
    business_name TEXT NOT NULL,
    matched_name TEXT,
    similarity_score DECIMAL(3, 2),
    verification_method TEXT NOT NULL CHECK (verification_method IN ('api', 'manual_upload')),
    status verification_status DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure matched_json exists (some migrations add it later)
ALTER TABLE abn_verifications
  ADD COLUMN IF NOT EXISTS matched_json jsonb DEFAULT NULL;

-- Webhook idempotency
CREATE TABLE IF NOT EXISTS webhook_events (
    id SERIAL PRIMARY KEY,
    stripe_event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Distance function
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL, lon1 DECIMAL,
    lat2 DECIMAL, lon2 DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
    RETURN 6371 * ACOS(
        COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
        COS(RADIANS(lon2) - RADIANS(lon1)) +
        SIN(RADIANS(lat1)) * SIN(RADIANS(lat2))
    );
END;
$$ LANGUAGE plpgsql;

-- Search function
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
            b.address, b.bio, b.pricing, b.abn_verified, b.verification_status,
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_suburbs_coordinates ON suburbs (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_suburbs_council ON suburbs (council_id);
CREATE INDEX IF NOT EXISTS idx_businesses_active ON businesses (is_active);
CREATE INDEX IF NOT EXISTS idx_businesses_abn_verified ON businesses (abn_verified);
CREATE INDEX IF NOT EXISTS idx_businesses_suburb ON businesses (suburb_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews (is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_business ON reviews (business_id);
CREATE INDEX IF NOT EXISTS idx_trainer_specializations_business ON trainer_specializations (business_id);
CREATE INDEX IF NOT EXISTS idx_trainer_behavior_issues_business ON trainer_behavior_issues (business_id);
CREATE INDEX IF NOT EXISTS idx_trainer_services_business ON trainer_services (business_id);
CREATE INDEX IF NOT EXISTS idx_emergency_resources_active ON emergency_resources (is_active);
CREATE INDEX IF NOT EXISTS idx_emergency_resources_type ON emergency_resources (resource_type);
CREATE INDEX IF NOT EXISTS idx_featured_placements_status ON featured_placements (status);
CREATE INDEX IF NOT EXISTS idx_featured_placements_dates ON featured_placements (start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events (processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_id ON webhook_events (stripe_event_id);
