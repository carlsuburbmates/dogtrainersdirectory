-- Dog Trainers Directory - Neon Database Schema
-- Core tables for Melbourne dog trainer directory

-- ============================================
-- ENUMS
-- ============================================

DO $$ BEGIN
  CREATE TYPE region AS ENUM ('Inner City', 'Northern', 'Eastern', 'South Eastern', 'Western');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('trainer', 'admin', 'owner');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected', 'manual_review');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE age_specialty AS ENUM ('puppies_0_6m', 'adolescent_6_18m', 'adult_18m_7y', 'senior_7y_plus', 'rescue_dogs');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE behavior_issue AS ENUM (
    'pulling_on_lead', 'separation_anxiety', 'excessive_barking',
    'dog_aggression', 'leash_reactivity', 'jumping_up',
    'destructive_behaviour', 'recall_issues', 'anxiety_general',
    'resource_guarding', 'mouthing_nipping_biting', 'rescue_dog_support',
    'socialisation'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE service_type AS ENUM (
    'puppy_training', 'obedience_training', 'behaviour_consultations',
    'group_classes', 'private_training'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE resource_type AS ENUM (
    'trainer', 'behaviour_consultant', 'emergency_vet',
    'urgent_care', 'emergency_shelter'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- CORE GEOGRAPHY
-- ============================================

CREATE TABLE IF NOT EXISTS councils (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  region region NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS suburbs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  postcode TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  council_id INTEGER REFERENCES councils(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suburbs_name ON suburbs(name);
CREATE INDEX IF NOT EXISTS idx_suburbs_council ON suburbs(council_id);
CREATE INDEX IF NOT EXISTS idx_suburbs_postcode ON suburbs(postcode);

-- ============================================
-- BUSINESSES (trainers/consultants)
-- ============================================

CREATE TABLE IF NOT EXISTS businesses (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  suburb_id INTEGER REFERENCES suburbs(id),
  bio TEXT,
  short_bio TEXT,
  pricing TEXT,
  photo_url TEXT,
  cover_photo_url TEXT,
  abn TEXT,
  abn_verified BOOLEAN DEFAULT false,
  verification_status verification_status DEFAULT 'pending',
  resource_type resource_type DEFAULT 'trainer',
  years_experience INTEGER,
  certifications TEXT[],
  languages TEXT[] DEFAULT ARRAY['English'],
  is_mobile BOOLEAN DEFAULT false,
  service_radius_km INTEGER,
  is_active BOOLEAN DEFAULT true,
  is_claimed BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  featured_until TIMESTAMPTZ,
  average_rating NUMERIC(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  response_time_hours INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);
CREATE INDEX IF NOT EXISTS idx_businesses_suburb ON businesses(suburb_id);
CREATE INDEX IF NOT EXISTS idx_businesses_active ON businesses(is_active);
CREATE INDEX IF NOT EXISTS idx_businesses_featured ON businesses(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_businesses_rating ON businesses(average_rating DESC);

-- ============================================
-- TRAINER DETAILS (junction tables)
-- ============================================

CREATE TABLE IF NOT EXISTS trainer_services (
  id SERIAL PRIMARY KEY,
  business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
  service_type service_type NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  price_from NUMERIC(8,2),
  price_to NUMERIC(8,2),
  UNIQUE(business_id, service_type)
);

CREATE TABLE IF NOT EXISTS trainer_specializations (
  id SERIAL PRIMARY KEY,
  business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
  age_specialty age_specialty NOT NULL,
  UNIQUE(business_id, age_specialty)
);

CREATE TABLE IF NOT EXISTS trainer_behavior_issues (
  id SERIAL PRIMARY KEY,
  business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
  behavior_issue behavior_issue NOT NULL,
  UNIQUE(business_id, behavior_issue)
);

CREATE INDEX IF NOT EXISTS idx_trainer_services_biz ON trainer_services(business_id);
CREATE INDEX IF NOT EXISTS idx_trainer_specs_biz ON trainer_specializations(business_id);
CREATE INDEX IF NOT EXISTS idx_trainer_issues_biz ON trainer_behavior_issues(business_id);

-- ============================================
-- REVIEWS
-- ============================================

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  reviewer_email TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_business ON reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(is_approved) WHERE is_approved = true;

-- ============================================
-- EMERGENCY RESOURCES
-- ============================================

CREATE TABLE IF NOT EXISTS emergency_resources (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  resource_type resource_type NOT NULL,
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  suburb_id INTEGER REFERENCES suburbs(id),
  is_24_hour BOOLEAN DEFAULT false,
  emergency_hours TEXT,
  emergency_services TEXT[],
  cost_indicator TEXT,
  capacity_notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- SEARCH TELEMETRY
-- ============================================

CREATE TABLE IF NOT EXISTS search_telemetry (
  id SERIAL PRIMARY KEY,
  query TEXT,
  filters JSONB,
  result_count INTEGER,
  latency_ms INTEGER,
  suburb_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- HELPER FUNCTION: calculate_distance
-- ============================================

CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DOUBLE PRECISION, lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION, lon2 DOUBLE PRECISION
) RETURNS DOUBLE PRECISION AS $$
DECLARE
  R DOUBLE PRECISION := 6371;
  dlat DOUBLE PRECISION;
  dlon DOUBLE PRECISION;
  a DOUBLE PRECISION;
  c DOUBLE PRECISION;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- SEARCH RPC
-- ============================================

CREATE OR REPLACE FUNCTION search_trainers(
  p_suburb_id INTEGER DEFAULT NULL,
  p_radius_km INTEGER DEFAULT 15,
  p_age age_specialty DEFAULT NULL,
  p_issues behavior_issue[] DEFAULT NULL,
  p_service service_type DEFAULT NULL,
  p_query TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  business_id INTEGER,
  business_name TEXT,
  business_slug TEXT,
  business_phone TEXT,
  business_email TEXT,
  business_website TEXT,
  business_address TEXT,
  business_bio TEXT,
  business_short_bio TEXT,
  business_pricing TEXT,
  business_photo_url TEXT,
  suburb_name TEXT,
  suburb_postcode TEXT,
  council_name TEXT,
  council_region region,
  distance_km DOUBLE PRECISION,
  avg_rating NUMERIC,
  total_reviews INTEGER,
  age_specialties age_specialty[],
  behavior_issues_list behavior_issue[],
  services service_type[],
  is_verified BOOLEAN,
  is_featured_flag BOOLEAN,
  years_exp INTEGER,
  certifications_list TEXT[],
  is_mobile_flag BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.name,
    b.slug,
    b.phone,
    b.email,
    b.website,
    b.address,
    b.bio,
    b.short_bio,
    b.pricing,
    b.photo_url,
    s.name,
    s.postcode,
    c.name,
    c.region,
    CASE
      WHEN p_suburb_id IS NOT NULL THEN
        calculate_distance(
          (SELECT latitude FROM suburbs WHERE id = p_suburb_id),
          (SELECT longitude FROM suburbs WHERE id = p_suburb_id),
          s.latitude, s.longitude
        )
      ELSE 0
    END,
    b.average_rating,
    b.review_count,
    ARRAY(SELECT ts.age_specialty FROM trainer_specializations ts WHERE ts.business_id = b.id),
    ARRAY(SELECT tbi.behavior_issue FROM trainer_behavior_issues tbi WHERE tbi.business_id = b.id),
    ARRAY(SELECT tsv.service_type FROM trainer_services tsv WHERE tsv.business_id = b.id),
    (b.verification_status = 'verified'),
    b.is_featured,
    b.years_experience,
    b.certifications,
    b.is_mobile
  FROM businesses b
  LEFT JOIN suburbs s ON b.suburb_id = s.id
  LEFT JOIN councils c ON s.council_id = c.id
  WHERE b.is_active = true
    AND (p_suburb_id IS NULL OR calculate_distance(
      (SELECT latitude FROM suburbs WHERE id = p_suburb_id),
      (SELECT longitude FROM suburbs WHERE id = p_suburb_id),
      s.latitude, s.longitude
    ) <= p_radius_km)
    AND (p_age IS NULL OR EXISTS (
      SELECT 1 FROM trainer_specializations ts
      WHERE ts.business_id = b.id AND ts.age_specialty = p_age
    ))
    AND (p_issues IS NULL OR EXISTS (
      SELECT 1 FROM trainer_behavior_issues tbi
      WHERE tbi.business_id = b.id AND tbi.behavior_issue = ANY(p_issues)
    ))
    AND (p_service IS NULL OR EXISTS (
      SELECT 1 FROM trainer_services tsv
      WHERE tsv.business_id = b.id AND tsv.service_type = p_service
    ))
    AND (p_query IS NULL OR (
      b.name ILIKE '%' || p_query || '%'
      OR b.bio ILIKE '%' || p_query || '%'
      OR s.name ILIKE '%' || p_query || '%'
    ))
  ORDER BY
    b.is_featured DESC,
    CASE WHEN p_suburb_id IS NOT NULL THEN
      calculate_distance(
        (SELECT latitude FROM suburbs WHERE id = p_suburb_id),
        (SELECT longitude FROM suburbs WHERE id = p_suburb_id),
        s.latitude, s.longitude
      )
    ELSE 0 END ASC,
    b.average_rating DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;
